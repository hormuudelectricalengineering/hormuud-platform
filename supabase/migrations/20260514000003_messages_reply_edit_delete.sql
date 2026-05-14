-- Migration: 20260514000003_messages_reply_edit_delete.sql
-- Adds reply, edit, and soft-delete support to messages table

-- ============================================================================
-- 1. NEW COLUMNS
-- ============================================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. RLS: UPDATE policy — allow sender to edit + recipient to mark as read
-- ============================================================================
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Users can update messages" ON public.messages
  FOR UPDATE USING (
    recipient_id = auth.uid() OR (sender_id = auth.uid() AND is_deleted = FALSE)
  );

-- ============================================================================
-- 3. INDEX for reply lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id);
