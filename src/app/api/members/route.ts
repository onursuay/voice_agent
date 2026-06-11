import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VALID_ROLES = ['owner', 'admin', 'sales_manager', 'sales_rep', 'analyst', 'readonly'];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    const { data: members, error } = await supabase
      .from('organization_members')
      .select('*, profile:profiles(*)')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(members || []);
  } catch (err) {
    console.error('GET /api/members error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth: resolve caller ---
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    // --- Auth: only owner/admin may invite ---
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: owner or admin required' }, { status: 403 });
    }

    const orgId = membership.organization_id;

    // --- Parse body ---
    const body = await request.json();
    const {
      email,
      full_name,
      role = 'sales_rep',
      allowed_pages = null,
      lead_scope = 'assigned_only',
    } = body as {
      email: string;
      full_name?: string;
      role?: string;
      allowed_pages?: string[] | null;
      lead_scope?: string;
    };

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const admin = createServiceClient();

    // --- Generate invite link ---
    let userId: string;
    let actionLink: string | null = null;

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
    });

    if (linkErr) {
      // If the user already exists, look up by email in profiles
      const { data: prof } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!prof) {
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
      }
      userId = prof.id as string;
      actionLink = null; // existing user — already has an account
    } else {
      userId = linkData.user.id;
      actionLink = (linkData.properties as { action_link?: string } | undefined)?.action_link ?? null;
    }

    // --- Upsert profile ---
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert({ id: userId, email, full_name: full_name ?? null }, { onConflict: 'id' });

    if (profileErr) {
      console.error('Profile upsert error:', profileErr);
      return NextResponse.json({ error: 'Could not upsert profile: ' + profileErr.message }, { status: 500 });
    }

    // --- Insert membership (idempotent — ignore unique-constraint violations) ---
    const { error: memberErr } = await admin
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: userId,
        role: role || 'sales_rep',
        allowed_pages: allowed_pages ?? null,
        lead_scope: lead_scope || 'assigned_only',
        approval_status: 'approved',
      });

    if (memberErr) {
      // Unique-constraint violation codes: '23505' (PostgreSQL) — treat as already-member, continue
      const isAlreadyMember =
        memberErr.code === '23505' ||
        (memberErr.message && memberErr.message.toLowerCase().includes('duplicate'));

      if (!isAlreadyMember) {
        console.error('Membership insert error:', memberErr);
        return NextResponse.json({ error: 'Could not create membership: ' + memberErr.message }, { status: 500 });
      }
    }

    // --- Send invite email (non-fatal) ---
    let emailSent = false;
    try {
      const greeting = full_name ? `Merhaba ${full_name},` : 'Merhaba,';
      const actionBlock = actionLink
        ? `<p>Hesabını oluşturmak için aşağıdaki butona tıkla:</p>
           <p><a href="${actionLink}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Hesabını Oluştur</a></p>`
        : `<p>Hesabınız sisteme eklendi. Mevcut şifrenizle giriş yapabilirsiniz.</p>`;

      await sendEmail({
        to: email,
        subject: 'YO CRM — Hesap daveti',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="margin-bottom:8px">YO CRM'e davet edildiniz</h2>
            <p>${greeting}</p>
            <p>Organizasyona <strong>${role || 'sales_rep'}</strong> rolüyle eklendiniz.</p>
            ${actionBlock}
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
            <p style="color:#6b7280;font-size:12px">Bu e-postayı beklemiyorsanız dikkate almayın.</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (mailErr) {
      console.error('Invite email send failed (non-fatal):', mailErr);
    }

    return NextResponse.json({ success: true, user_id: userId, emailSent });
  } catch (err) {
    console.error('POST /api/members error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
