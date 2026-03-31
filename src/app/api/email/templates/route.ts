import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// In-memory store for templates (used when Supabase table doesn't exist)
const inMemoryTemplates: Array<{
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}> = [];

async function getAuthContext(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return null;

  return { user, orgId: membership.organization_id };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const auth = await getAuthContext(supabase);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Try Supabase table first
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('organization_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist, use in-memory
      const templates = inMemoryTemplates.filter(t => t.organization_id === auth.orgId);
      return NextResponse.json({ templates, fallback: true });
    }

    return NextResponse.json({ templates: data || [] });
  } catch (err) {
    console.error('GET /api/email/templates error:', err);
    // Return in-memory fallback
    return NextResponse.json({ templates: inMemoryTemplates, fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const auth = await getAuthContext(supabase);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, subject, body: templateBody, variables } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Name, subject and body are required' }, { status: 400 });
    }

    const templateData = {
      organization_id: auth.orgId,
      user_id: auth.user.id,
      name,
      subject,
      body: templateBody,
      variables: variables || [],
    };

    // Try Supabase first
    const { data, error } = await supabase
      .from('email_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      // Fallback: store in memory
      const template = {
        id: crypto.randomUUID(),
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryTemplates.push(template);
      return NextResponse.json({ template, fallback: true }, { status: 201 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/email/templates error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
