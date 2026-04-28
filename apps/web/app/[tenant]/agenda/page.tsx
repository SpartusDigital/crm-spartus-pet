'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import api from '@/lib/api';
import AppointmentModal from '@/components/appointments/AppointmentModal';
import dayjs from 'dayjs';

export default function AgendaPage({ params }: { params: { tenant: string } }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/appointments/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const events = appointments.map((appt: any) => ({
    id: appt.id,
    title: `${appt.pet?.name} — ${appt.service?.name}`,
    start: appt.startsAt,
    end: appt.endsAt,
    backgroundColor: appt.service?.color ?? 'rgb(var(--color-primary))',
    borderColor: 'transparent',
    extendedProps: appt,
    classNames: appt.status === 'CANCELLED' ? ['opacity-50 line-through'] : [],
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 text-sm">Gerencie todos os agendamentos</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => { setSelectedAppointment(null); setModalOpen(true); }}
        >
          + Novo Agendamento
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            events={events}
            height="calc(100vh - 240px)"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            businessHours={{ daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '18:00' }}
            editable
            selectable
            selectMirror
            select={(info) => {
              setSelectedDate(info.startStr);
              setSelectedAppointment(null);
              setModalOpen(true);
            }}
            eventClick={(info) => {
              setSelectedAppointment(info.event.extendedProps);
              setModalOpen(true);
            }}
            eventDrop={(info) => {
              updateMutation.mutate({
                id: info.event.id,
                data: {
                  startsAt: info.event.startStr,
                  endsAt: info.event.endStr,
                },
              });
            }}
            eventResize={(info) => {
              updateMutation.mutate({
                id: info.event.id,
                data: {
                  startsAt: info.event.startStr,
                  endsAt: info.event.endStr,
                },
              });
            }}
          />
        </div>
      </div>

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        appointment={selectedAppointment}
        defaultDate={selectedDate}
      />
    </div>
  );
}
