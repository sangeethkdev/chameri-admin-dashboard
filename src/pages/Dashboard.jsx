import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance";
import {
  Star, Users, MessageSquare,
  ImagePlus, BadgePlus, ArrowUpRight, ArrowDownRight,
  Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, changeType, color }) => (
  <div className="stat-card group cursor-default">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg
        ${changeType === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
        {changeType === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </span>
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

// ─── Custom Tooltip for Chart ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-surface-border rounded-xl p-3 text-xs shadow-card">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
const Dashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data.data;
    },
    retry: 1,
  });

  // Use fallback data while loading or if API isn't ready
  const stats = data?.stats || {};
  const monthlyActivity = data?.monthlyActivity || [];
  const hasActivity = monthlyActivity.some((m) => m.clientReviews || m.enquiries);

  const statCards = [
    {
      icon: Star,
      label: "Client Reviews",
      value: stats.totalClientReviews ?? "—",
      change: "+4%",
      changeType: "up",
      color: "bg-gradient-to-br from-purple-500 to-purple-700",
    },
    {
      icon: Users,
      label: "Dashboard Users",
      value: stats.totalTeam ?? "—",
      change: "0%",
      changeType: "up",
      color: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    },
    {
      icon: MessageSquare,
      label: "New Inquiries",
      value: stats.newContacts ?? "—",
      change: "+28%",
      changeType: "up",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    },
  ];

  if (isError) {
    // Dashboard still renders with placeholders — non-blocking
    console.warn("Dashboard API not connected yet. Showing placeholder data.");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back — here's what's happening with CHAMERI.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-surface border border-surface-border rounded-xl px-4 py-2">
          <Clock size={14} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Activity Chart ── */}
      <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-semibold">Activity Overview</h3>
            <p className="text-gray-500 text-xs mt-0.5">Client reviews & enquiries received — last 7 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-brand-400">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />
              Client Reviews
              <span className="bg-brand-500/10 text-brand-400 font-semibold px-1.5 py-0.5 rounded-md">
                {stats.totalClientReviews ?? 0}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              Enquiries
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">
            Loading activity…
          </div>
        ) : !hasActivity ? (
          <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">
            No client reviews or enquiries in the last 7 months
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClientReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2952ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2952ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3158" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="clientReviews" stroke="#2952ff" strokeWidth={2} fill="url(#colorClientReviews)" name="Client Reviews" />
              <Area type="monotone" dataKey="enquiries" stroke="#7c3aed" strokeWidth={2} fill="url(#colorEnquiries)" name="Enquiries" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-card">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Add Gallery Event", to: "/gallery/images", icon: ImagePlus, color: "bg-brand-500 hover:bg-brand-600" },
            { label: "Manage Users", to: "/users", icon: Users, color: "bg-cyan-600 hover:bg-cyan-700" },
            { label: "Add Work Logo", to: "/about/worklogo", icon: BadgePlus, color: "bg-emerald-600 hover:bg-emerald-700" },
          ].map(({ label, to, icon: Icon, color }) => (
            <Link
              key={label}
              to={to}
              className={`${color} text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-glow-sm hover:-translate-y-0.5 flex items-center gap-2`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
