import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import PlanForm from "@/components/memberships/PlanForm";
import ClientMembershipForm from "@/components/memberships/ClientMembershipForm";
import SetupNotice from "@/components/shared/SetupNotice";
import { useAuth } from "@/lib/AuthContext";

const membershipStatusStyles = {
  active:    "bg-primary/10 text-primary border-primary/20",
  expired:   "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  paused:    "bg-accent text-accent-foreground border-accent",
};

const TYPE_LABELS = { drop_in: "Drop-In", class_pack: "Class Pack", monthly: "Monthly", annual: "Annual" };

export default function Memberships() {
  const queryClient = useQueryClient();
  const { staffRecord } = useAuth();
  const studioId = staffRecord?.studio_id;
  const [tab, setTab]                                 = useState("clients");
  const [planFormOpen, setplanFormOpen]               = useState(false);
  const [clientMemFormOpen, setClientMemFormOpen]     = useState(false);
  const [editingPlan, setEditingPlan]                 = useState(null);

  const { data: plans       = [] } = useQuery({ queryKey: ["membership_plans"],   queryFn: () => base44.entities.MembershipPlan.list() });
  const { data: memberships = [] } = useQuery({ queryKey: ["client_memberships"], queryFn: () => base44.entities.ClientMembership.list() });
  const { data: clients     = [] } = useQuery({ queryKey: ["clients"],            queryFn: () => base44.entities.Client.list() });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["membership_plans"] });
    queryClient.invalidateQueries({ queryKey: ["client_memberships"] });
  };

  const createPlan = useMutation({ mutationFn: (d) => base44.entities.MembershipPlan.create(d),              onSuccess: invalidate });
  const updatePlan = useMutation({ mutationFn: ({ id, d }) => base44.entities.MembershipPlan.update(id, d),  onSuccess: invalidate });
  const deletePlan = useMutation({ mutationFn: (id) => base44.entities.MembershipPlan.delete(id),            onSuccess: invalidate });
  const createMem  = useMutation({ mutationFn: (d) => base44.entities.ClientMembership.create(d),              onSuccess: invalidate });
  const updateMem  = useMutation({ mutationFn: ({ id, d }) => base44.entities.ClientMembership.update(id, d),  onSuccess: invalidate });
  const deleteMem  = useMutation({ mutationFn: (id) => base44.entities.ClientMembership.delete(id),            onSuccess: invalidate });

  const handleSavePlan = async (data) => {
    const payload = { ...data, is_active: true, ...(studioId ? { studio_id: studioId } : {}) };
    if (editingPlan) await updatePlan.mutateAsync({ id: editingPlan.id, d: payload });
    else             await createPlan.mutateAsync(payload);
    setEditingPlan(null);
  };

  // Prerequisite steps for assigning a membership
  const assignSteps = [];
  if (clients.length === 0)
    assignSteps.push({ label: "Add at least one client.", to: "/clients", linkText: "Go to Clients →" });
  if (plans.length === 0)
    assignSteps.push({ label: "Create at least one membership plan.", linkText: "Go to Plans →", onClick: () => setTab("plans") });

  const canAssign = assignSteps.length === 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
          <BadgeCheck className="h-6 w-6 text-primary" /> Memberships
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage membership plans and client subscriptions</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="clients">Client Memberships ({memberships.length})</TabsTrigger>
          <TabsTrigger value="plans">Plans ({plans.length})</TabsTrigger>
        </TabsList>

        {/* ── Client Memberships tab ── */}
        <TabsContent value="clients" className="space-y-4">
          {!canAssign && <SetupNotice steps={assignSteps} />}

          <div className="flex justify-end">
            <Button disabled={!canAssign} onClick={() => setClientMemFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Assign Membership
            </Button>
          </div>

          {memberships.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No memberships assigned yet</div>
          ) : (
            <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Client</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="hidden sm:table-cell">Credits</TableHead>
                      <TableHead className="hidden md:table-cell">Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">{m.clients?.full_name || "—"}</TableCell>
                        <TableCell>
                          <div>{m.membership_plans?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{TYPE_LABELS[m.membership_plans?.type] || ""}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {m.credits_remaining == null
                            ? <span className="text-primary font-medium">Unlimited</span>
                            : <span>{m.credits_remaining} left</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {m.expires_at ? format(new Date(m.expires_at), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={membershipStatusStyles[m.status] || ""}>
                            {m.status?.charAt(0).toUpperCase() + m.status?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="text-xs h-7"
                              onClick={() => updateMem.mutate({ id: m.id, d: { status: m.status === "active" ? "paused" : "active" } })}>
                              {m.status === "active" ? "Pause" : "Activate"}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:bg-destructive/10"
                              onClick={() => { if (window.confirm("Remove this membership?")) deleteMem.mutate(m.id); }}>
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Plans tab ── */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingPlan(null); setplanFormOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> New Plan
            </Button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No plans created yet — create one to assign memberships</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div key={p.id} className="rounded-xl border border-border/60 bg-card shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[p.type]}</p>
                    </div>
                    <p className="text-lg font-semibold text-primary">${(p.price_cents / 100).toFixed(2)}</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{p.credits == null ? "Unlimited classes" : `${p.credits} classes`}</p>
                    {p.validity_days && <p>Valid {p.validity_days} days</p>}
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingPlan(p); setplanFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                      if (window.confirm(`Delete plan "${p.name}"?`)) deletePlan.mutate(p.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PlanForm open={planFormOpen} onOpenChange={setplanFormOpen} plan={editingPlan} onSave={handleSavePlan} />
      <ClientMembershipForm open={clientMemFormOpen} onOpenChange={setClientMemFormOpen} clients={clients} plans={plans} onSave={(d) => createMem.mutateAsync(d)} />
    </div>
  );
}
