-- add missing UPDATE policy for availability table
-- this allows updating availability blocks (move, resize, edit dialog)

CREATE POLICY "Availability updatable by anyone" ON availability FOR UPDATE USING (true);
