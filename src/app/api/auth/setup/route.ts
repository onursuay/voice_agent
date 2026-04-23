import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const supabase = createServiceClient();

    // 1) Upsert profile (idempotent - safe to retry)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user_id,
      email,
      full_name,
    }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: "Profil oluşturulamadı: " + profileError.message }, { status: 500 });
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

    // 3) Create organization
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
      return NextResponse.json({ error: "Organizasyon oluşturulamadı: " + orgError.message }, { status: 500 });
    }

    // 4) Create membership (owner)
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: orgData.id, user_id, role: "owner" });

    if (memberError) {
      console.error("Membership error:", memberError);
      return NextResponse.json({ error: "Üyelik oluşturulamadı: " + memberError.message }, { status: 500 });
    }

    // CRM stages auto-created by database trigger

    return NextResponse.json({ success: true, organization: orgData });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 });
  }
}
