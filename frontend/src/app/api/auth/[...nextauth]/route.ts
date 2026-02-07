import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { AuthService } from "@/services/auth.service";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    // ================= CREDENTIALS =================
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Returns { id, name, email, accessToken, role }
          return await AuthService.login(credentials.email, credentials.password);
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),

    // ================= GOOGLE =================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // JWT callback
    async jwt({ token, user, account }) {
      if (user) {
        // User object comes from authorize() return or provider profile
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },

    // Session callback
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.plan = token.plan;
        session.accessToken = token.accessToken; // Available for client-side API calls
      }
      return session;
    },

    // Authenticate Google users with Backend
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          const backendUser = await AuthService.loginWithGoogle(user);

          // Augment the user object so it flows into the JWT callback
          user.id = backendUser.id;
          user.accessToken = backendUser.accessToken;
          user.role = backendUser.role;
          user.plan = backendUser.plan;

          return true;
        } catch (error) {
          console.error("Google Backend Sync Error:", error);
          return false;
        }
      }
      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
