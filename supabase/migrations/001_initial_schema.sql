-- ============================================================
-- Wellness Studio — Initial Schema
-- Run this in the Supabase SQL editor (project → SQL editor)
-- ============================================================

-- Enums
CREATE TYPE staff_role        AS ENUM ('admin', 'instructor', 'front_desk');
CREATE TYPE client_status     AS ENUM ('active', 'inactive');
CREATE TYPE session_status    AS ENUM ('scheduled', 'cancelled', 'completed');
CREATE TYPE membership_type   AS ENUM ('drop_in', 'class_pack', 'monthly', 'annual');
CREATE TYPE membership_status AS ENUM ('active', 'expired', 'cancelled', 'paused');
CREATE TYPE booking_status    AS ENUM ('confirmed', 'cancelled', 'waitlisted', 'no_show');
CREATE TYPE payment_type      AS ENUM ('drop_in', 'membership_purchase', 'refund');
CREATE TYPE payment_method    AS ENUM ('stripe', 'cash', 'card', 'bank_transfer');
CREATE TYPE payment_status    AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'cancelled');
CREATE TYPE waitlist_status   AS ENUM ('waiting', 'promoted', 'expired', 'removed');
CREATE TYPE equipment_status  AS ENUM ('available', 'maintenance', 'retired');

-- ─── Staff ────────────────────────────────────────────────
CREATE TABLE staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name    TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  role         staff_role DEFAULT 'front_desk',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Clients ──────────────────────────────────────────────
CREATE TABLE clients (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id                    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name                       TEXT NOT NULL,
  email                           TEXT,
  phone                           TEXT,
  date_of_birth                   DATE,
  emergency_contact_name          TEXT,
  emergency_contact_phone         TEXT,
  emergency_contact_relationship  TEXT,
  notes                           TEXT,
  status                          client_status DEFAULT 'active',
  created_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Class Types ──────────────────────────────────────────
CREATE TABLE class_types (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INTEGER DEFAULT 60,
  default_capacity INTEGER DEFAULT 10,
  color            TEXT DEFAULT '#6366f1',
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Class Sessions ───────────────────────────────────────
CREATE TABLE class_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type_id UUID NOT NULL REFERENCES class_types(id) ON DELETE RESTRICT,
  instructor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  max_capacity  INTEGER NOT NULL,
  slots_booked  INTEGER DEFAULT 0,
  status        session_status DEFAULT 'scheduled',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Membership Plans ─────────────────────────────────────
CREATE TABLE membership_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            membership_type NOT NULL,
  price_cents     INTEGER NOT NULL,
  credits         INTEGER,        -- NULL = unlimited (monthly/annual)
  validity_days   INTEGER,        -- NULL = no expiry
  stripe_price_id TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Client Memberships ───────────────────────────────────
CREATE TABLE client_memberships (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id              UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id                UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  credits_remaining      INTEGER,  -- NULL = unlimited
  started_at             DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at             DATE,
  stripe_subscription_id TEXT,
  status                 membership_status DEFAULT 'active',
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Bookings ─────────────────────────────────────────────
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  class_session_id    UUID NOT NULL REFERENCES class_sessions(id) ON DELETE RESTRICT,
  membership_id       UUID REFERENCES client_memberships(id) ON DELETE SET NULL,
  status              booking_status DEFAULT 'confirmed',
  booked_at           TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, class_session_id)
);

-- ─── Payments ─────────────────────────────────────────────
CREATE TABLE payments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  booking_id                  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  membership_id               UUID REFERENCES client_memberships(id) ON DELETE SET NULL,
  amount_cents                INTEGER NOT NULL,
  currency                    TEXT DEFAULT 'usd',
  type                        payment_type NOT NULL,
  method                      payment_method DEFAULT 'cash',
  status                      payment_status DEFAULT 'pending',
  stripe_payment_intent_id    TEXT,
  stripe_checkout_session_id  TEXT,
  payment_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  refund_date                 DATE,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance ───────────────────────────────────────────
CREATE TABLE attendance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  status           attendance_status DEFAULT 'present',
  marked_at        TIMESTAMPTZ DEFAULT NOW(),
  marked_by        UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- ─── Waitlist ─────────────────────────────────────────────
CREATE TABLE waitlist (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL,
  status           waitlist_status DEFAULT 'waiting',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, class_session_id)
);

-- ─── Equipment ────────────────────────────────────────────
CREATE TABLE equipment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  type           TEXT DEFAULT 'other',
  total_quantity INTEGER DEFAULT 1,
  description    TEXT,
  status         equipment_status DEFAULT 'available',
  grid_slot_id   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_class_sessions_starts_at   ON class_sessions(starts_at);
CREATE INDEX idx_class_sessions_class_type  ON class_sessions(class_type_id);
CREATE INDEX idx_bookings_client            ON bookings(client_id);
CREATE INDEX idx_bookings_session           ON bookings(class_session_id);
CREATE INDEX idx_bookings_status            ON bookings(status);
CREATE INDEX idx_payments_client            ON payments(client_id);
CREATE INDEX idx_payments_date              ON payments(payment_date);
CREATE INDEX idx_attendance_session         ON attendance(class_session_id);
CREATE INDEX idx_client_memberships_client  ON client_memberships(client_id);
CREATE INDEX idx_waitlist_session           ON waitlist(class_session_id);

-- ─── Auto-maintain slots_booked ───────────────────────────
CREATE OR REPLACE FUNCTION update_session_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE class_sessions SET slots_booked = slots_booked + 1 WHERE id = NEW.class_session_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE class_sessions SET slots_booked = slots_booked + 1 WHERE id = NEW.class_session_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status <> 'confirmed' THEN
      UPDATE class_sessions SET slots_booked = GREATEST(0, slots_booked - 1) WHERE id = NEW.class_session_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE class_sessions SET slots_booked = GREATEST(0, slots_booked - 1) WHERE id = OLD.class_session_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_slots
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_session_slots();
