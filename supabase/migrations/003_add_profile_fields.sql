-- Add additional profile fields for the profile page
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add unique constraint on username (optional, uncomment if needed)
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_username UNIQUE (username);
