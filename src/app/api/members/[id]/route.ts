import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Resolve the caller's org + role. Returns null if unauthenticated / no org. */
async function resolveCallerMembership() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership) return null;
  return membership as { organization_id: string; role: string };
}

// PATCH /api/members/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caller = await resolveCallerMembership();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (caller.role !== 'owner' && caller.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: owner or admin required' }, { status: 403 });
    }

    const body = await request.json() as {
      allowed_pages?: string[] | null;
      lead_scope?: string;
      role?: string;
      approval_status?: string;
    };

    // Build update object from only provided + VALIDATED fields
    const VALID_ROLES = ['owner', 'admin', 'sales_manager', 'sales_rep', 'analyst', 'readonly'];
    const updates: Record<string, unknown> = {};
    if ('allowed_pages' in body && (Array.isArray(body.allowed_pages) || body.allowed_pages === null)) {
      updates.allowed_pages = body.allowed_pages;
    }
    if (body.lead_scope === 'all' || body.lead_scope === 'assigned_only') updates.lead_scope = body.lead_scope;
    if (typeof body.role === 'string' && VALID_ROLES.includes(body.role)) {
      // Yalnız owner, 'owner' rolü atayabilir (admin self-escalation engeli)
      if (body.role === 'owner' && caller.role !== 'owner') {
        return NextResponse.json({ error: 'Only an owner can grant the owner role' }, { status: 403 });
      }
      updates.role = body.role;
    }
    if (['approved', 'pending', 'rejected'].includes(body.approval_status ?? '')) {
      updates.approval_status = body.approval_status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const admin = createServiceClient();

    const { data: member, error } = await admin
      .from('organization_members')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', caller.organization_id) // org-scope: never touch another org's member
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/members/[id] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found or not in your organization' }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (err) {
    console.error('PATCH /api/members/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/members/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caller = await resolveCallerMembership();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (caller.role !== 'owner' && caller.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: owner or admin required' }, { status: 403 });
    }

    const admin = createServiceClient();

    const { error, count } = await admin
      .from('organization_members')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('organization_id', caller.organization_id); // org-scope: never delete from another org

    if (error) {
      console.error('DELETE /api/members/[id] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Member not found or not in your organization' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/members/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
