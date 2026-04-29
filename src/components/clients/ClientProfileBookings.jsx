import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

const statusStyles = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show:   "bg-accent text-accent-foreground border-accent",
  waitlisted:"bg-muted text-muted-foreground border-border",
};

const statusLabel = (s) => s === "no_show" ? "No-Show" : s?.charAt(0).toUpperCase() + s?.slice(1);

export default function ClientProfileBookings({ bookings, attendance, onToggleAttendance }) {
  const getAttendance = (bookingId) => attendance.find((a) => a.booking_id === bookingId);

  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet</p>;
  }

  return (
    <div className="space-y-2">
      {bookings.map((b) => {
        const att       = getAttendance(b.id);
        const session   = b.class_sessions;
        const startsAt  = session?.starts_at ? new Date(session.starts_at) : null;
        const endsAt    = session?.ends_at   ? new Date(session.ends_at)   : null;
        const className = session?.class_types?.name || "—";
        const canMark   = b.status === "confirmed" || b.status === "completed";

        return (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{className}</p>
              <p className="text-xs text-muted-foreground">
                {startsAt ? format(startsAt, "MMM d, yyyy") : "—"}
                {startsAt && endsAt ? ` · ${format(startsAt, "h:mm")}–${format(endsAt, "h:mm a")}` : ""}
              </p>
            </div>
            <Badge variant="outline" className={statusStyles[b.status] || ""}>
              {statusLabel(b.status)}
            </Badge>
            {canMark && (
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant={att?.status === "present" ? "default" : "outline"}
                  className="h-7 w-7"
                  title="Mark Attended"
                  onClick={() => onToggleAttendance(b, "present")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant={att?.status === "absent" ? "destructive" : "outline"}
                  className="h-7 w-7"
                  title="Mark No-Show"
                  onClick={() => onToggleAttendance(b, "absent")}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
