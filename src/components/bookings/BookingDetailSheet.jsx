import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2, XCircle, Ban } from "lucide-react";
import { format } from "date-fns";

const statusStyles = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show:   "bg-accent text-accent-foreground border-accent",
  waitlisted:"bg-muted text-muted-foreground border-border",
};

const statusLabel = (s) => s === "no_show" ? "No-Show" : s?.charAt(0).toUpperCase() + s?.slice(1);

export default function BookingDetailSheet({ booking, onClose, onEdit, onDelete, onStatusChange }) {
  if (!booking) return null;

  const session    = booking.class_sessions;
  const startsAt   = session?.starts_at ? new Date(session.starts_at) : null;
  const endsAt     = session?.ends_at   ? new Date(session.ends_at)   : null;
  const clientName = booking.clients?.full_name    || "—";
  const className  = session?.class_types?.name    || "—";
  const instructor = session?.staff?.full_name     || null;

  return (
    <Sheet open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Booking Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</span>
              <Badge variant="outline" className={statusStyles[booking.status] || ""}>{statusLabel(booking.status)}</Badge>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 space-y-2">
              <p className="font-semibold text-lg">{clientName}</p>
              <p className="text-sm text-muted-foreground">{className}</p>
              {instructor && <p className="text-xs text-muted-foreground">Instructor: {instructor}</p>}
              {startsAt && <p className="text-sm font-medium">{format(startsAt, "EEEE, MMMM d, yyyy")}</p>}
              {startsAt && endsAt && (
                <p className="text-sm text-muted-foreground">{format(startsAt, "h:mm a")} – {format(endsAt, "h:mm a")}</p>
              )}
              {booking.notes && <p className="text-sm text-muted-foreground italic">"{booking.notes}"</p>}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Attendance</p>
            <div className="flex gap-2">
              <Button variant={booking.status === "completed" ? "default" : "outline"} size="sm" className="flex-1 gap-1.5" onClick={() => onStatusChange(booking, "completed")}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Attended
              </Button>
              <Button variant={booking.status === "no_show" ? "destructive" : "outline"} size="sm" className="flex-1 gap-1.5" onClick={() => onStatusChange(booking, "no_show")}>
                <XCircle className="h-3.5 w-3.5" /> No-Show
              </Button>
              <Button variant={booking.status === "cancelled" ? "destructive" : "outline"} size="sm" className="gap-1.5" onClick={() => onStatusChange(booking, "cancelled")}>
                <Ban className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border/60">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onEdit(booking)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5" onClick={() => onDelete(booking)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
