-- ============================================================
-- Migration 006: Atomic book_class RPC
-- Prevents double-spend via SELECT ... FOR UPDATE row lock.
-- ============================================================

CREATE OR REPLACE FUNCTION book_class(
  p_class_session_id UUID,
  p_membership_id    UUID DEFAULT NULL  -- NULL = drop-in, no credit deduction
)
RETURNS bookings LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id    UUID;
  v_studio_id    UUID;
  v_session      class_sessions%ROWTYPE;
  v_membership   client_memberships%ROWTYPE;
  v_booking      bookings%ROWTYPE;
BEGIN
  -- 1. Resolve caller's client record
  SELECT id, studio_id INTO v_client_id, v_studio_id
    FROM clients WHERE auth_user_id = auth.uid() LIMIT 1;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'CLIENT_NOT_FOUND';
  END IF;

  -- 2. Lock the session row — blocks concurrent bookings from reading
  --    stale capacity until this transaction commits.
  SELECT * INTO v_session
    FROM class_sessions
    WHERE id = p_class_session_id
      AND studio_id = v_studio_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND';
  END IF;

  IF v_session.status <> 'scheduled' THEN
    RAISE EXCEPTION 'SESSION_NOT_BOOKABLE';
  END IF;

  IF v_session.slots_booked >= v_session.max_capacity THEN
    RAISE EXCEPTION 'CLASS_FULL';
  END IF;

  -- 3. Validate membership if provided
  IF p_membership_id IS NOT NULL THEN
    SELECT * INTO v_membership
      FROM client_memberships
      WHERE id = p_membership_id
        AND client_id = v_client_id
        AND status = 'active'
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'MEMBERSHIP_NOT_VALID';
    END IF;

    -- Deduct credit atomically (NULL = unlimited, skip deduction)
    IF v_membership.credits_remaining IS NOT NULL THEN
      IF v_membership.credits_remaining <= 0 THEN
        RAISE EXCEPTION 'NO_CREDITS_REMAINING';
      END IF;
      UPDATE client_memberships
        SET credits_remaining = credits_remaining - 1
        WHERE id = p_membership_id;
    END IF;
  END IF;

  -- 4. Insert booking — trg_booking_slots trigger increments slots_booked
  INSERT INTO bookings (client_id, class_session_id, membership_id, status, studio_id)
    VALUES (v_client_id, p_class_session_id, p_membership_id, 'confirmed', v_studio_id)
    RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;
