import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import CalendarHeader from "../components/calendar/CalendarHeader";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import DayView from "../components/calendar/DayView";
import BookingForm from "../components/bookings/BookingForm";
import BookingDetailSheet from "../components/bookings/BookingDetailSheet";

export default function Calendar() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [defaultDate, setDefaultDate] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list("-date"),
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedBooking(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedBooking(null);
    },
  });

  const handleSave = async (data) => {
    if (editingBooking) {
      await updateMutation.mutateAsync({ id: editingBooking.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setEditingBooking(null);
  };

  const handleDayClick = (day) => {
    setDefaultDate(format(day, "yyyy-MM-dd"));
    setEditingBooking(null);
    setFormOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your studio schedule</p>
        </div>
        <Button onClick={() => { setEditingBooking(null); setDefaultDate(""); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Booking
        </Button>
      </div>

      <CalendarHeader view={view} setView={setView} currentDate={currentDate} setCurrentDate={setCurrentDate} />

      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          bookings={bookings}
          onBookingClick={setSelectedBooking}
          onDayClick={handleDayClick}
        />
      )}
      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          bookings={bookings}
          onBookingClick={setSelectedBooking}
        />
      )}
      {view === "day" && (
        <DayView
          currentDate={currentDate}
          bookings={bookings}
          onBookingClick={setSelectedBooking}
        />
      )}

      <BookingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        booking={editingBooking}
        clients={clients}
        sessions={sessions}
        clientMemberships={clientMemberships}
        onSave={handleSave}
      />

      <BookingDetailSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onEdit={(b) => { setEditingBooking(b); setSelectedBooking(null); setFormOpen(true); }}
        onDelete={(b) => {
          if (window.confirm("Delete this booking?")) deleteMutation.mutate(b.id);
        }}
        onStatusChange={(b, status) => updateMutation.mutate({ id: b.id, data: { ...b, status } })}
      />
    </div>
  );
}