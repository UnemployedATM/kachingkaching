import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import ClassTypeForm from "@/components/classes/ClassTypeForm";
import SessionForm from "@/components/classes/SessionForm";
import SetupNotice from "@/components/shared/SetupNotice";
import { useAuth } from "@/lib/AuthContext";

const sessionStatusStyles = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  completed:  "bg-muted text-muted-foreground border-border",
  cancelled:  "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Classes() {
  const queryClient = useQueryClient();
  const { staffRecord } = useAuth();
  const studioId = staffRecord?.studio_id;
  const [tab, setTab]                           = useState("sessions");
  const [typeFormOpen, setTypeFormOpen]         = useState(false);
  const [sessionFormOpen, setSessionFormOpen]   = useState(false);
  const [editingType, setEditingType]           = useState(null);
  const [editingSession, setEditingSession]     = useState(null);

  const { data: classTypes  = [] } = useQuery({ queryKey: ["class_types"], queryFn: () => base44.entities.ClassType.list() });
  const { data: sessions    = [] } = useQuery({ queryKey: ["sessions"],    queryFn: () => base44.entities.ClassSession.list() });
  const { data: instructors = [] } = useQuery({ queryKey: ["staff"],       queryFn: () => base44.entities.Staff?.list?.() ?? Promise.resolve([]) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["class_types"] });
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
  };

  const createType    = useMutation({ mutationFn: (d) => base44.entities.ClassType.create(d),              onSuccess: invalidate });
  const updateType    = useMutation({ mutationFn: ({ id, d }) => base44.entities.ClassType.update(id, d),  onSuccess: invalidate });
  const deleteType    = useMutation({ mutationFn: (id) => base44.entities.ClassType.delete(id),            onSuccess: invalidate });
  const createSession = useMutation({ mutationFn: (d) => base44.entities.ClassSession.create(d),           onSuccess: invalidate });
  const updateSession = useMutation({ mutationFn: ({ id, d }) => base44.entities.ClassSession.update(id, d), onSuccess: invalidate });
  const deleteSession = useMutation({ mutationFn: (id) => base44.entities.ClassSession.delete(id),         onSuccess: invalidate });

  const handleSaveType = async (data) => {
    const payload = studioId ? { ...data, studio_id: studioId } : data;
    if (editingType) await updateType.mutateAsync({ id: editingType.id, d: payload });
    else             await createType.mutateAsync(payload);
    setEditingType(null);
  };

  const handleSaveSession = async (data) => {
    const payload = studioId ? { ...data, studio_id: studioId } : data;
    if (editingSession) await updateSession.mutateAsync({ id: editingSession.id, d: payload });
    else                await createSession.mutateAsync(payload);
    setEditingSession(null);
  };

  const noClassTypes = classTypes.length === 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Classes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage class types and scheduled sessions</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sessions">Schedule ({sessions.length})</TabsTrigger>
          <TabsTrigger value="types">Class Types ({classTypes.length})</TabsTrigger>
        </TabsList>

        {/* ── Sessions tab ── */}
        <TabsContent value="sessions" className="space-y-4">
          {noClassTypes && (
            <SetupNotice steps={[{
              label: "Create at least one Class Type before scheduling sessions.",
              linkText: "Go to Class Types →",
              onClick: () => setTab("types"),
            }]} />
          )}

          <div className="flex justify-end">
            <Button
              disabled={noClassTypes}
              onClick={() => { setEditingSession(null); setSessionFormOpen(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Schedule Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No sessions scheduled yet</div>
          ) : (
            <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Class</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="hidden sm:table-cell">Instructor</TableHead>
                      <TableHead>Spots</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.class_types?.color }} />
                            {s.class_types?.name || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>{format(new Date(s.starts_at), "EEE, MMM d, yyyy")}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(s.starts_at), "h:mm a")} – {format(new Date(s.ends_at), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {s.staff?.full_name || "—"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {s.slots_booked}/{s.max_capacity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sessionStatusStyles[s.status] || ""}>
                            {s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingSession(s); setSessionFormOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                              if (window.confirm("Delete this session?")) deleteSession.mutate(s.id);
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* ── Class Types tab ── */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingType(null); setTypeFormOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> New Class Type
            </Button>
          </div>

          {classTypes.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No class types yet — create one to get started</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classTypes.map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-card shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge variant="outline" className={t.is_active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration_minutes} min</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />Up to {t.default_capacity}</span>
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingType(t); setTypeFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                      if (window.confirm(`Delete "${t.name}"?`)) deleteType.mutate(t.id);
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

      <ClassTypeForm open={typeFormOpen} onOpenChange={setTypeFormOpen} classType={editingType} onSave={handleSaveType} />
      <SessionForm open={sessionFormOpen} onOpenChange={setSessionFormOpen} session={editingSession} classTypes={classTypes} instructors={instructors} onSave={handleSaveSession} />
    </div>
  );
}
