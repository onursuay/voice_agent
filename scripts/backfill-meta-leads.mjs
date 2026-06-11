// One-time backfill: recover contact info for Meta lead-form leads whose
// full_name/phone/email were left null because the form used custom field
// names (adiniz, soyadiniz, email-adresi, telefon_numarasi) that the old
// parser didn't map. Re-parses raw_payload with the fixed parser.
//
// Usage:
//   node scripts/backfill-meta-leads.mjs            # dry run (no writes)
//   node scripts/backfill-meta-leads.mjs --apply    # apply updates
//
// Reads credentials from /tmp/.env.prod (vercel env pull) or .env.local.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { parseMetaLeadFields } from '../src/lib/meta.ts';

const APPLY = process.argv.includes('--apply');
const envPath = existsSync('/tmp/.env.prod') ? '/tmp/.env.prod' : '.env.local';
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// --- mirror ingest.ts normalizers ---
const sanitizeText = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const normalizeName = (v) => sanitizeText(v)?.replace(/\s+/g, ' ') || null;
const normalizeEmail = (v) => sanitizeText(v)?.toLowerCase() || null;
function normalizePhone(v) {
  const input = sanitizeText(v);
  if (!input) return null;
  const hasPlus = input.startsWith('+');
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('90') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}

// Rebuild field_data from raw_payload, falling back to custom_fields.
function fieldDataOf(lead) {
  const fd = lead.raw_payload?.graph_lead?.field_data;
  if (Array.isArray(fd) && fd.length) return fd;
  const cf = lead.custom_fields || {};
  return Object.entries(cf).map(([name, value]) => ({ name, values: [String(value)] }));
}

const { data: leads, error } = await sb
  .from('leads')
  .select('id, full_name, first_name, last_name, phone, email, custom_fields, raw_payload, source_platform')
  .eq('source_platform', 'meta_lead_form');
if (error) throw error;

const empty = leads.filter((l) => !l.full_name && !l.first_name && !l.last_name && !l.phone && !l.email);
console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}  |  env: ${envPath}`);
console.log(`Meta leads: ${leads.length}, empty: ${empty.length}\n`);

let recovered = 0,
  stillEmpty = 0,
  failed = 0;

for (const lead of empty) {
  const parsed = parseMetaLeadFields(fieldDataOf(lead));
  const fullName = normalizeName(parsed.full_name);
  const email = normalizeEmail(parsed.email);
  const phone = normalizePhone(parsed.phone);

  if (!fullName && !email && !phone) {
    stillEmpty++;
    console.log(`  SKIP ${lead.id.slice(0, 8)} — nothing parseable`);
    continue;
  }

  const update = {
    full_name: fullName,
    email,
    phone,
    custom_fields: parsed.custom_fields, // cleaned: mapped fields removed, only true extras (e.g. ulke) remain
    updated_at: new Date().toISOString(),
  };

  console.log(`  ${lead.id.slice(0, 8)} -> name="${fullName}" phone="${phone}" email="${email}" extras=${JSON.stringify(Object.keys(parsed.custom_fields))}`);
  recovered++;

  if (APPLY) {
    const { error: upErr } = await sb.from('leads').update(update).eq('id', lead.id);
    if (upErr) {
      failed++;
      console.log(`    ! update failed: ${upErr.message}`);
    }
  }
}

console.log(`\nSummary: recovered=${recovered}, stillEmpty=${stillEmpty}, failed=${failed}`);
if (!APPLY) console.log('Dry run only — re-run with --apply to write.');
