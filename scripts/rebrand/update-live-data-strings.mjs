/**
 * DijiGrow Rebrand — Live Supabase Data String Migration
 * =======================================================
 * USAGE:
 *   Dry-run  (default — no DB writes, prints impact counts only):
 *     node scripts/rebrand/update-live-data-strings.mjs
 *
 *   Apply (wraps all UPDATEs in a single transaction, ROLLBACK on any error):
 *     node scripts/rebrand/update-live-data-strings.mjs --apply
 *
 * ⚠️  WARNING: --apply mutates the LIVE Supabase database.
 *     Run with owner approval only, AFTER reviewing dry-run output.
 *     This script must be reviewed and executed by the controller — not Claude.
 *
 * DEPENDENCIES:
 *   `pg` is NOT in package.json. Before running, install it:
 *     npm i pg
 *   or run with it available in the environment.
 *
 * CONNECTION:
 *   Reads SUPABASE_DB_URL or DATABASE_URL from environment.
 *   TLS is enabled by default (Supabase hosted pooler uses CA-signed certs).
 *   Set sslmode=disable in the URL only if connecting to a local/dev instance
 *   without TLS. If you see a cert error on a custom host, set
 *   NODE_EXTRA_CA_CERTS=<path-to-root-ca.pem> rather than disabling verification.
 *
 * IDEMPOTENCY:
 *   All token replacements use `REPLACE(col, old, new)`. Re-running after
 *   a successful apply is a no-op (the old token is no longer present).
 *
 * TOKEN MAP (compound-first, case-sensitive):
 *   voiceagent.yodijital.com  → dijigrow.com
 *   info@yodijital.com        → info@dijigrow.com
 *   bildirim@yodijital.com    → bildirim@dijigrow.com
 *   yodijital.com             → dijigrow.com
 *   Yo Dijital                → DijiGrow
 *   VoiceAgent                → DijiGrow
 *   AI Orkestra               → DijiOrkestra
 */

import pg from 'pg';

const { Client } = pg;

const APPLY = process.argv.includes('--apply');

// ---------------------------------------------------------------------------
// Token map — ordered compound-first (longest/most-specific tokens before
// their sub-strings, e.g. email addresses before bare domain).
// ---------------------------------------------------------------------------
const TOKENS = [
  ['voiceagent.yodijital.com', 'dijigrow.com'],
  ['info@yodijital.com',       'info@dijigrow.com'],
  ['bildirim@yodijital.com',   'bildirim@dijigrow.com'],
  ['yodijital.com',            'dijigrow.com'],
  ['Yo Dijital',               'DijiGrow'],
  ['VoiceAgent',               'DijiGrow'],
  ['AI Orkestra',              'DijiOrkestra'],
];

// ---------------------------------------------------------------------------
// Build a chain of REPLACE(REPLACE(...)) for a column expression.
// ---------------------------------------------------------------------------
function buildReplaceChain(colExpr) {
  return TOKENS.reduce(
    (expr, [from, to]) => `REPLACE(${expr}, '${from.replace(/'/g, "''")}', '${to.replace(/'/g, "''")}')`,
    colExpr
  );
}

// ---------------------------------------------------------------------------
// Build a LIKE predicate: col LIKE '%token1%' OR col LIKE '%token2%' ...
// ---------------------------------------------------------------------------
function buildLikePredicate(colExpr) {
  return TOKENS.map(([from]) => `${colExpr} LIKE '%${from.replace(/'/g, "''")}%'`).join(' OR ');
}

// ---------------------------------------------------------------------------
// Print a count result nicely.
// ---------------------------------------------------------------------------
function logCount(label, count) {
  const n = parseInt(count, 10);
  const marker = n > 0 ? '  ⚡' : '  ✓ ';
  console.log(`${marker} ${label}: ${n} row(s) would be affected`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: Set SUPABASE_DB_URL or DATABASE_URL environment variable.');
    process.exit(1);
  }

  // TLS: honour whatever sslmode is embedded in the URL.
  // Supabase's hosted pooler (*.supabase.com) uses a valid CA-signed cert,
  // so full verification works. We do NOT disable rejectUnauthorized globally;
  // if you see a cert error, add the Supabase root CA to NODE_EXTRA_CA_CERTS
  // rather than bypassing verification.
  const sslFromUrl = connectionString.includes('sslmode=disable') ? false : true;
  const client = new Client({
    connectionString,
    ssl: sslFromUrl,
  });

  await client.connect();
  console.log('Connected to database.');
  console.log(APPLY ? '\n🔴 MODE: --apply (transaction will mutate live data)\n' : '\n🟡 MODE: dry-run (SELECT only — no writes)\n');

  try {
    // -----------------------------------------------------------------------
    // DRY-RUN: print impact counts for every target
    // -----------------------------------------------------------------------

    // --- organizations ---
    {
      const predicate = `(slug = 'yo-dijital' OR name = 'Yo Dijital')`;
      const res = await client.query(`SELECT count(*) FROM organizations WHERE ${predicate}`);
      logCount('organizations (name/slug)', res.rows[0].count);
    }

    // --- lead_activities: metadata->>'subject' ---
    {
      const predicate = buildLikePredicate(`metadata->>'subject'`);
      const res = await client.query(`SELECT count(*) FROM lead_activities WHERE ${predicate}`);
      logCount('lead_activities (metadata subject)', res.rows[0].count);
    }

    // --- email_templates: subject + body ---
    {
      const pred = `${buildLikePredicate('subject')} OR ${buildLikePredicate('body')}`;
      const res = await client.query(`SELECT count(*) FROM email_templates WHERE ${pred}`);
      logCount('email_templates (subject + body)', res.rows[0].count);
    }

    // --- email_log: subject + body ---
    {
      const pred = `${buildLikePredicate('subject')} OR ${buildLikePredicate('body')}`;
      const res = await client.query(`SELECT count(*) FROM email_log WHERE ${pred}`);
      logCount('email_log (subject + body)', res.rows[0].count);
    }

    // --- lead_notes: content ---
    {
      const pred = buildLikePredicate('content');
      const res = await client.query(`SELECT count(*) FROM lead_notes WHERE ${pred}`);
      logCount('lead_notes (content)', res.rows[0].count);
    }

    // --- call_logs: transcript + summary ---
    {
      const pred = `${buildLikePredicate('transcript')} OR ${buildLikePredicate('summary')}`;
      const res = await client.query(`SELECT count(*) FROM call_logs WHERE ${pred}`);
      logCount('call_logs (transcript + summary)', res.rows[0].count);
    }

    // --- sequences: name ---
    {
      const pred = buildLikePredicate('name');
      const res = await client.query(`SELECT count(*) FROM sequences WHERE ${pred}`);
      logCount('sequences (name)', res.rows[0].count);
    }

    // --- automation_rules: name + trigger_config + action_config (jsonb cast to text) ---
    {
      const pred = `${buildLikePredicate('name')} OR ${buildLikePredicate('trigger_config::text')} OR ${buildLikePredicate('action_config::text')}`;
      const res = await client.query(`SELECT count(*) FROM automation_rules WHERE ${pred}`);
      logCount('automation_rules (name + config jsonb)', res.rows[0].count);
    }

    if (!APPLY) {
      console.log('\nDry-run complete. Re-run with --apply to execute.');
      return;
    }

    // -----------------------------------------------------------------------
    // APPLY: safety snapshot → transaction → updates
    // -----------------------------------------------------------------------
    console.log('\n--- Starting apply phase ---\n');

    // Safety snapshot into lead_backups
    // Schema confirmed: (id, organization_id, taken_at, reason, lead_count, payload)
    // We snapshot ALL leads per org into a single JSONB payload row.
    console.log('Taking pre-rebrand lead_backups snapshot...');
    const snapshotRes = await client.query(`
      INSERT INTO lead_backups (organization_id, taken_at, reason, lead_count, payload)
      SELECT
        organization_id,
        now(),
        'pre_rebrand',
        count(*)::integer,
        jsonb_agg(to_jsonb(leads))
      FROM leads
      WHERE deleted_at IS NULL
      GROUP BY organization_id
      RETURNING id, organization_id, lead_count
    `);
    for (const row of snapshotRes.rows) {
      console.log(`  Snapshot: org=${row.organization_id} leads=${row.lead_count} backup_id=${row.id}`);
    }

    // Transaction
    await client.query('BEGIN');
    console.log('\nBEGIN transaction\n');

    try {
      // 1) organizations — slug has UNIQUE constraint, guard against collision
      const existsRes = await client.query(`SELECT 1 FROM organizations WHERE slug = 'dijigrow' LIMIT 1`);
      if (existsRes.rowCount > 0) {
        console.log('  SKIP organizations: slug=dijigrow already exists (already rebranded or collision)');
      } else {
        const orgRes = await client.query(`
          UPDATE organizations
          SET name = 'DijiGrow', slug = 'dijigrow', updated_at = now()
          WHERE slug = 'yo-dijital' OR name = 'Yo Dijital'
        `);
        console.log(`  UPDATE organizations: ${orgRes.rowCount} row(s) updated`);
      }

      // 2) lead_activities: replace tokens inside metadata->>'subject' via jsonb_set
      // We rebuild the metadata jsonb with the replaced subject value.
      console.log('  Updating lead_activities metadata subject...');
      const actSubjectExpr = buildReplaceChain(`metadata->>'subject'`);
      const actPred = buildLikePredicate(`metadata->>'subject'`);
      const actRes = await client.query(`
        UPDATE lead_activities
        SET metadata = jsonb_set(
          metadata,
          '{subject}',
          to_jsonb(${actSubjectExpr})
        )
        WHERE metadata ? 'subject'
          AND (${actPred})
      `);
      console.log(`  UPDATE lead_activities: ${actRes.rowCount} row(s) updated`);

      // 3) email_templates: subject + body
      console.log('  Updating email_templates...');
      const etSubjectChain = buildReplaceChain('subject');
      const etBodyChain    = buildReplaceChain('body');
      const etPred = `${buildLikePredicate('subject')} OR ${buildLikePredicate('body')}`;
      const etRes = await client.query(`
        UPDATE email_templates
        SET subject    = ${etSubjectChain},
            body       = ${etBodyChain},
            updated_at = now()
        WHERE ${etPred}
      `);
      console.log(`  UPDATE email_templates: ${etRes.rowCount} row(s) updated`);

      // 4) email_log: subject + body
      console.log('  Updating email_log...');
      const elSubjectChain = buildReplaceChain('subject');
      const elBodyChain    = buildReplaceChain('body');
      const elPred = `${buildLikePredicate('subject')} OR ${buildLikePredicate('body')}`;
      const elRes = await client.query(`
        UPDATE email_log
        SET subject    = ${elSubjectChain},
            body       = ${elBodyChain}
        WHERE ${elPred}
      `);
      console.log(`  UPDATE email_log: ${elRes.rowCount} row(s) updated`);

      // 5) lead_notes: content
      console.log('  Updating lead_notes...');
      const lnChain = buildReplaceChain('content');
      const lnPred  = buildLikePredicate('content');
      const lnRes = await client.query(`
        UPDATE lead_notes
        SET content    = ${lnChain},
            updated_at = now()
        WHERE ${lnPred}
      `);
      console.log(`  UPDATE lead_notes: ${lnRes.rowCount} row(s) updated`);

      // 6) call_logs: transcript + summary (no updated_at in schema)
      console.log('  Updating call_logs...');
      const clTranscriptChain = buildReplaceChain('transcript');
      const clSummaryChain    = buildReplaceChain('summary');
      const clPred = `${buildLikePredicate('transcript')} OR ${buildLikePredicate('summary')}`;
      const clRes = await client.query(`
        UPDATE call_logs
        SET transcript = CASE WHEN transcript IS NOT NULL THEN ${clTranscriptChain} ELSE NULL END,
            summary    = CASE WHEN summary    IS NOT NULL THEN ${clSummaryChain}    ELSE NULL END
        WHERE ${clPred}
      `);
      console.log(`  UPDATE call_logs: ${clRes.rowCount} row(s) updated`);

      // 7) sequences: name
      console.log('  Updating sequences...');
      const seqChain = buildReplaceChain('name');
      const seqPred  = buildLikePredicate('name');
      const seqRes = await client.query(`
        UPDATE sequences
        SET name       = ${seqChain},
            updated_at = now()
        WHERE ${seqPred}
      `);
      console.log(`  UPDATE sequences: ${seqRes.rowCount} row(s) updated`);

      // 8) automation_rules: name + trigger_config (jsonb) + action_config (jsonb)
      // Cast jsonb to text, apply REPLACE, cast back — safe for text tokens.
      console.log('  Updating automation_rules...');
      const arNameChain    = buildReplaceChain('name');
      const arTriggerChain = buildReplaceChain('trigger_config::text');
      const arActionChain  = buildReplaceChain('action_config::text');
      const arPred = `${buildLikePredicate('name')} OR ${buildLikePredicate('trigger_config::text')} OR ${buildLikePredicate('action_config::text')}`;
      const arRes = await client.query(`
        UPDATE automation_rules
        SET name          = ${arNameChain},
            trigger_config = (${arTriggerChain})::jsonb,
            action_config  = (${arActionChain})::jsonb,
            updated_at    = now()
        WHERE ${arPred}
      `);
      console.log(`  UPDATE automation_rules: ${arRes.rowCount} row(s) updated`);

      await client.query('COMMIT');
      console.log('\nCOMMIT — all updates applied successfully.');

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('\nROLLBACK — error during transaction:', err.message);
      throw err;
    }

    // Post-apply verification
    console.log('\n--- Verification ---');
    const verifyOrg = await client.query(
      `SELECT name, slug FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'`
    );
    if (verifyOrg.rowCount > 0) {
      const row = verifyOrg.rows[0];
      const ok = row.name === 'DijiGrow' && row.slug === 'dijigrow';
      console.log(`  organizations seed row: name=${row.name} slug=${row.slug} ${ok ? '✓' : '✗ UNEXPECTED'}`);
    } else {
      console.log('  organizations seed row: not found (may not be seed data in live)');
    }

  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
