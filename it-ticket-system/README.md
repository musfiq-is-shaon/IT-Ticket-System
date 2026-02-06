# IT Ticket Management System

A production-ready, multi-tenant IT Ticket Management System built with Next.js 14, Supabase, and TypeScript.

![IT Ticket System](https://via.placeholder.com/1200x600/f1f5f9/64748b?text=IT+Ticket+Management+System)

## ✨ Features

### Core Functionality
- 📝 **Ticket Management** - Create, view, update, and close IT support tickets
- 👥 **Multi-Tenancy** - Isolated data per organization with secure RLS policies
- 🔐 **Role-Based Access** - Owner, Admin, Agent, and Requester roles
- 💬 **Comments System** - Internal notes and public comments
- 📊 **Activity Logging** - Complete audit trail of all ticket changes
- ⚡ **Real-Time Updates** - Live ticket updates using Supabase Realtime

### Dashboard Views
- **Requester Dashboard** - View and track submitted tickets
- **Agent Dashboard** - Manage assigned tickets
- **Admin Dashboard** - Full organization overview with filters
- **Team Management** - Invite and manage team members

### Security & Compliance
- 🔒 **Row Level Security** - Database-level access control
- ✅ **Server-Side Validation** - All mutations validated on server
- 🔑 **Secure Authentication** - Supabase Auth with email/password
- 🛡️ **Protected Routes** - Middleware-based route protection

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
# Then start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Realtime | Supabase Realtime |

## 📁 Project Structure

```
it-ticket-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/               # Login page
│   │   └── signup/              # Signup page
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── dashboard/           # Main dashboard
│   │   │   ├── tickets/         # Ticket management
│   │   │   │   ├── [id]/        # Ticket detail
│   │   │   │   └── new/          # Create ticket
│   │   │   ├── team/            # Team management
│   │   │   └── settings/        # User settings
│   │   └── layout.tsx            # Dashboard layout
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # React components
├── lib/                         # Utilities & configs
│   ├── supabase/               # Supabase clients
│   └── utils.ts                # Helper functions
├── types/                       # TypeScript definitions
│   └── database.types.ts
├── supabase/                    # Supabase configuration
│   └── schema.sql              # Database schema & RLS
├── middleware.ts               # Auth middleware
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json
```

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant organizations |
| `profiles` | User profiles extending auth.users |
| `tickets` | Support tickets |
| `comments` | Ticket comments/notes |
| `ticket_activity_logs` | Audit trail |
| `organization_invitations` | Team invitations |

### User Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full organization access |
| `admin` | Manage tickets and team |
| `agent` | Handle assigned tickets |
| `requestor` | Submit and view own tickets |

## 🎨 Design System

### Color Palette

- **Primary**: Slate (neutral, professional)
- **Accent**: Blue (actions, links)
- **Status**: Green (resolved), Orange (pending), Red (critical)

### Components

- Clean, minimal cards
- Soft shadows and subtle gradients
- Lucide icons throughout
- Fully responsive design
- Dark mode ready

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users only access their organization's data
- Requesters see only their own tickets
- Agents can manage assigned tickets
- Admins have full visibility

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Build & Deploy

### Vercel Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Database Setup

1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Configure auth providers
4. Set redirect URLs

## 🛠️ Development

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
```

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [DEPLOYMENT.md]

---

Built with ❤️ using Next.js and Supabase

