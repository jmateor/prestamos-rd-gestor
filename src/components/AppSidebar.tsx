import {
  LayoutDashboard,
  Users,
  FileText,
  Landmark,
  Receipt,
  ShieldCheck,
  BarChart3,
  DollarSign,
  LogOut,
  Settings,
  Wallet,
  History,
  Navigation,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Solicitudes', url: '/solicitudes', icon: FileText },
  { title: 'Préstamos', url: '/prestamos', icon: Landmark },
  { title: 'Cobranza', url: '/cobranza', icon: Receipt },
  { title: 'Cobranza Campo', url: '/cobranza-campo', icon: Navigation },
  { title: 'Garantías', url: '/garantias', icon: ShieldCheck },
  { title: 'Reportes', url: '/reportes', icon: BarChart3 },
  { title: 'Cierre Caja', url: '/cierre-caja', icon: Wallet },
  { title: 'Bitácora', url: '/bitacora', icon: History },
  { title: 'Ajustes', url: '/ajustes', icon: Settings },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">JBM RD</span>
            <span className="text-xs text-sidebar-foreground/60">Préstamos</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <div className="truncate text-xs text-sidebar-foreground/60">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
