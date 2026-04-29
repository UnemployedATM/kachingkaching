import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = { name: "", description: "", duration_minutes: 60, default_capacity: 10, color: "#6366f1" };

export default function ClassTypeForm({ open, onOpenChange, classType, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(classType ? {
      name:             classType.name || "",
      description:      classType.description || "",
      duration_minutes: classType.duration_minutes || 60,
      default_capacity: classType.default_capacity || 10,
      color:            classType.color || "#6366f1",
    } : EMPTY);
  }, [classType, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, duration_minutes: Number(form.duration_minutes), default_capacity: Number(form.default_capacity) });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{classType ? "Edit Class Type" : "New Class Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pilates Reformer" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} className="h-20" placeholder="What clients can expect…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input id="duration" type="number" min="15" step="15" value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Default Capacity</Label>
              <Input id="capacity" type="number" min="1" value={form.default_capacity} onChange={(e) => set("default_capacity", e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Calendar Color</Label>
            <div className="flex items-center gap-3">
              <input id="color" type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-14 rounded border border-border cursor-pointer" />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : classType ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
