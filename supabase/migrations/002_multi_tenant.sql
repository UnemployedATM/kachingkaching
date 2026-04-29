-- ============================================================
-- Migration 002: Multi-tenant studio isolation
-- Run this in the Supabase SQL editor after 001_initial_schema.sql
-- ============================================================

-- Clean up previous single-tenant setup
DROP POLICY IF EXISTS "staff only" ON staff;
DROP POLICY IF EXISTS "staff only" ON clients;
DROP POLICY IF EXISTS "staff only" ON class_types;
DROP POLICY IF EXISTS "staff only" ON class_sessions;
DROP POLICY IF EXISTS "staff only" ON membership_plans;
DROP POLICY IF EXISTS "staff only" ON client_memberships;
DROP POLICY IF EXISTS "staff only" ON bookings;
DROP POLICY IF EXISTS "staff only" ON payments;
DROP POLICY IF EXISTS "staff only" ON attendance;
DROP POLICY IF EXISTS "staff only" ON waitlist;
DROP POLICY IF EXISTS "staff only" ON equipment;
DROP FUNCTION IF EXISTS is_staff();

-- ─── Studios (one per business) ───────────────────────────
CREATE TABLE studios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Add studio_id to every tenant-scoped table ───────────
ALTER TABLE staff               ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE clients             ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE class_types         ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE class_sessions      ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE membership_plans    ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE client_memberships  ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE bookings            ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE payments            ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE attendance          ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE waitlist            ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
ALTER TABLE equipment           ADD COLUMN studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;

-- ─── Helper: studio_id of the calling user (bypasses RLS) ─
CREATE OR REPLACE FUNCTION my_studio_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT studio_id FROM staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─── Auto-inject studio_id on every INSERT ────────────────
-- The app never needs to pass studio_id — the DB sets it automatically.
CREATE OR REPLACE FUNCTION auto_set_studio_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.studio_id IS NULL THEN
    NEW.studio_id := my_studio_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_studio_id BEFORE INSERT ON clients             FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON class_types         FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON class_sessions      FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON membership_plans    FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON client_memberships  FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON bookings            FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON payments            FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON attendance          FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON waitlist            FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();
CREATE TRIGGER set_studio_id BEFORE INSERT ON equipment           FOR EACH ROW EXECUTE FUNCTION auto_set_studio_id();

-- ─── RPC: atomic studio + owner creation ──────────────────
-- SECURITY DEFINER bypasses RLS safely — only called by the signed-in user
-- for their own account. Handles both new sign-ups and re-linking existing staff.
CREATE OR REPLACE FUNCTION create_studio(studio_name TEXT, owner_name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_studio_id UUID;
BEGIN
  INSERT INTO studios (name) VALUES (studio_name) RETURNING id INTO new_studio_id;

  INSERT INTO staff (full_name, email, role, auth_user_id, studio_id)
  VALUES (
    owner_name,
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'admin',
    auth.uid(),
    new_studio_id
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = auth.uid(),
        studio_id    = new_studio_id,
        full_name    = owner_name;

  RETURN new_studio_id;
END;
$$;

-- ─── RLS: studios ─────────────────────────────────────────
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own studio" ON studios FOR ALL TO authenticated
  USING (id = my_studio_id()) WITH CHECK (id = my_studio_id());

-- ─── RLS: staff ───────────────────────────────────────────
-- SELECT allows reading own row even before a studio is set up (needed for setup check).
-- INSERT is intentionally blocked for regular users — create_studio() handles it.
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or studio" ON staff FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR studio_id = my_studio_id());
CREATE POLICY "studio writes" ON staff FOR UPDATE TO authenticated
  USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "studio writes del" ON staff FOR DELETE TO authenticated
  USING (studio_id = my_studio_id());

-- ─── RLS: all other tables — strict studio isolation ──────
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist            ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own studio" ON clients             FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON class_types         FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON class_sessions      FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON membership_plans    FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON client_memberships  FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON bookings            FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON payments            FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON attendance          FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON waitlist            FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
CREATE POLICY "own studio" ON equipment           FOR ALL TO authenticated USING (studio_id = my_studio_id()) WITH CHECK (studio_id = my_studio_id());
