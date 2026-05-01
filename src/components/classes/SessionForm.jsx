import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMinutes, format } from "date-fns";

const EMPTY = { class_type_id: "", instructor_id: "", date: "", start_time: "09:00", max_capacity: "", notes: "", status: "scheduled" };

export default function SessionForm({ open, onOpenChange, session, classTypes, instructors, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (session) {
      const d = new Date(session.starts_at);
      setForm({
        class_type_id: session.class_type_id || "",
        instructor_id: session.instructor_id || "",
        date:          format(d, "yyyy-MM-dd"),
        start_time:    format(d, "HH:mm"),
        max_capacity:  session.max_capacity || "",
        notes:         session.notes || "",
        status:        session.status || "scheduled",
      });
    } else {
      setForm(EMPTY);
    }
  }, [session, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    try {
      const selectedType = classTypes.find((t) => t.id === form.class_type_id);
      const starts_at = new Date(`${form.date}T${form.start_time}`).toISOString();
      const ends_at   = addMinutes(new Date(starts_at), selectedType?.duration_minutes || 60).toISOString();

      await onSave({
        class_type_id: form.class_type_id,
        instructor_id: form.instructor_id || null,
        starts_at,
        ends_at,
        max_capacity:  Number(form.max_capacity) || selectedType?.default_capacity || 10,
        notes:         form.notes,
        status:        form.status,
      });
      onOpenChange(false);
    } catch (err) {
      setSaveError(err?.message ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{session ? "Edit Session" : "Schedule Session"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Class Type *</Label>
            <Select value={form.class_type_id} onValueChange={(v) => {
              const t = classTypes.find((x) => x.id === v);
              set("class_type_id", v);
              if (!form.max_capacity && t) set("max_capacity", String(t.default_capacity));
            }}>
              <SelectTrigger><SelectValue placeholder="Select class type" /></SelectTrigger>
              <SelectContent>
                {classTypes.filter((t) => t.is_active).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Instructor</Label>
            <Select value={form.instructor_id || "_none"} onValueChange={(v) => set("instructor_id", v === "_none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No instructor assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No instructor</SelectItem>
                {instructors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start Time *</Label>
              <Input id="start" type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cap">Max Capacity</Label>
              <Input id="cap" type="number" min="1" value={form.max_capacity} onChange={(e) => set("max_capacity", e.target.value)} placeholder="From class type" />
            </div>
          </div>

          {session && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="h-16" placeholder="e.g. Bring your own mat" />
          </div>

          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{saveError}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.class_type_id}>{saving ? "Saving…" : session ? "Update" : "Schedule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
