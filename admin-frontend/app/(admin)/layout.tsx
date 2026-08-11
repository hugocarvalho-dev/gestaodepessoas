'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  CreditCard,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 65;

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tenants', label: 'Clientes', icon: Building2 },
  { href: '/plans', label: 'Planos', icon: CreditCard },
  { href: '/payments', label: 'Financeiro', icon: Wallet },
];

// Lume logo SVG inline (same as frontend LumeLogo component)
function LumeLogoAdmin({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <svg width={32} height={32} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" rx="18" fill="#0A1E3D" />
        <rect x="20" y="20" width="28" height="28" rx="4" fill="#1A3A5C" />
        <rect x="32" y="32" width="28" height="28" rx="4" fill="url(#lume-admin-grad)" />
        <rect x="32" y="32" width="16" height="16" rx="3" fill="#FFFFFF" opacity="0.2" />
        <rect x="22" y="22" width="8" height="8" rx="2" fill="#D4A84B" opacity="0.6" />
        <defs>
          <linearGradient id="lume-admin-grad" x1="32" y1="32" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8C468" />
            <stop offset="1" stopColor="#D4A84B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg width={40} height={40} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" rx="18" fill="#0A1E3D" />
        <rect x="20" y="20" width="28" height="28" rx="4" fill="#1A3A5C" />
        <rect x="32" y="32" width="28" height="28" rx="4" fill="url(#lume-admin-full-grad)" />
        <rect x="32" y="32" width="16" height="16" rx="3" fill="#FFFFFF" opacity="0.2" />
        <rect x="22" y="22" width="8" height="8" rx="2" fill="#D4A84B" opacity="0.6" />
        <defs>
          <linearGradient id="lume-admin-full-grad" x1="32" y1="32" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8C468" />
            <stop offset="1" stopColor="#D4A84B" />
          </linearGradient>
        </defs>
      </svg>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography
          sx={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
          }}
        >
          Lume
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 8.64,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
          }}
        >
          Painel Admin
        </Typography>
      </Box>
    </Box>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    adminApi.getProfile().then(setUser).catch(() => {
      localStorage.removeItem('admin_token');
      router.replace('/login');
    });
  }, [router]);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawerWidth = sidebarCollapsed ? drawerWidthCollapsed : drawerWidthExpanded;

  const handleLogout = () => {
    setAnchorEl(null);
    adminApi.logout();
  };

  const drawer = (collapsed: boolean) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0A1E3D' }}>
      {/* Header */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          minHeight: 68,
        }}
      >
        {!collapsed && (
          <>
            <LumeLogoAdmin collapsed={false} />
            <IconButton
              onClick={() => setSidebarCollapsed(true)}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                display: { xs: 'none', md: 'flex' },
              }}
            >
              <ChevronLeft size={20} />
            </IconButton>
          </>
        )}
        {collapsed && (
          <IconButton
            onClick={() => setSidebarCollapsed(false)}
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <ChevronRight size={20} />
          </IconButton>
        )}
      </Box>

      {/* Nav Items */}
      <List sx={{ px: collapsed ? 0.5 : 1.5, py: 2, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          const listItemButton = (
            <ListItemButton
              component={Link}
              href={item.href}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 1.5,
                bgcolor: isActive ? 'rgba(212, 168, 75, 0.15)' : 'transparent',
                color: isActive ? '#D4A84B' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(212, 168, 75, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#D4A84B' : 'white',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: collapsed ? 'auto' : 40,
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.href} disablePadding>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  {listItemButton}
                </Tooltip>
              ) : (
                listItemButton
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F8FA' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon size={22} />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Menu do Usuário */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: '#0A1E3D', width: 38, height: 38 }}>
              <User size={20} />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {user.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1, fontSize: '0.875rem' }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LogOut size={18} />
              </ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidthExpanded,
              border: 'none',
            },
          }}
        >
          {drawer(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              transition: 'width 0.2s ease-in-out',
            },
          }}
          open
        >
          {drawer(sidebarCollapsed)}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2.5, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          transition: 'width 0.2s ease-in-out',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
