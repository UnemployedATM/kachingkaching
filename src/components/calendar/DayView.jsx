import { format } from "date-fns";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

const statusColors = {
  confirmed: "bg-blue-100 border-blue-300 text-blue-800",
  completed: "bg-primary/10 border-primary/30 text-primary",
  cancelled: "bg-destructive/10 border-destructive/20 text-destructive",
  no_show:   "bg-accent border-accent text-accent-foreground",
  waitlisted:"bg-muted border-border text-muted-foreground",
};

const bookingHour    = (b) => b.class_sessions?.starts_at ? new Date(b.class_sessions.starts_at).getHours() : -1;
const bookingTimeStr = (b) => b.class_sessions?.starts_at ? format(new Date(b.class_sessions.starts_at), "h:mm a") : "";
const bookingEndStr  = (b) => b.class_sessions?.ends_at   ? format(new Date(b.class_sessions.ends_at),   "h:mm a") : "";
const bookingLabel   = (b) => b.clients?.full_name || "—";
const bookingClass   = (b) => b.class_sessions?.class_types?.name || "";

export default function DayView({ currentDate, bookings, onBookingClick }) {
  const key = format(currentDate, "yyyy-MM-dd");
  const dayBookings = bookings.filter((b) =>
    b.class_sessions?.starts_at && format(new Date(b.class_sessions.starts_at), "yyyy-MM-dd") === key
  );

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border/60 bg-muted/20">
        <p className="font-medium">{format(currentDate, "EEEE, MMMM d, yyyy")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="overflow-y-auto max-h-[560px]">
        {HOURS.map((hour) => {
          const hourBookings = dayBookings.filter((b) => bookingHour(b) === hour);
          return (
            <div key={hour} className="flex border-b border-border/40 min-h-[60px]">
              <div className="w-16 shrink-0 p-2 text-xs text-muted-foreground text-right border-r border-border/60">{hour}:00</div>
              <div className="flex-1 p-1 space-y-1">
                {hourBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onBookingClick(b)}
                    className={cn("p-2 rounded border cursor-pointer font-medium text-sm", statusColors[b.status] || "bg-muted text-muted-foreground")}
                  >
                    <span className="font-semibold">{bookingTimeStr(b)}–{bookingEndStr(b)}</span>
                    {" · "}{bookingLabel(b)}
                    {bookingClass(b) && <span className="text-xs opacity-75"> · {bookingClass(b)}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
