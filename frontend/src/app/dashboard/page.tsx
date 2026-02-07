"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Cardsections, CardiconMap } from "@/lib/tools";
import Footer from "@/components/Footer";
import Link from "next/link";
import Loader from "@/components/Loader";
import CustomFooter from "@/components/CustomFooter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserService } from "@/services/user.service";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Protect route
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
       loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      const p1 = UserService.getUsageStats(session.accessToken);
      const p2 = UserService.getUsageHistory(session.accessToken, 10, 0);
      const [s, h] = await Promise.all([p1, p2]);
      setStats(s);
      setHistory(h);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <Loader />
    );
  }

  if (!session) return null;

  const iconMap = CardiconMap;

  // Quick Tools Logic
  // Prefer tools from history if available? No, just random for now or most used?
  // Let's stick to random or maybe specific ones.
  const quickTools = Cardsections[0].tools
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
    
  // Format Date Helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      {/* Content */}
      <section className="space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-3xl font-semibold text-center sm:text-left text-gray-900 mb-2">
            Welcome back, {session.user?.name || "User"} 👋
          </h2>
          <p className="text-sm text-gray-500 text-center sm:text-left">
            Here is your activity overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Plan</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.plan || "FREE"}</h3>
            </div>
            <Link href="/pricing" className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Manage Subscription →
            </Link>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Credits</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.plan === 'PRO' ? 'Unlimited' : (stats?.credits ?? '...')}
              </h3>
            </div>
             <p className="text-xs text-gray-400">Resets daily at midnight</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Processed</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalUsage || 0}</h3>
            </div>
            <p className="text-xs text-gray-400">Files processed lifetime</p>
          </div>

        </div>

        {/* Recent History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Files</h3>
            <button onClick={loadData} className="text-xs text-blue-600 hover:underline">
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No files processed yet. Try a tool!
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">File Name</th>
                    <th className="px-6 py-3">Tool</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[200px]">
                        {entry.meta?.originalName || "Unknown File"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {entry.toolName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                          entry.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {entry.resultUrl && (
                          <a 
                            href={entry.resultUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-blue-600 font-medium hover:text-blue-800 text-xs"
                          >
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Tools */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
             Explore Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/images/${tool.slug}`} // Assuming mostly image tools in quick tools for now or verify type
                className="group rounded-xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{iconMap[tool.name] ?? "⚙️"}</span>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{tool.name}</h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </div>

      </section>

      <div className="mt-10">
        <Footer />
        <CustomFooter />
      </div>
    </DashboardLayout>
  );
}
