import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import ProfileModal from "./ProfileModal";
import { Bell, Search, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const { admin } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar
        onProfileClick={() => setShowProfile(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-dark-800/80 backdrop-blur-sm border-b border-surface-border flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-light transition-all shrink-0"
          >
            <Menu size={22} />
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 bg-dark-700 rounded-xl px-4 py-2 flex-1 max-w-72 border border-surface-border focus-within:border-brand-500/50 transition-colors">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none w-full min-w-0"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-light transition-all">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse-slow" />
            </button>

            {/* Admin avatar — click to open profile modal */}
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                {admin?.avatar ? (
                  <img src={admin.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  admin?.name?.[0]?.toUpperCase() || "A"
                )}
              </div>
              <span className="hidden sm:inline text-sm text-gray-300 font-medium">{admin?.name}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default AdminLayout;
