import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role client for admin-level inserts
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, full_name, organization_name } =
      await request.json();

    if (!user_id || !email || !full_name || !organization_name) {
      return NextResponse.json(
        { error: "Tum alanlar zorunludur" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1) Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user_id,
      email,
      full_name,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Profil olusturulamadi: " + profileError.message },
        { status: 500 }
      );
    }

    // 2) Create organization
    const slug = slugify(organization_name) || `org-${Date.now()}`;

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: organization_name,
        slug,
        owner_id: user_id,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return NextResponse.json(
        { error: "Organizasyon olusturulamadi: " + orgError.message },
        { status: 500 }
      );
    }

    // 3) Create organization_member with role 'owner'
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: orgData.id,
        user_id,
        role: "owner",
      });

    if (memberError) {
      console.error("Membership creation error:", memberError);
      return NextResponse.json(
        { error: "Uyelik olusturulamadi: " + memberError.message },
        { status: 500 }
      );
    }

    // 4) Create default CRM stages
    const defaultStages = [
      { name: "Yeni Lead", position: 0, color: "#6366f1" },
      { name: "İletişime Geçildi", position: 1, color: "#3b82f6" },
      { name: "Teklif Gonderildi", position: 2, color: "#f59e0b" },
      { name: "Muzakere", position: 3, color: "#8b5cf6" },
      { name: "Kazanıldı", position: 4, color: "#22c55e" },
      { name: "Kaybedildi", position: 5, color: "#ef4444" },
    ];

    const { error: stagesError } = await supabase.from("crm_stages").insert(
      defaultStages.map((stage) => ({
        ...stage,
        organization_id: orgData.id,
      }))
    );

    if (stagesError) {
      console.error("Stages creation error:", stagesError);
      // Non-critical - continue anyway
    }

    return NextResponse.json({
      success: true,
      organization: orgData,
    });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { error: "Sunucu hatasi olustu" },
      { status: 500 }
    );
  }
}
