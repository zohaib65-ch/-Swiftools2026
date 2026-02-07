// /pages/api/user/me.js
import { getSession } from "next-auth/react";
import { UserService } from "@/services/user.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // your NextAuth config

// GET: fetch user data only if logged in
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ message: "Not authenticated" }), { status: 401 });
    }

    const user = await UserService.getUserProfile(session.accessToken);

    return new Response(JSON.stringify({ user }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}

// PATCH: update name only if logged in
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ message: "Not authenticated" }), { status: 401 });
    }

    const { name } = await req.json();
    if (!name || name.trim() === "") {
      return new Response(JSON.stringify({ message: "Name is required" }), { status: 400 });
    }

    const user = await UserService.updateUserProfile(session.accessToken, { name });

    return new Response(
      JSON.stringify({ message: "Name updated successfully", user }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
