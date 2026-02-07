# IT Ticket Management System

A production-ready, multi-tenant IT Ticket Management System built with Next.js 14, Supabase, and TypeScript. Features a complete customer support workflow with role-based access control, ticket code authentication, and enterprise-grade security.

## ✨ Features

### 🎫 Multi-User Signup System

The system supports three distinct user types, each with tailored onboarding flows:

| User Type | Description | Onboarding Method |
|-----------|-------------|-------------------|
| **Owner** | Creates and manages a new organization | Organization name signup |
| **Employee** | Joins existing organization as staff | Invitation code entry |
| **Customer** | External users seeking support | Ticket code entry in dashboard |

#### Owner Signup
- Creates a new organization with full ownership
- Receives complete administrative privileges
- Can invite team members and manage organization settings

#### Employee Signup
- Uses invitation codes for secure onboarding
- Role assigned by organization (Admin/Agent)
- Limited to organization permissions

#### Customer Signup
- Quick email/password signup
- Enters ticket code in dashboard to access organization
- View-only mode with comment capabilities

---

### 📝 Ticket Management

- **Create Tickets**: Rich ticket creation with title, description, category, and priority
- **Ticket Codes**: Unique codes auto-generated for each ticket (e.g., TKT-XXXXXX)
- **Ticket Tracking**: Real-time status updates (Open → In Progress → Resolved → Closed)
- **Priority Levels**: Low, Medium, High, Critical with visual indicators
- **Categories & Tags**: Organize tickets for better workflow management
- **Assignment**: Owners can assign tickets to team members
- **Ticket Deletion**: Safe deletion with audit logging

---

### 👥 Role-Based Access Control

Four distinct roles with granular permissions:

| Role | Permissions |
|------|-------------|
| **Owner** | Full organization control, ticket assignment, team invites, settings |
| **Admin** | Manage all tickets, view team, invite members |
| **Agent** | Handle assigned tickets, add comments, update status/priority |
| **Requester** | View own tickets, create new tickets, add comments |

#### Customer (Requester) Permissions
- ✅ View tickets they created OR matched by ticket code
- ✅ Create new support tickets
- ✅ Add comments to tickets
- ❌ Cannot edit ticket status
- ❌ Cannot edit ticket priority
- ❌ Cannot reassign tickets
- ❌ View-only mode with visual indicator

---

### 🏢 Team Management

- **Team Page**: View all organization members (Owner, Admin, Agent)
- **Invitation System**: Generate unique invitation codes
- **Role Assignment**: Assign roles during invitation
- **Invitation Status**: Track pending, accepted, expired invitations
- **Customer Management**: Dedicated page to view all customers with ticket codes

---

### 💬 Comments System

- **Internal Notes**: Agents/Admins can add private notes (visible only to staff)
- **Public Comments**: All users can communicate on tickets
- **Real-Time Updates**: Comments appear instantly via Supabase Realtime
- **User Attribution**: Each comment shows author name and timestamp

---

### 📊 Activity Logging

Complete audit trail of all ticket changes:

- Status changes with before/after values
- Priority modifications
- Assignment history
- Ticket creation and deletion
- Timestamps for all actions

---

### 🔐 Enterprise Security

#### Row Level Security (RLS)
All tables protected with comprehensive RLS policies:

- **Multi-Tenancy**: Complete data isolation between organizations
- **Profile Access**: Users only access their organization's profiles
- **Ticket Visibility**: Requesters see only their tickets; Agents see assigned; Admins see all
- **Comment Privacy**: Internal notes restricted to staff
- **Invitation Control**: Only admins can manage invitations

#### Authentication
- **Supabase Auth**: Secure email/password authentication
- **Session Management**: Server-side and client-side session handling
- **Middleware Protection**: Routes protected by auth middleware
- **Email Verification**: Built-in Supabase email confirmation
- **Customer Login API**: Separate API endpoint for customer authentication

---

### ⚡ Real-Time Updates

- **Supabase Realtime**: Live ticket updates
- **Instant Comments**: New comments appear immediately
- **Live Status Changes**: Real-time status and priority updates
- **Setup Loader**: Automatic profile refresh during onboarding

---

### 🎨 Modern UI/UX

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide Icons**: Professional iconography throughout
- **Status Badges**: Color-coded status and priority indicators
- **Relative Time**: Human-readable timestamps (e.g., "2 hours ago")
- **Empty States**: Helpful messages when no data exists
- **Loading States**: Skeletons and spinners for better UX
- **Error Handling**: User-friendly error messages and recovery

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd it-ticket-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase keys
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant organizations with unique slugs |
| `profiles` | User profiles extending auth.users with roles |
| `tickets` | Support tickets with ticket_code for customer access |
| `comments` | Ticket comments with internal note support |
| `ticket_activity_logs` | Complete audit trail of changes |
| `organization_invitations` | Team invitations with expiry dates |

### Enums

```sql
-- User roles hierarchy: owner > admin > agent > requester
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'agent', 'requester');

-- Ticket priority levels
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Ticket status flow: open -> in_progress -> resolved -> closed
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
```

### Database Functions

- `handle_new_user()` - Creates organization and profile on signup
- `log_ticket_activity()` - Automatic audit logging on ticket changes
- `validate_invitation_code()` - Validates employee invitation codes
- `join_organization_by_invitation()` - Joins organization via invitation
- `validate_ticket_code()` - Validates customer ticket codes
- `join_organization_by_ticket()` - Joins organization via ticket code
- `create_organization_with_owner()` - Creates organization during owner signup

### Database Views

- `tickets_with_details` - Tickets with joined creator/assignee profiles
- `dashboard_stats` - Aggregated ticket statistics by organization

---

## 📁 Project Structure

```
it-ticket-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/               # Login page
│   │   └── signup/              # Multi-type signup page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/           # Main dashboard
│   │   │   ├── customers/       # Customer management page
│   │   │   ├── settings/        # User settings
│   │   │   ├── team/            # Team management
│   │   │   │   ├── invite-modal.tsx  # Invitation modal
│   │   │   │   └── team-client.tsx   # Team client component
│   │   │   ├── tickets/         # Ticket management
│   │   │   │   ├── [id]/        # Ticket detail
│   │   │   │   │   ├── ticket-code-card.tsx  # Copyable ticket code
│   │   │   │   │   ├── ticket-comments.tsx   # Comments section
│   │   │   │   │   └── ticket-detail-actions.tsx  # Status/priority actions
│   │   │   │   ├── new/         # Create ticket
│   │   │   │   └── page.tsx     # Tickets list with filters
│   │   │   ├── ticket-code-entry.tsx    # Customer code entry
│   │   │   ├── invitation-code-entry.tsx # Employee code entry
│   │   │   ├── dashboard-client.tsx      # Dashboard client
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   └── setup-loader.tsx  # Profile setup loader
│   │   └── layout.tsx            # Dashboard layout
│   ├── api/                     # API routes
│   │   └── auth/
│   │       └── customer-login/  # Customer login API
│   ├── auth/                    # Auth utilities
│   │   ├── callback/            # Auth callback handler
│   │   └── auth-code-error/     # Error page
│   ├── globals.css              # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/                  # React components (future)
├── lib/                         # Utilities & configs
│   ├── supabase/
│   │   ├── client.ts           # Client-side Supabase
│   │   ├── server.ts           # Server-side Supabase
│   │   └── types.ts            # TypeScript types
│   └── utils.ts                # Helper functions
├── types/                       # TypeScript definitions
│   └── database.types.ts        # Database types
├── supabase/                    # Supabase configuration
│   ├── schema.sql              # Complete database schema
│   ├── seed.sql                # Seed data
│   └── migration_*.sql         # 27+ migrations for fixes
├── middleware.ts               # Auth middleware
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Validation | Zod |
| Deployment | Vercel |
| Realtime | Supabase Realtime |
| SSR | @supabase/ssr |

---

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Generate database types
npm run db:generate

# Reset database
npm run db:reset
```

---

## 📦 Database Migrations

The project includes 27+ migrations for production stability:

1. `migration_001` - Signup fix
2. `migration_002` - Create demo data
3. `migration_003` - Diagnose and fix
4. `migration_004` - RLS policies fix
5. `migration_005` - RPC signup fix
6. `migration_006` - Ticket code signup
7. `migration_007` - Tickets visibility fix
8. `migration_008` - Add ticket code to profiles
9. `migration_009` - Customer ticket auth
10. `migration_010+` - Additional fixes up to migration_027

Run migrations in order via Supabase SQL Editor.

---

## 🔒 Security Features

### Row Level Security (RLS)
All tables protected with RLS:
- Organizations: Viewable by all, insertable by system
- Profiles: Organization-scoped access
- Tickets: Role-based visibility (requester → agent → admin → owner)
- Comments: Ticket-access controlled
- Activity Logs: Ticket-access controlled
- Invitations: Admin-only management

### Customer Data Protection
- Ticket codes prevent unauthorized access
- Customers can only see their tickets
- Read-only mode for customers
- Separate customer login API

### Middleware Protection
- Protected routes require authentication
- Auth routes redirect to dashboard if logged in
- Graceful handling when Supabase is not configured

---

## 📱 Dashboard Views

### Requester Dashboard
- View and track submitted tickets
- Create new support tickets
- Add comments to existing tickets

### Agent Dashboard
- View assigned tickets
- Update ticket status and priority
- Add internal notes

### Admin Dashboard
- Full organization overview
- Manage team invitations
- Customer management page
- View all tickets with filters

### Owner Dashboard
- All admin features
- Assign tickets to team members
- Organization settings access

---

## 🎨 Design System

### Color Palette
- **Primary**: Slate (neutral, professional)
- **Accent**: Blue (actions, links)
- **Status Colors**: Green (resolved), Orange (pending), Red (critical), Blue (open)

### Components
- Clean, minimal cards with subtle shadows
- Soft gradients and hover effects
- Lucide icons throughout
- Fully responsive (mobile-first)
- Dark mode ready structure

---

## 📧 Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [DEPLOYMENT.md]

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 🏗️ Build & Deploy

### Vercel Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy

### Database Setup

1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run migrations in order (001-027)
4. Configure auth providers
5. Set redirect URLs in Supabase

---

Built with ❤️ using Next.js and Supabase

