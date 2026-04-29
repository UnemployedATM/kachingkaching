import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Users, CalendarDays, Leaf, CreditCard, Calendar, LayoutGrid, BookOpen, BadgeCheck, LogOut, Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    info: "Overview of today's activity — upcoming bookings, revenue summary, attendance stats, and recent clients.",
  },
  {
    path: "/calendar",
    label: "Calendar",
    icon: Calendar,
    info: "Visual day/week view of all scheduled class sessions. Quickly see what's happening and when.",
  },
  {
    path: "/classes",
    label: "Classes",
    icon: BookOpen,
    info: "Manage your class types (e.g. Yoga, Pilates) and schedule individual sessions with instructors and capacity.",
  },
  {
    path: "/bookings",
    label: "Bookings",
    icon: CalendarDays,
    info: "All client reservations in one place. Add, edit, cancel, or confirm bookings and track attendance.",
  },
  {
    path: "/clients",
    label: "Clients",
    icon: Users,
    info: "Your full client directory. View profiles, booking history, payment records, and personal notes.",
  },
  {
    path: "/memberships",
    label: "Memberships",
    icon: BadgeCheck,
    info: "Create membership plans (drop-in, class packs, monthly) and assign them to clients to track credits and expiry.",
  },
  {
    path: "/payments",
    label: "Payments",
    icon: CreditCard,
    info: "Log and track all payments. Mark pending payments as paid, issue refunds, and view revenue totals.",
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: Package,
    info: "Track studio equipment — mats, reformers, props. Monitor status (available, maintenance, retired) and quantities.",
  },
  {
    path: "/floor-plan",
    label: "Floor Plan",
    icon: LayoutGrid,
    info: "Visual 5×5 grid of your studio space. Assign equipment to specific slots to map your physical layout.",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
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
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-sidebar-foreground leading-tight">
                  Serenity
                </h1>
                <p className="text-xs text-muted-foreground">Studio Manager</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
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

          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="px-3 py-2 rounded-lg bg-primary/5">
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
