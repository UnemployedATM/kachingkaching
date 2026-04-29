import { Link, useLocation } from "react-router-dom";
import { LogOut, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import LordIcon from "@/components/ui/LordIcon";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: "https://cdn.lordicon.com/wjyqkiew.json",
    info: "Overview of today's activity — upcoming bookings, revenue summary, attendance stats, and recent clients.",
  },
  {
    path: "/calendar",
    label: "Calendar",
    icon: "https://cdn.lordicon.com/ogkflacg.json",
    info: "Visual day/week view of all scheduled class sessions. Quickly see what's happening and when.",
  },
  {
    path: "/classes",
    label: "Classes",
    icon: "https://cdn.lordicon.com/kndkiwmb.json",
    info: "Manage your class types (e.g. Yoga, Pilates) and schedule individual sessions with instructors and capacity.",
  },
  {
    path: "/bookings",
    label: "Bookings",
    icon: "https://cdn.lordicon.com/abfymgfk.json",
    info: "All client reservations in one place. Add, edit, cancel, or confirm bookings and track attendance.",
  },
  {
    path: "/clients",
    label: "Clients",
    icon: "https://cdn.lordicon.com/dnoiydox.json",
    info: "Your full client directory. View profiles, booking history, payment records, and personal notes.",
  },
  {
    path: "/memberships",
    label: "Memberships",
    icon: "https://cdn.lordicon.com/sbiheqdr.json",
    info: "Create membership plans (drop-in, class packs, monthly) and assign them to clients to track credits and expiry.",
  },
  {
    path: "/payments",
    label: "Payments",
    icon: "https://cdn.lordicon.com/dpirpnzh.json",
    info: "Log and track all payments. Mark pending payments as paid, issue refunds, and view revenue totals.",
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: "https://cdn.lordicon.com/msetyebo.json",
    info: "Track studio equipment — mats, reformers, props. Monitor status (available, maintenance, retired) and quantities.",
  },
  {
    path: "/floor-plan",
    label: "Floor Plan",
    icon: "https://cdn.lordicon.com/aniibgkj.json",
    info: "Visual 5×5 grid of your studio space. Assign equipment to specific slots to map your physical layout.",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: "https://cdn.lordicon.com/hwcrbhbp.json",
    info: "Update your personal profile, name, phone, email address, and change your password.",
  },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { logout, staffRecord, user } = useAuth();

  return (
    <TooltipProvider delayDuration={300}>
      <>
        {open && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border",
            "flex flex-col transition-transform duration-300 ease-in-out",
            "lg:translate-x-0 lg:static lg:z-auto",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Brand */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#3f6840] flex items-center justify-center shadow-sm">
                <span className="text-white text-base font-bold">S</span>
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-sidebar-foreground leading-tight">
                  Serenity
                </h1>
                <p className="text-xs text-muted-foreground">Studio Manager</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path} className="flex items-center gap-1">
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <LordIcon
                      src={item.icon}
                      trigger={isActive ? "loop" : "hover"}
                      size={18}
                      primary={isActive ? "#3f6840" : "#94a3b8"}
                      secondary={isActive ? "#7da87b" : "#cbd5e1"}
                    />
                    {item.label}
                  </Link>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-sidebar-accent/40 transition-colors shrink-0"
                        tabIndex={-1}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-56 text-center leading-snug">
                      {item.info}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="px-3 py-2 rounded-lg bg-primary/8">
              <p className="text-xs font-medium text-foreground truncate">
                {staffRecord?.full_name || user?.email || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {staffRecord?.role || "Staff"}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>
      </>
    </TooltipProvider>
  );
}
