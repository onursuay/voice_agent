import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { to, subject, html } = await req.json();
  if (!to || !subject) return NextResponse.json({ error: 'to/subject required' }, { status: 400 });
  try {
    const res = await sendEmail({ to, subject, html: html || '' });
    return NextResponse.json({ id: res.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'send failed' }, { status: 500 });
  }
}
