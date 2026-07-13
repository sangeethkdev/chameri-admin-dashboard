import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, FolderOpen, Briefcase, MessageSquare,
  FileText, Star, LogOut, ChevronRight, Settings, Zap,
  ChevronUp, ShieldCheck, Home, Image, Info, HelpCircle,
} from "lucide-react";

// ─── Nav Structure ────────────────────────────────────────────────────────────
const navItems = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  {
    label: "Home",
    icon: Home,
    children: [
      { label: "Hero Section", to: "/home/hero", icon: Image },
      { label: "About Us", to: "/home/about", icon: Info },
      { label: "Logos", to: "/home/logos", icon: Image },
      { label: "Villa Plan", to: "/home/villaplan", icon: FolderOpen },
      { label: "Choose Us", to: "/home/chooseus", icon: Star },
      { label: "Gallery", to: "/home/gallery", icon: Image },
      { label: "Our Team", to: "/home/team", icon: Briefcase },
      { label: "Testimonial", to: "/home/testimonial", icon: MessageSquare },
      { label: "FAQ Section", to: "/home/faq", icon: HelpCircle },
    ],
  },
  {
    label: "About Us",
    icon: Info,
    children: [
      { label: "Hero Section", to: "/about/hero", icon: Image },
      { label: "Story Section", to: "/about/story", icon: FileText },
      { label: "Founder Section", to: "/about/founder", icon: Briefcase },
      { label: "Work Logo Section", to: "/about/worklogo", icon: Image },
      { label: "Vision & Mission", to: "/about/visionmission", icon: Star },
      { label: "Special Section", to: "/about/special", icon: Zap },
      { label: "Board Section", to: "/about/board", icon: Briefcase },
      { label: "Testimonial Section", to: "/about/testimonial", icon: MessageSquare },
    ],
  },
  {
    label: "Gallery",
    icon: Image,
    children: [
      { label: "Hero Section",    to: "/gallery/hero",   icon: Image },
      { label: "Gallery Images",  to: "/gallery/images", icon: Image },
    ],
  },
  {
    label: "Kiwano",
    icon: Star,
    children: [
      { label: "Hero Section", to: "/kiwano/hero", icon: Image },
      { label: "Luxury Villas Section", to: "/kiwano/luxuryvillas", icon: Home },
      { label: "Feature Section", to: "/kiwano/feature", icon: Star },
      { label: "360Tour Section", to: "/kiwano/360tour", icon: Zap },
      { label: "Gallery Section", to: "/kiwano/gallery", icon: Image },
      { label: "Amenities Section", to: "/kiwano/amenities", icon: Briefcase },
      { label: "Other Project Section", to: "/kiwano/otherprojects", icon: FolderOpen },
    ],
  },
  {
    label: "Kiwano Villament",
    icon: Star,
    children: [
      { label: "Hero Section", to: "/kiwano-villament/hero", icon: Image },
      { label: "Luxury Villas Section", to: "/kiwano-villament/luxuryvillas", icon: Home },
      { label: "Feature Section", to: "/kiwano-villament/feature", icon: Star },
      { label: "360Tour Section", to: "/kiwano-villament/360tour", icon: Zap },
      { label: "Gallery Section", to: "/kiwano-villament/gallery", icon: Image },
      { label: "Amenities Section", to: "/kiwano-villament/amenities", icon: Briefcase },
      { label: "Other Project Section", to: "/kiwano-villament/otherprojects", icon: FolderOpen },
    ],
  },
  { label: "Projects", to: "/projects", icon: FolderOpen },
  { label: "Services", to: "/services", icon: Briefcase },
  { label: "Blogs", to: "/blogs", icon: FileText },
  { label: "Testimonials", to: "/testimonials", icon: Star },
  { label: "Contacts", to: "/contacts", icon: MessageSquare },
  { label: "User Management", to: "/users", icon: ShieldCheck, adminOnly: true },
  { label: "Settings", to: "/settings", icon: Settings },
];

const isAdminRole = (role) => role === "admin";

// ─── Submenu Item ─────────────────────────────────────────────────────────────
const SubItem = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 pl-9 pr-3 py-2 rounded-xl text-sm mb-0.5 transition-all duration-200 ${
        isActive
          ? "text-brand-400 bg-brand-500/10 font-medium"
          : "text-gray-500 hover:text-gray-300 hover:bg-surface-light"
      }`
    }
  >
    <Icon size={14} className="shrink-0" />
    <span>{label}</span>
  </NavLink>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ onProfileClick }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track which parent menus are open
  const [openMenus, setOpenMenus] = useState(() => {
    const activeParent = navItems.find((item) => 
      item.children?.some((child) => location.pathname.startsWith(child.to))
    );
    return activeParent ? { [activeParent.label]: true } : {};
  });

  const toggleMenu = (label) =>
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || isAdminRole(admin?.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-dark-800 border-r border-surface-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">CHAMERI</h1>
          <p className="text-gray-500 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="section-label">Main Menu</p>

        {visibleNav.map((item) => {
          const Icon = item.icon;

          // ── Parent with children (expandable) ──
          if (item.children) {
            const isOpen = !!openMenus[item.label];
            const anyChildActive = item.children.some((c) =>
              location.pathname === c.to || location.pathname.startsWith(c.to + "/")
            );

            return (
              <div key={item.label} className="mb-1">
                {/* Parent button */}
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`sidebar-link w-full ${anyChildActive ? "text-white" : ""}`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight
                    size={14}
                    className={`opacity-50 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {/* Children */}
                {isOpen && (
                  <div className="mt-0.5">
                    {item.children.map((child) => (
                      <SubItem key={child.to} {...child} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ── Regular nav link ──
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link mb-1 ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={14} className="opacity-30" />
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile Section */}
      <div className="p-4 border-t border-surface-border space-y-1">
        {/* Clickable profile row */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-light transition-all duration-200 group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
            {admin?.avatar ? (
              <img src={admin.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              admin?.name?.[0]?.toUpperCase() || "A"
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-sm font-semibold truncate">{admin?.name || "Admin"}</p>
            <p className="text-gray-500 text-xs truncate capitalize">{admin?.role || "admin"}</p>
          </div>
          <ChevronUp size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-400 text-sm hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
