import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, DollarSign, TrendingUp, RotateCcw, Plus } from "lucide-react";
import { format } from "date-fns";
import StatCard from "../components/dashboard/StatCard";
import SetupNotice from "@/components/shared/SetupNotice";

const statusStyles = {
  paid: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-accent text-accent-foreground border-accent",
  refunded: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const EMPTY_FORM = { booking_id: "", client_id: "", client_name: "", amount: "", status: "pending", payment_method: "card", payment_date: new Date().toISOString().split("T")[0], notes: "" };

export default function Payments() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => base44.entities.Payment.list("-payment_date"),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list("-date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const handleBookingSelect = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setForm((f) => ({ ...f, booking_id: bookingId, client_id: booking.client_id, client_name: booking.client_name }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await createMutation.mutateAsync({ ...form, amount: parseFloat(form.amount) });
    setSaving(false);
    setFormOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleMarkPaid = async (payment) => {
    await updateMutation.mutateAsync({
      id: payment.id,
      data: { status: "paid", payment_date: new Date().toISOString().split("T")[0] },
    });
  };

  const handleRefund = async (payment) => {
    if (!window.confirm(`Issue a refund of $${payment.amount?.toFixed(2)}? This will update the payment status to Refunded.`)) return;
    await updateMutation.mutateAsync({
      id: payment.id,
      data: { status: "refunded", refund_date: new Date().toISOString().split("T")[0] },
    });
  };

  const filtered = payments.filter((p) => {
    const matchSearch = p.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);
  const totalRefunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + (p.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage studio revenue</p>
        </div>
        <Button disabled={clients.length === 0} onClick={() => setFormOpen(true)} className="gap-2 w-fit">
          <Plus className="h-4 w-4" /> Log Payment
        </Button>
      </div>

      {clients.length === 0 && (
        <SetupNotice steps={[{ label: "Add at least one client before logging payments.", to: "/clients", linkText: "Go to Clients →" }]} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={`$${totalPaid.toFixed(2)}`} icon={DollarSign} subtitle={`${payments.filter((p) => p.status === "paid").length} payments`} />
        <StatCard title="Pending" value={`$${totalPending.toFixed(2)}`} icon={TrendingUp} subtitle={`${payments.filter((p) => p.status === "pending").length} awaiting`} />
        <StatCard title="Refunded" value={`$${totalRefunded.toFixed(2)}`} icon={RotateCcw} subtitle={`${payments.filter((p) => p.status === "refunded").length} refunds`} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No payments found</TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{p.client_name || "—"}</TableCell>
                    <TableCell className="font-semibold">${(p.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground capitalize">{p.payment_method?.replace("_", " ")}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.payment_date ? format(new Date(p.payment_date + "T00:00:00"), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[p.status] || ""}>
                        {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {p.status === "pending" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/5" onClick={() => handleMarkPaid(p)}>
                            Mark Paid
                          </Button>
                        )}
                        {p.status === "paid" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 gap-1" onClick={() => handleRefund(p)}>
                            <RotateCcw className="h-3 w-3" /> Refund
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Log Payment Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Log Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Booking (optional)</Label>
              <Select value={form.booking_id} onValueChange={handleBookingSelect}>
                <SelectTrigger><SelectValue placeholder="Select a booking…" /></SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.client_name} — {b.date} {b.start_time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!form.booking_id && (
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={form.client_id} onValueChange={(v) => {
                  const c = clients.find((cl) => cl.id === v);
                  setForm((f) => ({ ...f, client_id: v, client_name: c?.full_name || "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" className="h-16" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Log Payment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}