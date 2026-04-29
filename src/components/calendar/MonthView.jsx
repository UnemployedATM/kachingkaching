import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors = {
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  no_show:   "bg-accent text-accent-foreground",
  waitlisted:"bg-muted text-muted-foreground",
};

const bookingDate = (b) => b.class_sessions?.starts_at
  ? format(new Date(b.class_sessions.starts_at), "yyyy-MM-dd")
  : null;

const bookingTime = (b) => b.class_sessions?.starts_at
  ? format(new Date(b.class_sessions.starts_at), "h:mm a")
  : "";

const bookingLabel = (b) =>
  b.clients?.full_name || b.class_sessions?.class_types?.name || "Booking";

export default function MonthView({ currentDate, bookings, onBookingClick, onDayClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });

  const days = [];
  let d = calStart;
  while (d <= calEnd) { days.push(new Date(d)); d = addDays(d, 1); }

  const getBookingsForDay = (date) => {
    const key = format(date, "yyyy-MM-dd");
    return bookings.filter((b) => bookingDate(b) === key);
  };

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-border/60">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayBookings = getBookingsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today   = isToday(day);
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[90px] p-2 border-r border-b border-border/40 cursor-pointer hover:bg-muted/30 transition-colors",
                !inMonth && "bg-muted/20",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1",
                today ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                    className={cn("text-xs px-1.5 py-0.5 rounded truncate cursor-pointer font-medium", statusColors[b.status] || "bg-muted text-muted-foreground")}
                  >
                    {bookingTime(b)} {bookingLabel(b)}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">+{dayBookings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
