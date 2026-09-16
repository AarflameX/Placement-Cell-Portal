import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  FileText,
  User,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const { currentUser, userRole, userProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (
    !currentUser ||
    !userRole ||
    location.pathname === "/login" ||
    location.pathname === "/register"
  ) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  const isActive = (path) => location.pathname === path;

  const studentLinks = [
    { name: "Browse Drives", path: "/drives", icon: Briefcase },
    { name: "My Applications", path: "/my-applications", icon: FileText },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const tpoLinks = [
    { name: "Overview", path: "/tpo/dashboard", icon: LayoutDashboard },
    { name: "Post Drive", path: "/tpo/create-drive", icon: PlusCircle },
  ];

  const links = userRole === "tpo" ? tpoLinks : studentLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand & Role Mark */}
          <div className="flex items-center gap-3">
            <Link
              to={userRole === "tpo" ? "/tpo/dashboard" : "/drives"}
              className="flex items-center gap-2.5 font-semibold text-neutral-900 dark:text-neutral-100 hover:opacity-85 transition-opacity"
            >
              {/* Minimalist Geometric Logo Mark */}
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-mono font-bold text-xs tracking-tighter">
                ▲
              </div>
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                PlacementPortal
              </span>
            </Link>

            {/* Subtle Role Tag */}
            <span
              className={`hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide border ${
                userRole === "tpo"
                  ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
                  : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
              }`}
            >
              {userRole === "tpo" ? "TPO Officer" : "Student"}
            </span>
          </div>

          {/* Desktop Nav Links (Vercel Tab Style) */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800/80 font-semibold"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Theme Switcher, User Pill & Logout */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

            {/* User Info Pill */}
            <div className="flex items-center gap-2 pl-1 pr-2 py-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                {(userProfile?.name || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 max-w-[120px] truncate">
                {userProfile?.name || currentUser.email?.split("@")[0]}
              </span>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:border-red-900/50 dark:hover:text-red-300 transition-colors"
              title="Log out"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 pt-2 pb-4 md:hidden">
          <div className="space-y-1">
            {links.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-bold">
                {(userProfile?.name || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-neutral-700 dark:text-neutral-300">
                {userProfile?.name || currentUser.email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 text-xs text-red-600 dark:text-red-400"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

