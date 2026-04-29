import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const EMPTY = { client_id: "", class_session_id: "", membership_id: "", status: "confirmed", notes: "" };

export default function BookingForm({ open, onOpenChange, booking, clients, sessions, clientMemberships, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(booking ? {
      client_id:        booking.client_id || "",
      class_session_id: booking.class_session_id || "",
      membership_id:    booking.membership_id || "",
      status:           booking.status || "confirmed",
      notes:            booking.notes || "",
    } : EMPTY);
  }, [booking, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Active memberships for the selected client
  const activeMemberships = (clientMemberships || []).filter(
    (m) => m.client_id === form.client_id && m.status === "active"
  );

  // Future sessions with capacity, or include the currently booked session when editing
  const availableSessions = (sessions || []).filter((s) => {
    if (booking && s.id === booking.class_session_id) return true;
    return s.status === "scheduled" &&
      new Date(s.starts_at) > new Date() &&
      s.slots_booked < s.max_capacity;
  });

  const selectedSession = (sessions || []).find((s) => s.id === form.class_session_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      client_id:        form.client_id,
      class_session_id: form.class_session_id,
      membership_id:    form.membership_id || null,
      status:           form.status,
      notes:            form.notes,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{booking ? "Edit Booking" : "New Booking"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Client */}
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => { set("client_id", v); set("membership_id", ""); }}>
              <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
              <SelectContent>
                {(clients || []).filter((c) => c.status === "active").map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Session */}
          <div className="space-y-1.5">
            <Label>Class Session *</Label>
            <Select value={form.class_session_id} onValueChange={(v) => set("class_session_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a session" /></SelectTrigger>
              <SelectContent>
                {availableSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.class_types?.color }} />
                      <span>
                        {s.class_types?.name} — {format(new Date(s.starts_at), "EEE MMM d, h:mma")}
                        <span className="text-muted-foreground ml-1">
                          ({s.slots_booked}/{s.max_capacity})
                        </span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSession && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedSession.starts_at), "EEEE, MMMM d, yyyy")} ·{" "}
                {format(new Date(selectedSession.starts_at), "h:mm a")} – {format(new Date(selectedSession.ends_at), "h:mm a")} ·{" "}
                {selectedSession.max_capacity - selectedSession.slots_booked} spot(s) left
              </p>
            )}
          </div>

          {/* Membership (optional) */}
          {form.client_id && (
            <div className="space-y-1.5">
              <Label>Membership / Credits</Label>
              <Select value={form.membership_id || "_none"} onValueChange={(v) => set("membership_id", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Pay separately / no membership" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No membership (pay separately)</SelectItem>
                  {activeMemberships.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.membership_plans?.name} ·{" "}
                      {m.credits_remaining == null ? "Unlimited" : `${m.credits_remaining} credits left`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status (edit only) */}
          {booking && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No-Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes…" className="h-16" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.client_id || !form.class_session_id}>
              {saving ? "Saving…" : booking ? "Update" : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
