import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre zorunludur" },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı" },
        { status: 401 }
      );
    }

    const token = generateToken(user.id, user.email);

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
