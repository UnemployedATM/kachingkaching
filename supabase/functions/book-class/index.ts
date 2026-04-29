import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // 1. Extract JWT — reject anything without a Bearer token immediately
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'UNAUTHORIZED' }, 401);
    }
    const jwt = authHeader.slice(7);

    // 2. Verify the JWT with a user-scoped client (not service_role)
    //    getUser() validates the token signature and expiry server-side.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return json({ error: 'UNAUTHORIZED' }, 401);
    }

    // 3. Parse body
    const { class_session_id, membership_id } = await req.json();
    if (!class_session_id) {
      return json({ error: 'MISSING_CLASS_SESSION_ID' }, 400);
    }

    // 4. Call atomic RPC — all locking, capacity checks, and credit deduction
    //    happen inside a single Postgres transaction via book_class().
    const { data, error } = await userClient.rpc('book_class', {
      p_class_session_id: class_session_id,
      p_membership_id:    membership_id ?? null,
    });

    if (error) {
      const known: Record<string, [string, number]> = {
        CLIENT_NOT_FOUND:     ['Your profile was not found.',      404],
        SESSION_NOT_FOUND:    ['Class not found.',                 404],
        SESSION_NOT_BOOKABLE: ['This class is no longer open.',    409],
        CLASS_FULL:           ['This class is full.',              409],
        MEMBERSHIP_NOT_VALID: ['Membership is not active.',        400],
        NO_CREDITS_REMAINING: ['No credits remaining.',            400],
      };
      const key = Object.keys(known).find(k => error.message.includes(k));
      const [message, status] = key ? known[key] : ['Booking failed.', 500];
      return json({ error: message }, status);
    }

    return json({ booking: data }, 200);
  } catch (_e) {
    return json({ error: 'Internal error' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
