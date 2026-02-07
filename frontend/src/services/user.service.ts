const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const UserService = {
  async getUserProfile(accessToken) {
    const res = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      // Handle 401 etc
      throw new Error("Failed to fetch profile");
    }
    return await res.json();
  },

  async getUsageStats(accessToken) {
    const res = await fetch(`${BACKEND_URL}/users/me/stats`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  },

  async getUsageHistory(accessToken, limit = 20, offset = 0) {
    const res = await fetch(`${BACKEND_URL}/users/me/history?limit=${limit}&offset=${offset}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error("Failed to fetch history");
    return await res.json();
  },

  async updateUserProfile(accessToken, data) {
    const res = await fetch(`${BACKEND_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update profile");
    }
    return await res.json();
  },

  // These are now handled by backend ToolsService/Middleware
  // Keeping stubs if needed, but likely unused in frontend logic directly
  async checkCredits(accessToken) {
    const user = await this.getUserProfile(accessToken);
    return user.plan === 'pro' || user.credits > 0;
  },

  async deductCredits(accessToken, amount = 1) {
    // This should ideally happen on the backend when tool is used
    console.warn("deductCredits called on frontend - should be handled by backend");
    return true;
  },

  async recordActivity(accessToken, toolName, status = "success", meta = {}) {
    // Handled by backend
    console.warn("recordActivity called on frontend - should be handled by backend");
  }
};
