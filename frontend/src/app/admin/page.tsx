
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Loader from "@/components/Loader";
import { AnalyticsService } from "@/services/analytics.service";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN" && session) {
      // Allow loading to finish to confirm role, but if we know it's not admin...
      // Actually backend will reject, but we can redirect early if we trust session.
      // Let's try to fetch, if 403 then show error.
       if(session.user.role !== 'ADMIN') {
         setError("Access Denied: Admins Only");
         setLoading(false);
         return;
       }
       loadStats();
    } else if (session?.user?.role === "ADMIN") {
        loadStats();
    }
  }, [status, session]);

  const loadStats = async () => {
    try {
      const data = await AnalyticsService.getAdminStats(session.accessToken);
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) return <Loader />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 gap-4">
        <h1 className="text-2xl font-bold">🚫 {error}</h1>
        <button onClick={() => router.push("/")} className="underline text-gray-600">Go Home</button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard 🛡️</h2>
          <p className="text-gray-500">System Overview & Analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers} icon="👥" color="bg-blue-50 text-blue-700" />
          <StatCard title="Total Jobs" value={stats?.totalJobs} icon="⚡" color="bg-purple-50 text-purple-700" />
          <StatCard title="Failed Jobs" value={stats?.failedJobs} icon="❌" color="bg-red-50 text-red-700" />
          <StatCard title="Success Rate" 
            value={stats?.totalJobs ? `${Math.round(((stats.totalJobs - stats.failedJobs) / stats.totalJobs) * 100)}%` : "N/A"} 
            icon="📈" 
            color="bg-green-50 text-green-700" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Popular Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Top 5 Popular Tools</h3>
            <div className="space-y-3">
              {stats?.popularTools?.map((tool, idx) => (
                <div key={tool.toolName} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{tool.toolName}</span>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {tool._count.toolName} uses
                  </span>
                </div>
              ))}
              {(!stats?.popularTools || stats.popularTools.length === 0) && (
                <p className="text-sm text-gray-400">No data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                   <tr>
                     <th className="px-3 py-2">User</th>
                     <th className="px-3 py-2">Tool</th>
                     <th className="px-3 py-2">Status</th>
                     <th className="px-3 py-2 text-right">Time</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {stats?.recentActivity?.map((activity) => (
                     <tr key={activity.id}>
                       <td className="px-3 py-2 font-medium text-gray-900">
                         {activity.user?.name || activity.user?.email || "Unknown"}
                       </td>
                       <td className="px-3 py-2 text-gray-600">{activity.toolName}</td>
                       <td className="px-3 py-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                           activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                           activity.status === 'failed' ? 'bg-red-100 text-red-700' :
                           'bg-yellow-100 text-yellow-700'
                         }`}>
                           {activity.status}
                         </span>
                       </td>
                       <td className="px-3 py-2 text-right text-gray-400 text-xs whitespace-nowrap">
                         {new Date(activity.createdAt).toLocaleTimeString()}
                       </td>
                     </tr>
                   ))}
                    {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                        <tr><td colSpan={4} className="text-center py-4 text-gray-400">No recent activity</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`rounded-xl p-5 shadow-sm border border-gray-100 bg-white flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value ?? 0}</h3>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
    </div>
  );
}
