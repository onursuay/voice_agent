import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, full_name, organization_name } = await request.json();

    if (!user_id || !email || !full_name || !organization_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Kimlik doğrula: çağıran, oturum sahibi user_id ile aynı olmalı.
    // (Servis-rol anahtarıyla rastgele user_id enjeksiyonu / membership injection engellenir.)
    const authClient = await createServerSupabaseClient();
    const { data: { user: authUser } } = await authClient.auth.getUser();
    if (!authUser || authUser.id !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // 1) Upsert profile (idempotent - safe to retry)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user_id,
      email,
      full_name,
    }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Could not create profile: " + profileError.message }, { status: 500 });
    }

    // 2) Check if user already has an org
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      // Already set up - return existing org
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", existingMember.organization_id)
        .single();
      return NextResponse.json({ success: true, organization: existingOrg });
    }

    // 3) Determine target company org (single-company model)
    let targetOrgId: string | null = null;

    // 3a) Prefer DEFAULT_ORG_ID env var if set
    if (process.env.DEFAULT_ORG_ID && process.env.DEFAULT_ORG_ID.trim() !== "") {
      targetOrgId = process.env.DEFAULT_ORG_ID.trim();
    } else {
      // 3b) Otherwise look for the first-ever org (oldest by created_at)
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1);
      if (orgs && orgs.length > 0) {
        targetOrgId = orgs[0].id as string;
      }
    }

    if (targetOrgId !== null) {
      // 4a) Company org already exists — join as pending sales_rep
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: targetOrgId,
          user_id,
          role: "sales_rep",
          approval_status: "pending",
        });

      if (memberError) {
        console.error("Membership error:", memberError);
        return NextResponse.json(
          { error: "Could not create membership: " + memberError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, pending: true, organization_id: targetOrgId });
    }

    // 4b) NO org exists yet — this is the FIRST user: bootstrap as owner (approved by default)
    let slug = slugify(organization_name) || `org-${Date.now()}`;

    // Handle slug conflicts
    const { data: slugCheck } = await supabase.from("organizations").select("id").eq("slug", slug).single();
    if (slugCheck) slug = `${slug}-${Date.now().toString(36)}`;

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: organization_name, slug })
      .select()
      .single();

    if (orgError) {
      console.error("Organization error:", orgError);
      return NextResponse.json({ error: "Could not create organization: " + orgError.message }, { status: 500 });
    }

    // Owner membership — approval_status defaults to 'approved' in DB, explicitly set for clarity
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: orgData.id, user_id, role: "owner", approval_status: "approved" });

    if (memberError) {
      console.error("Membership error:", memberError);
      return NextResponse.json({ error: "Could not create membership: " + memberError.message }, { status: 500 });
    }

    // CRM stages auto-created by database trigger

    return NextResponse.json({ success: true, organization: orgData });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "A server error occurred" }, { status: 500 });
  }
}
