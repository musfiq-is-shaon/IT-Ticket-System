# IT Ticket Management System - Deployment Guide

## Overview

This guide covers the complete setup process for deploying the IT Ticket Management System to Vercel with Supabase as the backend.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git
- Supabase account
- Vercel account (for deployment)

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Name: `it-ticket-system`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
4. Wait for project creation (~2 minutes)

### Step 2: Execute Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute the SQL
5. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `organizations`, `profiles`, `tickets`, `comments`, `ticket_activity_logs`, `organization_invitations`

### Step 3: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. (Optional) Enable Google, GitHub, etc.
4. Go to **URL Configuration**
5. Add your site URL:
   - For local: `http://localhost:3000`
   - For Vercel: `https://your-project.vercel.app`
6. Set redirect URLs

### Step 4: Get API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **Service Role** (under API section)
4. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (for migrations only, never expose!)

---

## Part 2: Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
cd /Users/musfiqulislamshaon/training-ground-8
git clone <your-repo-url> it-ticket-system
cd it-ticket-system

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your Supabase keys
nano .env.local
```

Add your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Part 3: Vercel Deployment

### Step 1: Push to GitHub

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: IT Ticket System"

# Create GitHub repo and push
gh repo create it-ticket-system --public --source=. --push
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`
5. Click "Deploy"

### Step 3: Configure Supabase for Production

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add production URL: `https://your-project.vercel.app`
3. Add to redirect URLs list

### Step 4: Verify Deployment

1. Visit your Vercel deployment URL
2. Test signup/login flow
3. Create a test ticket
4. Verify email confirmation works

---

## Part 4: Database Management

### Seed Demo Data (Optional)

To add demo data for testing:

```sql
-- Insert into Supabase SQL Editor

-- Create demo organization
INSERT INTO organizations (name, slug) 
VALUES ('Demo Corp', 'demo-corp')
RETURNING id;

-- Manually create admin user (after signup)
-- Or update role after user signs up:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin@email.com';
```

### Backup & Restore

1. **Daily Backups**: Supabase provides automatic daily backups (Pro plan)
2. **Manual Backup**: Go to **Settings** → **Database** → **Backups**
3. **Point-in-time Recovery**: Available on Pro plan

---

## Part 5: Security Checklist

### Environment Variables (Never Commit!)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Public, safe to expose
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public, but restrict policies
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - **Secret**, never expose to client!

### Row Level Security

- [ ] RLS enabled on all tables
- [ ] Policies tested for each role
- [ ] No bypass policies created

### Authentication

- [ ] Email confirmation enabled (recommended)
- [ ] Password strength requirements set
- [ ] Rate limiting configured

---

## Part 6: Troubleshooting

### Common Issues

#### "RLS policy denied"

Check:
1. User is logged in
2. User has valid organization_id in profile
3. Query matches RLS policy conditions

#### "Session expired" on refresh

Fix:
1. Check middleware.ts is deployed
2. Verify cookies are being set
3. Check Supabase URL configuration

#### TypeScript errors during build

Run:
```bash
npm run build
```
Fix any remaining type issues.

### Getting Help

1. Check [Supabase Docs](https://supabase.com/docs)
2. Check [Next.js Docs](https://nextjs.org/docs)
3. Check GitHub Issues

---

## Part 7: Production Considerations

### Performance

- Enable Supabase Connection Pooling for high traffic
- Add indexes for frequently queried columns
- Use pagination for large datasets

### Monitoring

- Set up Vercel Analytics
- Configure Supabase Log Explorer
- Set up error tracking (Sentry)

### Scaling

- Supabase Pro plan for more resources
- Vercel Pro plan for more bandwidth
- Consider read replicas for high read loads

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Supabase
npx supabase db reset     # Reset local DB
npx supabase gen types    # Generate TypeScript types
```

### File Structure

```
it-ticket-system/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Protected dashboard
│   └── page.tsx            # Landing page
├── lib/
│   ├── supabase/           # Supabase clients
│   └── utils.ts            # Utility functions
├── types/
│   └── database.types.ts    # TypeScript types
├── supabase/
│   └── schema.sql          # Database schema
└── middleware.ts           # Auth middleware
```

---

## Support

For issues and questions:
1. GitHub Issues: [repo]/issues
2. Supabase Community: [supabase.com/community](https://supabase.com/community)
3. Next.js Discord: [discord.gg/nextjs](https://discord.gg/nextjs)

---

**Last Updated**: 2024
**Version**: 1.0.0

