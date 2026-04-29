import { startOfWeek, addDays, format, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

const statusColors = {
  confirmed: "bg-blue-100 border-blue-300 text-blue-800",
  completed: "bg-primary/10 border-primary/30 text-primary",
  cancelled: "bg-destructive/10 border-destructive/20 text-destructive",
  no_show:   "bg-accent border-accent text-accent-foreground",
  waitlisted:"bg-muted border-border text-muted-foreground",
};

const bookingDateKey  = (b) => b.class_sessions?.starts_at ? format(new Date(b.class_sessions.starts_at), "yyyy-MM-dd") : null;
const bookingHour     = (b) => b.class_sessions?.starts_at ? new Date(b.class_sessions.starts_at).getHours() : -1;
const bookingTimeStr  = (b) => b.class_sessions?.starts_at ? format(new Date(b.class_sessions.starts_at), "h:mm a") : "";
const bookingLabel    = (b) => b.clients?.full_name || b.class_sessions?.class_types?.name || "Booking";

export default function WeekView({ currentDate, bookings, onBookingClick }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getBookingsForDayHour = (date, hour) => {
    const key = format(date, "yyyy-MM-dd");
    return bookings.filter((b) => bookingDateKey(b) === key && bookingHour(b) === hour);
  };

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-8 border-b border-border/60">
        <div className="py-2 border-r border-border/60" />
        {days.map((day, i) => (
          <div key={i} className={cn("py-2 text-center border-r border-border/40 last:border-r-0", isToday(day) && "bg-primary/5")}>
            <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
            <p className={cn("text-sm font-semibold", isToday(day) && "text-primary")}>{format(day, "d")}</p>
          </div>
        ))}
      </div>
      <div className="overflow-y-auto max-h-[560px]">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-border/40 min-h-[52px]">
            <div className="p-1 border-r border-border/60 text-xs text-muted-foreground text-right pr-2 pt-1">
              {hour}:00
            </div>
            {days.map((day, i) => {
              const dayBookings = getBookingsForDayHour(day, hour);
              return (
                <div key={i} className={cn("p-0.5 border-r border-border/40 last:border-r-0 space-y-0.5", isToday(day) && "bg-primary/5")}>
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onBookingClick(b)}
                      className={cn("text-xs p-1 rounded border cursor-pointer truncate font-medium", statusColors[b.status] || "bg-muted text-muted-foreground")}
                    >
                      {bookingTimeStr(b)} {bookingLabel(b)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
