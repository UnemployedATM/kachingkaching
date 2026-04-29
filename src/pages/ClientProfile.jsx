import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, ShieldAlert, Pencil } from "lucide-react";
import { useState } from "react";
import ClientForm from "../components/clients/ClientForm";
import ClientProfileBookings from "../components/clients/ClientProfileBookings";
import ClientProfilePayments from "../components/clients/ClientProfilePayments";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [notes, setNotes] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const list = await base44.entities.Client.filter({ id });
      return list[0] || null;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings-client", id],
    queryFn: () => base44.entities.Booking.filter({ client_id: id }, "-date"),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance-client", id],
    queryFn: () => base44.entities.Attendance.filter({ client_id: id }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-client", id],
    queryFn: () => base44.entities.Payment.filter({ client_id: id }, "-payment_date"),
  });

  const updateClient = useMutation({
    mutationFn: (data) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const upsertAttendance = useMutation({
    mutationFn: async ({ booking, status }) => {
      const existing = attendance.find((a) => a.booking_id === booking.id);
      if (existing) {
        return base44.entities.Attendance.update(existing.id, { status });
      }
      return base44.entities.Attendance.create({
        booking_id: booking.id,
        client_id: booking.client_id,
        client_name: booking.client_name,
        date: booking.date,
        status,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance-client", id] }),
  });

  const refundPayment = useMutation({
    mutationFn: (payment) =>
      base44.entities.Payment.update(payment.id, {
        status: "refunded",
        refund_date: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments-client", id] }),
  });

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateClient.mutateAsync({ notes });
    setSavingNotes(false);
    setNotes(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  const currentNotes = notes !== null ? notes : (client.notes || "");

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold">{client.full_name}</h1>
            <Badge
              variant="outline"
              className={client.status === "active" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}
            >
              {client.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-1">
            {client.email && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email}</span>}
            {client.phone && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{client.phone}</span>}
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Emergency + Stats */}
        <div className="space-y-4">
          {(client.emergency_contact_name || client.emergency_contact_phone) && (
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-accent-foreground" /> Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {client.emergency_contact_name && <p className="font-medium">{client.emergency_contact_name}</p>}
                {client.emergency_contact_relationship && <p className="text-muted-foreground">{client.emergency_contact_relationship}</p>}
                {client.emergency_contact_phone && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />{client.emergency_contact_phone}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border border-border/60 shadow-sm">
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">{bookings.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">
                  {attendance.filter((a) => a.status === "attended").length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Attended</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-accent-foreground">
                  {attendance.filter((a) => a.status === "no_show").length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">No-Shows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">
                  ${payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Paid</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={currentNotes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-28 text-sm"
                placeholder="Add notes about this client…"
              />
              {notes !== null && notes !== client.notes && (
                <Button size="sm" className="w-full" onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? "Saving…" : "Save Notes"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="bookings">
            <TabsList className="mb-4">
              <TabsTrigger value="bookings">Booking History</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings">
              <Card className="border border-border/60 shadow-sm">
                <CardContent className="pt-4">
                  <ClientProfileBookings
                    bookings={bookings}
                    attendance={attendance}
                    onToggleAttendance={(booking, status) =>
                      upsertAttendance.mutate({ booking, status })
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payments">
              <Card className="border border-border/60 shadow-sm">
                <CardContent className="pt-4">
                  <ClientProfilePayments
                    payments={payments}
                    onRefund={(p) => {
                      if (window.confirm(`Issue a refund of $${p.amount?.toFixed(2)} for this payment?`)) {
                        refundPayment.mutate(p);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ClientForm open={editOpen} onOpenChange={setEditOpen} client={client} onSave={(data) => updateClient.mutateAsync(data)} />
    </div>
  );
}