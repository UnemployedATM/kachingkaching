import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

const statusStyles = {
  confirmed:  "bg-chart-3/10 text-chart-3 border-chart-3/20",
  completed:  "bg-primary/10 text-primary border-primary/20",
  cancelled:  "bg-destructive/10 text-destructive border-destructive/20",
  no_show:    "bg-accent text-accent-foreground border-accent",
  waitlisted: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS = {
  confirmed: "Confirmed", completed: "Completed",
  cancelled: "Cancelled", no_show: "No-Show", waitlisted: "Waitlisted",
};

export default function BookingTable({ bookings, onEdit, onDelete }) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Client</TableHead>
              <TableHead>Session</TableHead>
              <TableHead className="hidden sm:table-cell">Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => {
              const session  = b.class_sessions;
              const startsAt = session?.starts_at ? new Date(session.starts_at) : null;
              return (
                <TableRow key={b.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{b.clients?.full_name || "—"}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {session?.class_types?.color && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: session.class_types.color }} />
                      )}
                      {session?.class_types?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {startsAt ? (
                      <>
                        <div>{format(startsAt, "MMM d, yyyy")}</div>
                        <div className="text-xs">{format(startsAt, "h:mm a")}</div>
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[b.status] || ""}>
                      {STATUS_LABELS[b.status] || b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(b)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
