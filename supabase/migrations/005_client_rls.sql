-- ============================================================
-- Migration 005: Client-facing RLS + input validation
-- Run after 002_multi_tenant.sql
-- ============================================================

-- ─── Helper: client row for the calling auth user ─────────
CREATE OR REPLACE FUNCTION my_client_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM clients WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─── Helper: studio_id for the calling client ─────────────
CREATE OR REPLACE FUNCTION my_client_studio_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT studio_id FROM clients WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─── Client policies ──────────────────────────────────────
-- Clients can read and update their own profile row.
-- INSERT is intentionally blocked — studio staff creates client records.
CREATE POLICY "client own profile" ON clients FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "client update own profile" ON clients FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Clients can read scheduled class sessions in their studio.
CREATE POLICY "client read sessions" ON class_sessions FOR SELECT TO authenticated
  USING (studio_id = my_client_studio_id() AND status = 'scheduled');

-- Clients can read active membership plans in their studio.
CREATE POLICY "client read plans" ON membership_plans FOR SELECT TO authenticated
  USING (studio_id = my_client_studio_id() AND is_active = TRUE);

-- Clients can read their own memberships.
CREATE POLICY "client own memberships" ON client_memberships FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- Clients can read and cancel their own bookings.
-- INSERT is handled exclusively by the book_class() RPC (SECURITY DEFINER).
CREATE POLICY "client own bookings select" ON bookings FOR SELECT TO authenticated
  USING (client_id = my_client_id());

CREATE POLICY "client cancel own booking" ON bookings FOR UPDATE TO authenticated
  USING  (client_id = my_client_id() AND status = 'confirmed')
  WITH CHECK (client_id = my_client_id() AND status = 'cancelled');

-- ─── Input validation: reject HTML in name/text fields ────
-- Prevents stored XSS: a client setting their name to <script>...</script>
ALTER TABLE clients
  ADD CONSTRAINT no_html_full_name  CHECK (full_name  !~ '[<>]'),
  ADD CONSTRAINT no_html_email      CHECK (email      !~ '[<>]'),
  ADD CONSTRAINT no_html_phone      CHECK (phone      !~ '[<>]');

ALTER TABLE staff
  ADD CONSTRAINT no_html_full_name  CHECK (full_name  !~ '[<>]'),
  ADD CONSTRAINT no_html_email      CHECK (email      !~ '[<>]');
