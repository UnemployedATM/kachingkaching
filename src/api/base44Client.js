import { supabase } from '@/lib/supabase';

function raise(error) {
  if (error) throw error;
}

function parseSort(sort, fallback = 'created_at') {
  if (!sort) return { column: fallback, ascending: false };
  const ascending = !sort.startsWith('-');
  const column = ascending ? sort : sort.slice(1);
  return { column, ascending };
}

// Bookings are fetched with all their related data joined in
const BOOKING_SELECT = `
  *,
  clients ( id, full_name, email, phone ),
  class_sessions (
    id, starts_at, ends_at, max_capacity, slots_booked, status, notes,
    class_types ( id, name, color, duration_minutes ),
    staff ( id, full_name )
  ),
  client_memberships ( id, plan_id, credits_remaining, status,
    membership_plans ( id, name, type )
  )
`;

function makeEntity(table, select = '*', defaultSort = 'created_at') {
  return {
    list: async (sort) => {
      const { column, ascending } = parseSort(sort, defaultSort);
      const { data, error } = await supabase.from(table).select(select).order(column, { ascending });
      raise(error);
      return data ?? [];
    },
    filter: async (conditions, sort) => {
      let q = supabase.from(table).select(select);
      Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
      if (sort) {
        const { column, ascending } = parseSort(sort, defaultSort);
        q = q.order(column, { ascending });
      } else {
        q = q.order(defaultSort, { ascending: false });
      }
      const { data, error } = await q;
      raise(error);
      return data ?? [];
    },
    create: async (data) => {
      const { data: item, error } = await supabase.from(table).insert(data).select(select).single();
      raise(error);
      return item;
    },
    update: async (id, data) => {
      const { data: item, error } = await supabase.from(table).update(data).eq('id', id).select(select).single();
      raise(error);
      return item;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      raise(error);
    },
  };
}

export const base44 = {
  entities: {
    Client:           makeEntity('clients',            '*',                    'created_at'),
    Equipment:        makeEntity('equipment',          '*',                    'created_at'),
    ClassType:        makeEntity('class_types',        '*',                    'name'),
    MembershipPlan:   makeEntity('membership_plans',   '*',                    'name'),
    Payment:          makeEntity('payments',
      '*, clients ( id, full_name )',
      'payment_date'
    ),
    Attendance:       makeEntity('attendance',         '*',                    'marked_at'),
    Waitlist:         makeEntity('waitlist',           '*',                    'created_at'),
    Staff:            makeEntity('staff',              'id, full_name, role, email, studio_id', 'full_name'),

    // Bookings include full join tree
    Booking: {
      list: async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select(BOOKING_SELECT)
          .order('booked_at', { ascending: false });
        raise(error);
        return data ?? [];
      },
      filter: async (conditions) => {
        let q = supabase.from('bookings').select(BOOKING_SELECT);
        Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
        q = q.order('booked_at', { ascending: false });
        const { data, error } = await q;
        raise(error);
        return data ?? [];
      },
      create: async (data) => {
        const { data: item, error } = await supabase
          .from('bookings').insert(data).select(BOOKING_SELECT).single();
        raise(error);
        return item;
      },
      update: async (id, data) => {
        const { data: item, error } = await supabase
          .from('bookings').update(data).eq('id', id).select(BOOKING_SELECT).single();
        raise(error);
        return item;
      },
      delete: async (id) => {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        raise(error);
      },
    },

    // Class sessions include type + instructor
    ClassSession: {
      list: async () => {
        const { data, error } = await supabase
          .from('class_sessions')
          .select('*, class_types ( id, name, color, duration_minutes ), staff ( id, full_name )')
          .order('starts_at', { ascending: false });
        raise(error);
        return data ?? [];
      },
      filter: async (conditions) => {
        let q = supabase
          .from('class_sessions')
          .select('*, class_types ( id, name, color, duration_minutes ), staff ( id, full_name )');
        Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
        q = q.order('starts_at', { ascending: true });
        const { data, error } = await q;
        raise(error);
        return data ?? [];
      },
      create: async (data) => {
        const { data: item, error } = await supabase
          .from('class_sessions')
          .insert(data)
          .select('*, class_types ( id, name, color, duration_minutes ), staff ( id, full_name )')
          .single();
        raise(error);
        return item;
      },
      update: async (id, data) => {
        const { data: item, error } = await supabase
          .from('class_sessions')
          .update(data).eq('id', id)
          .select('*, class_types ( id, name, color, duration_minutes ), staff ( id, full_name )')
          .single();
        raise(error);
        return item;
      },
      delete: async (id) => {
        const { error } = await supabase.from('class_sessions').delete().eq('id', id);
        raise(error);
      },
    },

    // Client memberships include plan + client name
    ClientMembership: {
      list: async () => {
        const { data, error } = await supabase
          .from('client_memberships')
          .select('*, clients ( id, full_name ), membership_plans ( id, name, type, credits )')
          .order('created_at', { ascending: false });
        raise(error);
        return data ?? [];
      },
      filter: async (conditions) => {
        let q = supabase
          .from('client_memberships')
          .select('*, clients ( id, full_name ), membership_plans ( id, name, type, credits )');
        Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
        q = q.order('created_at', { ascending: false });
        const { data, error } = await q;
        raise(error);
        return data ?? [];
      },
      create: async (data) => {
        const { data: item, error } = await supabase
          .from('client_memberships')
          .insert(data)
          .select('*, clients ( id, full_name ), membership_plans ( id, name, type, credits )')
          .single();
        raise(error);
        return item;
      },
      update: async (id, data) => {
        const { data: item, error } = await supabase
          .from('client_memberships')
          .update(data).eq('id', id)
          .select('*, clients ( id, full_name ), membership_plans ( id, name, type, credits )')
          .single();
        raise(error);
        return item;
      },
      delete: async (id) => {
        const { error } = await supabase.from('client_memberships').delete().eq('id', id);
        raise(error);
      },
    },
  },

  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    },
  },
};
