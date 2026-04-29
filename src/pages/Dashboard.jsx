import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Users, Package, TrendingUp } from "lucide-react";
import { differenceInWeeks, differenceInMonths, startOfWeek, startOfMonth, subMonths } from "date-fns";

import StatCard from "../components/dashboard/StatCard";
import BusiestDaysChart from "../components/dashboard/BusiestDaysChart";
import BusiestWeeksChart from "../components/dashboard/BusiestWeeksChart";
import BusiestMonthsChart from "../components/dashboard/BusiestMonthsChart";
import AttendanceChart from "../components/dashboard/AttendanceChart";

export default function Dashboard() {
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list("-date"),
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: equipment = [], isLoading: loadingEquipment } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const isLoading = loadingBookings || loadingClients || loadingEquipment;

  // Calculate average visits per week and per month
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const activeClients = clients.filter((c) => c.status === "active").length || 1;

  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  const recentBookings = completedBookings.filter((b) => new Date(b.class_sessions?.starts_at) >= threeMonthsAgo);

  const weeksSpan = Math.max(differenceInWeeks(now, threeMonthsAgo), 1);
  const monthsSpan = Math.max(differenceInMonths(now, threeMonthsAgo), 1);

  const avgVisitsPerWeek = activeClients > 0 ? (recentBookings.length / weeksSpan / activeClients).toFixed(1) : "0";
  const avgVisitsPerMonth = activeClients > 0 ? (recentBookings.length / monthsSpan / activeClients).toFixed(1) : "0";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your studio performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={bookings.length}
          subtitle={`${completedBookings.length} completed`}
          icon={CalendarDays}
        />
        <StatCard
          title="Active Clients"
          value={clients.filter((c) => c.status === "active").length}
          subtitle={`${clients.length} total`}
          icon={Users}
        />
        <StatCard
          title="Avg Visits / Week"
          value={avgVisitsPerWeek}
          subtitle="Per active client"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Visits / Month"
          value={avgVisitsPerMonth}
          subtitle="Per active client"
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BusiestDaysChart bookings={bookings} />
        <AttendanceChart bookings={bookings} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BusiestWeeksChart bookings={bookings} />
        <BusiestMonthsChart bookings={bookings} />
      </div>
    </div>
  );
}