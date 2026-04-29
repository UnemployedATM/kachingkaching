import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import BookingTable from "../components/bookings/BookingTable";
import BookingForm from "../components/bookings/BookingForm";
import SetupNotice from "@/components/shared/SetupNotice";

export default function Bookings() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen]               = useState(false);
  const [editing, setEditing]                 = useState(null);
  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.ClassSession.list(),
  });

  const { data: clientMemberships = [] } = useQuery({
    queryKey: ["client_memberships"],
    queryFn: () => base44.entities.ClientMembership.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bookings"] });

  const createMutation = useMutation({ mutationFn: (d) => base44.entities.Booking.create(d),             onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ id, d }) => base44.entities.Booking.update(id, d), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.Booking.delete(id),           onSuccess: invalidate });

  const handleSave = async (data) => {
    if (editing) await updateMutation.mutateAsync({ id: editing.id, d: data });
    else         await createMutation.mutateAsync(data);
    setEditing(null);
  };

  const handleEdit   = (b) => { setEditing(b); setFormOpen(true); };
  const handleDelete = async (b) => {
    if (window.confirm("Delete this booking?")) await deleteMutation.mutateAsync(b.id);
  };

  const filtered = bookings.filter((b) => {
    const clientName  = b.clients?.full_name?.toLowerCase() || "";
    const sessionName = b.class_sessions?.class_types?.name?.toLowerCase() || "";
    const matchesSearch = clientName.includes(search.toLowerCase()) || sessionName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Build prerequisite steps
  const prereqSteps = [];
  if (clients.length === 0)
    prereqSteps.push({ label: "Add at least one client.", to: "/clients", linkText: "Go to Clients →" });
  if (sessions.length === 0)
    prereqSteps.push({ label: "Schedule at least one class session.", to: "/classes", linkText: "Go to Classes →" });

  const canBook = prereqSteps.length === 0;

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
          <h1 className="text-2xl font-display font-semibold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">{bookings.length} total bookings</p>
        </div>
        <Button disabled={!canBook} onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2 w-fit">
          <Plus className="h-4 w-4" /> New Booking
        </Button>
      </div>

      {!canBook && <SetupNotice steps={prereqSteps} />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client or class…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No-Show</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BookingTable bookings={filtered} onEdit={handleEdit} onDelete={handleDelete} />

      <BookingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        booking={editing}
        clients={clients}
        sessions={sessions}
        clientMemberships={clientMemberships}
        onSave={handleSave}
      />
    </div>
  );
}
