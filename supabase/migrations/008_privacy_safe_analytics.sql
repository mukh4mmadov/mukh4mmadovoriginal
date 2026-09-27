DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;

CREATE OR REPLACE FUNCTION public.sanitize_analytics_json(input_value JSONB)
RETURNS JSONB
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE jsonb_typeof(input_value)
    WHEN 'object' THEN COALESCE(
      (
        SELECT jsonb_object_agg(key, public.sanitize_analytics_json(value))
        FROM jsonb_each(input_value)
        WHERE key !~* '(prompt|answer|content|message|email|name|text|token|url|bio)'
      ),
      '{}'::jsonb
    )
    WHEN 'array' THEN COALESCE(
      (SELECT jsonb_agg(public.sanitize_analytics_json(value)) FROM jsonb_array_elements(input_value)),
      '[]'::jsonb
    )
    ELSE input_value
  END;
$$;

UPDATE public.analytics_events
SET event_data = public.sanitize_analytics_json(COALESCE(event_data, '{}'::jsonb)),
    browser_info = jsonb_strip_nulls(jsonb_build_object('language', browser_info ->> 'language')),
    device_info = CASE
      WHEN device_info ->> 'screenWidth' IS NULL THEN '{}'::jsonb
      WHEN (device_info ->> 'screenWidth')::INTEGER < 768 THEN '{"category":"mobile"}'::jsonb
      WHEN (device_info ->> 'screenWidth')::INTEGER < 1024 THEN '{"category":"tablet"}'::jsonb
      ELSE '{"category":"desktop"}'::jsonb
    END,
    page_url = split_part(split_part(page_url, '?', 1), '#', 1);

DROP FUNCTION public.sanitize_analytics_json(JSONB);

CREATE POLICY "Anonymous analytics must not contain a user id"
  ON public.analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can insert their own analytics"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
