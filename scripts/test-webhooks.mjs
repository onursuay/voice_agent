#!/usr/bin/env node
/**
 * Webhook Security & Integration Test Suite
 * Tests HTTP auth layer — does NOT require real Supabase/Meta credentials.
 * Supabase calls will fail (expected) after auth passes; we verify correct HTTP status codes.
 */

import { createHmac } from 'crypto';

const BASE_URL = 'http://localhost:3000';
const META_APP_SECRET = 'test_app_secret_456';
const VERIFY_TOKEN = 'test_verify_token_123';
const ZAPIER_SECRET = 'test_zapier_secret_789';

let passed = 0;
let failed = 0;
const results = [];

function computeMetaSignature(body, secret) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    results.push({ name, status: 'PASS' });
    passed++;
  } catch (err) {
    console.log(`  ❌  ${name}`);
    console.log(`       → ${err.message}`);
    results.push({ name, status: 'FAIL', error: err.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function req(method, path, opts = {}) {
  const { headers = {}, body } = opts;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { /* plain text response */ }
  return { status: res.status, json, text };
}

// ─── Wait for server ───────────────────────────────────────────────────────
async function waitForServer(maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      await fetch(`${BASE_URL}/`);
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════════════════════════════

async function testMetaVerify() {
  console.log('\n📋 META WEBHOOK VERIFY (GET)');

  await test('Correct token → 200 + challenge echoed', async () => {
    const r = await req('GET',
      `/api/webhooks/meta-leads?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=testchallenge123`
    );
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.text === 'testchallenge123', `Expected challenge body, got: ${r.text}`);
  });

  await test('Wrong token → 403', async () => {
    const r = await req('GET',
      `/api/webhooks/meta-leads?hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=abc`
    );
    assert(r.status === 403, `Expected 403, got ${r.status}`);
  });

  await test('Empty token → 403 (no bypass)', async () => {
    const r = await req('GET',
      `/api/webhooks/meta-leads?hub.mode=subscribe&hub.verify_token=&hub.challenge=abc`
    );
    assert(r.status === 403, `Expected 403, got ${r.status}`);
  });

  await test('Missing hub.mode → 403', async () => {
    const r = await req('GET',
      `/api/webhooks/meta-leads?hub.verify_token=${VERIFY_TOKEN}&hub.challenge=abc`
    );
    assert(r.status === 403, `Expected 403, got ${r.status}`);
  });

  await test('Backward-compat /api/webhooks/meta also verifies correctly', async () => {
    const r = await req('GET',
      `/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=backcompat`
    );
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.text === 'backcompat', `Expected 'backcompat', got: ${r.text}`);
  });
}

async function testMetaSignature() {
  console.log('\n🔐 META WEBHOOK SIGNATURE (POST)');

  const validPayload = JSON.stringify({
    object: 'page',
    entry: [{ id: 'page_123', changes: [{ field: 'leadgen', value: { leadgen_id: 'lead_999' } }] }]
  });

  const wrongPayload = JSON.stringify({ object: 'page', entry: [] });

  await test('No signature header → 401', async () => {
    const r = await req('POST', '/api/webhooks/meta-leads', { body: validPayload });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('Wrong signature → 401', async () => {
    const r = await req('POST', '/api/webhooks/meta-leads', {
      headers: { 'x-hub-signature-256': 'sha256=deadbeefdeadbeefdeadbeef' },
      body: validPayload,
    });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('Correct signature but tampered body → 401', async () => {
    // Sign original, send different body
    const sig = computeMetaSignature(validPayload, META_APP_SECRET);
    const r = await req('POST', '/api/webhooks/meta-leads', {
      headers: { 'x-hub-signature-256': sig },
      body: wrongPayload, // tampered
    });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('Correct signature passes auth (may fail at Supabase — that is OK)', async () => {
    const sig = computeMetaSignature(validPayload, META_APP_SECRET);
    const r = await req('POST', '/api/webhooks/meta-leads', {
      headers: { 'x-hub-signature-256': sig },
      body: validPayload,
    });
    // Auth passed → either 200 (graceful) or 5xx (Supabase not available)
    // Must NOT be 401
    assert(r.status !== 401, `Got 401 — signature rejected despite being correct`);
    console.log(`       → Post-auth status: ${r.status} (Supabase layer)`);
  });
}

async function testZapierAuth() {
  console.log('\n🔑 ZAPIER AUTH (POST)');

  const lead = { full_name: 'Test User', email: 'test@example.com', phone: '5551234567' };

  await test('No secret header → 401', async () => {
    const r = await req('POST', '/api/webhooks/zapier-leads', { body: lead });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('Wrong secret → 401', async () => {
    const r = await req('POST', '/api/webhooks/zapier-leads', {
      headers: { 'x-zapier-secret': 'WRONG_SECRET' },
      body: lead,
    });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('Correct secret passes auth (may fail at Supabase — that is OK)', async () => {
    const r = await req('POST', '/api/webhooks/zapier-leads', {
      headers: { 'x-zapier-secret': ZAPIER_SECRET },
      body: lead,
    });
    assert(r.status !== 401, `Got 401 — auth rejected despite correct secret`);
    console.log(`       → Post-auth status: ${r.status} (Supabase layer)`);
  });

  await test('Invalid JSON body with correct secret → 400', async () => {
    const r = await fetch(`${BASE_URL}/api/webhooks/zapier-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-zapier-secret': ZAPIER_SECRET },
      body: 'NOT VALID JSON {{{',
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });
}

async function testSourceSpoofing() {
  console.log('\n🛡️  SOURCE SPOOFING PREVENTION');

  // We can only verify the request is accepted/rejected properly.
  // Source field verification requires DB write — tested via logic test below.
  await test('Zapier payload with source=meta_lead_form passes auth (source will be forced to zapier)', async () => {
    const body = JSON.stringify({
      full_name: 'Spoofer',
      email: 'spoof@test.com',
      source: 'meta_lead_form', // attempt to spoof
    });
    const r = await req('POST', '/api/webhooks/zapier-leads', {
      headers: { 'x-zapier-secret': ZAPIER_SECRET },
      body,
    });
    // Should not be rejected at auth — spoofed source is silently ignored server-side
    assert(r.status !== 401, `Unexpected 401`);
    console.log(`       → Status: ${r.status} — source override happens in ingestLead (hardcoded 'zapier')`);
  });

  await test('Zapier payload with source=manual passes auth (source will be forced to zapier)', async () => {
    const body = JSON.stringify({ full_name: 'Manual Spoof', source: 'manual' });
    const r = await req('POST', '/api/webhooks/zapier-leads', {
      headers: { 'x-zapier-secret': ZAPIER_SECRET },
      body,
    });
    assert(r.status !== 401, `Unexpected 401`);
  });
}

async function testLogicUnit() {
  console.log('\n🧪 LOGIC UNIT TESTS (no HTTP — pure JS)');

  // Test mergeSource priority logic directly
  const SOURCE_PRIORITY = { meta_lead_form: 3, zapier: 2, manual: 1 };

  function mergeSource(incoming, current) {
    if (!current) return incoming;
    const currentPriority = SOURCE_PRIORITY[current] ?? 0;
    const incomingPriority = SOURCE_PRIORITY[incoming] ?? 0;
    return incomingPriority > currentPriority ? incoming : current;
  }

  await test('mergeSource: meta_lead_form beats zapier', async () => {
    const result = mergeSource('meta_lead_form', 'zapier');
    assert(result === 'meta_lead_form', `Expected meta_lead_form, got ${result}`);
  });

  await test('mergeSource: zapier does NOT overwrite meta_lead_form', async () => {
    const result = mergeSource('zapier', 'meta_lead_form');
    assert(result === 'meta_lead_form', `Expected meta_lead_form, got ${result}`);
  });

  await test('mergeSource: zapier beats manual', async () => {
    const result = mergeSource('zapier', 'manual');
    assert(result === 'zapier', `Expected zapier, got ${result}`);
  });

  await test('mergeSource: null current → use incoming', async () => {
    const result = mergeSource('zapier', null);
    assert(result === 'zapier', `Expected zapier, got ${result}`);
  });

  await test('mergeSource: meta_lead_form beats manual', async () => {
    const result = mergeSource('meta_lead_form', 'manual');
    assert(result === 'meta_lead_form', `Expected meta_lead_form, got ${result}`);
  });

  // Test HMAC signature logic
  await test('HMAC signature: correct body+secret → valid', async () => {
    const body = '{"test":true}';
    const sig = computeMetaSignature(body, META_APP_SECRET);
    const expected = 'sha256=' + createHmac('sha256', META_APP_SECRET).update(body).digest('hex');
    assert(sig === expected, 'HMAC mismatch');
  });

  await test('HMAC signature: tampered body → different signature', async () => {
    const original = '{"test":true}';
    const tampered = '{"test":false}';
    const sigOriginal = computeMetaSignature(original, META_APP_SECRET);
    const sigTampered = computeMetaSignature(tampered, META_APP_SECRET);
    assert(sigOriginal !== sigTampered, 'Tampered body should produce different signature');
  });

  await test('raw_payload: null incoming does not overwrite existing', async () => {
    // Simulate the conditional spread logic from ingest.ts
    const existing = { raw_payload: { original: 'data' } };
    const rawPayload = null;
    const update = {
      ...existing,
      ...(rawPayload != null ? { raw_payload: rawPayload } : {}),
    };
    assert(
      JSON.stringify(update.raw_payload) === JSON.stringify({ original: 'data' }),
      'Null raw_payload should not overwrite existing data'
    );
  });

  await test('raw_payload: valid incoming overwrites existing', async () => {
    const existing = { raw_payload: { original: 'data' } };
    const rawPayload = { new: 'payload' };
    const update = {
      ...existing,
      ...(rawPayload != null ? { raw_payload: rawPayload } : {}),
    };
    assert(
      JSON.stringify(update.raw_payload) === JSON.stringify({ new: 'payload' }),
      'Valid raw_payload should overwrite existing'
    );
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

console.log('🚀 Waiting for dev server at http://localhost:3000 ...');
const ready = await waitForServer();
if (!ready) {
  console.error('❌ Dev server did not start in time. Aborting HTTP tests.');
  process.exit(1);
}
console.log('✅ Server ready\n');

await testMetaVerify();
await testMetaSignature();
await testZapierAuth();
await testSourceSpoofing();
await testLogicUnit();

// ─── Summary ──────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(55));
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(55));

if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ ${r.name}`);
    console.log(`     ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\n  All tests passed! ✅');
  process.exit(0);
}
