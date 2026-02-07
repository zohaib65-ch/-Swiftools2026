import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { AuthService } from "@/services/auth.service";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // 1️⃣ Validate
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 2️⃣ Register User via Service
    const data = await AuthService.register(name, email, password);

    return NextResponse.json(
      { message: "User registered successfully", user: data },
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: error.message === "User already exists" ? 409 : 500 }
    );
  }
}


