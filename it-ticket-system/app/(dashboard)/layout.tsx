import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  MessageCircle,
  Building2,
  BarChart3,
  Shield
} from 'lucide-react';

interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

async function getUserData(userId: string) {
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return null;
  }

  // Get organization
  let orgName = null;
  let orgId = null;
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', profile.organization_id)
      .single();
    orgName = org?.name ?? null;
    orgId = org?.id ?? null;
  }

  return {
    profile: profile as Profile,
    orgName,
    orgId,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userData = await getUserData(user.id);

  // If no profile exists yet, show simplified layout
  if (!userData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Simple header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">IT Ticket System</span>
          </div>
        </header>

        {/* Main content */}
        <main className="pl-0">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  const { profile, orgName, orgId } = userData;

  const userRole = profile.role;
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';
  const isAgent = userRole === 'agent';
  const isRequester = userRole === 'requester';
  const canManageTeam = isOwner || isAdmin;

  // Role badge configuration
  const roleBadge = {
    owner: { color: 'bg-purple-100 text-purple-700', icon: Shield, label: 'Owner' },
    admin: { color: 'bg-indigo-100 text-indigo-700', icon: Shield, label: 'Admin' },
    agent: { color: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Agent' },
    requester: { color: 'bg-slate-100 text-slate-700', icon: Shield, label: 'Customer' },
  };
  const currentRoleBadge = roleBadge[userRole];

  // Navigation items with role-based access
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'All Tickets',
      href: '/dashboard/tickets',
      icon: MessageSquare,
      onlyForOwnerAndAdmin: true,
    },
    {
      label: 'Tickets',
      href: '/dashboard/tickets',
      icon: MessageSquare,
      onlyForAgent: true,
    },
    {
      label: 'My Tickets',
      href: '/dashboard/tickets',
      icon: MessageSquare,
      onlyForRequester: true,
    },
    {
      label: 'Team',
      href: '/dashboard/team',
      icon: Users,
      requireAdmin: true,
    },
    {
      label: 'Customers',
      href: '/dashboard/customers',
      icon: Building2,
      onlyForOwnerAndAdmin: true,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.requireAdmin && !canManageTeam) {
      return false;
    }
    if (item.onlyForOwnerAndAdmin && !canManageTeam) {
      return false;
    }
    if (item.onlyForAgent && !isAgent) {
      return false;
    }
    if (item.onlyForRequester && !isRequester) {
      return false;
    }
    return true;
  });

  async function handleLogout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">IT Ticket System</span>
            </Link>
          </div>

          {/* Organization */}
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600 truncate">
                {orgName ?? 'No Organization'}
              </span>
            </div>
          </div>

          {/* Role indicator */}
          <div className="px-4 py-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentRoleBadge.color}`}>
              <currentRoleBadge.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{currentRoleBadge.label}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {profile.full_name?.charAt(0) ?? 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
            </div>
            <form action={handleLogout} className="mt-2">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

