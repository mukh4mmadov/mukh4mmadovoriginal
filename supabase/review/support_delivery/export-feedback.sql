-- Export and save these source rows before deployment; this uses only columns
-- present in the original feedback_messages schema.
SELECT to_jsonb(f) AS feedback_row
FROM public.feedback_messages AS f
ORDER BY f.created_at, f.id;
