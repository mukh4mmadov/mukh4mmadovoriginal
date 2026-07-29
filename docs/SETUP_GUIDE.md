# Supabase Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose a name (e.g., "ielts-reading-app")
4. Choose a database password (save this securely)
5. Select a region closest to your users
6. Click "Create new project"
7. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Supabase Credentials

1. Go to your project dashboard
2. Navigate to Settings → API
3. Copy the following values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (optional - for Google Sign In)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run Database Migrations

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

### Option B: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Push migrations:
   ```bash
   supabase db push
   ```

## Step 5: Enable Google OAuth (Optional)

### In Supabase Dashboard

1. Go to Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
   - Redirect URL: `https://your-project-url.supabase.co/auth/v1/callback`

### In Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-production-domain.com/auth/callback` (production)

## Step 6: Install Dependencies

```bash
npm install
```

The following packages will be installed:
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Next.js auth helpers
- `@supabase/auth-helpers-react` - React auth helpers

## Step 7: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 8: Test Authentication

1. Open the app in your browser
2. Click the "Sign In" button in the navbar
3. Test different authentication methods:
   - Email + Password
   - Google Sign In (if configured)
   - Guest Mode

## Step 9: Test Data Sync

1. Complete a reading passage
2. Save a Study Wisdom quote
3. Sign out and sign in again
4. Verify your data persists

## Step 10: Test Migration (If You Have Local Data)

1. Sign in with an account
2. The migration prompt should appear
3. Click "Import Local Data"
4. Verify your data is now in Supabase

## Troubleshooting

### Connection Issues

If you see connection errors:
- Verify your `.env.local` file has correct values
- Check that your Supabase project is active
- Ensure you're not behind a corporate firewall blocking Supabase

### Authentication Issues

If Google Sign In fails:
- Verify your Google OAuth credentials are correct
- Check that redirect URLs match exactly
- Ensure Google provider is enabled in Supabase

### Migration Issues

If migration fails:
- Check that migration files are in the correct order
- Verify you have the necessary permissions
- Check Supabase logs for specific error messages

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Enable Row Level Security (RLS) in production
- Use Supabase's built-in backup features
- Regularly rotate your database password

## Next Steps

After setup is complete:
1. Configure your production environment variables
2. Set up continuous deployment
3. Enable database backups
4. Monitor usage in Supabase dashboard
5. Set up alerts for unusual activity
