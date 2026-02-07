const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const AuthService = {
  async login(email, password) {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Backend returns { access_token, user: { ... } }
    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      plan: data.user.plan,
      accessToken: data.access_token,
    };
  },

  async register(name, email, password) {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      accessToken: data.access_token,
    };
  },

  async loginWithGoogle(profile) {
    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: profile.email,
        name: profile.name,
        photo: profile.picture
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Google Login failed");
    }

    // Return backend user structure
    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      plan: data.user.plan,
      accessToken: data.access_token,
    };
  }
};
