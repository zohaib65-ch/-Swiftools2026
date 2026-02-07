
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const AnalyticsService = {
  async getAdminStats(accessToken) {
    const res = await fetch(`${BACKEND_URL}/analytics/stats`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      if (res.status === 403) throw new Error("Access Denied: Admin only");
      throw new Error("Failed to fetch analytics");
    }
    return await res.json();
  }
};
