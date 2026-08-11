'use client';

import { useState, useEffect } from 'react';
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
  ListItemIcon as MuiListItemIcon,
} from '@mui/material';
import {
  Home,
  Users,
  Building,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  Palette,
  Menu as MenuIcon,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  UserCog,
  UserRoundPlus,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { api, Company } from '@/lib/api';
import { getSelectedCompanyId, setSelectedCompanyId } from '@/lib/company-context';
import { useTheme } from '@/components/providers/ThemeProvider';
import { LumeLogo } from '@/components/brand/LumeLogo';
const ALL_COMPANIES_OPTION_ID = '__all__';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 65;

const menuItems = [
  { text: 'Dashboard', icon: Home, path: '/dashboard' },
  { text: 'Empresas', icon: Building2, path: '/companies' },
  { text: 'Colaboradores', icon: Users, path: '/employees' },
  { text: 'Departamentos', icon: Building, path: '/departments' },
  { text: 'Cargos', icon: Briefcase, path: '/positions' },
  { text: 'Contratos', icon: FileText, path: '/contracts' },
  { text: 'Usuários', icon: UserCog, path: '/users' },
  { text: 'Onboarding', icon: UserRoundPlus, path: '/onboarding' },
  { text: 'Relatórios', icon: BarChart3, path: '/reports' },
  { text: 'Configurações', icon: Settings, path: '/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setMode, brand, mode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [companyAnchorEl, setCompanyAnchorEl] = useState<null | HTMLElement>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isAllCompaniesSelected, setIsAllCompaniesSelected] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // Carregar usuÃ¡rio autenticado para obter suas empresas
      const user = await api.getCurrentUser();
      setCurrentUser({ firstName: user.firstName, lastName: user.lastName, email: user.email });

      // Sincronizar tema do usuário
      if (user.settings?.theme) {
        setMode(user.settings.theme);
      }

      const companiesArray = user.companies || [];
      setAvailableCompanies(companiesArray);

      // Restaurar empresa selecionada ou usar a primeira
      const selectedId = getSelectedCompanyId();
      if (selectedId === ALL_COMPANIES_OPTION_ID && companiesArray.length > 1) {
        setCurrentCompany(null);
        setIsAllCompaniesSelected(true);
      } else if (selectedId && companiesArray.length > 0) {
        const company = companiesArray.find((c) => (c.id as any).toString() === selectedId);
        if (company) {
          setCurrentCompany(company);
          setIsAllCompaniesSelected(false);
        } else if (companiesArray.length > 0) {
          setCurrentCompany(companiesArray[0]);
          setIsAllCompaniesSelected(false);
          setSelectedCompanyId((companiesArray[0].id as any).toString());
        }
      } else if (companiesArray.length > 0) {
        setCurrentCompany(companiesArray[0]);
        setIsAllCompaniesSelected(false);
        setSelectedCompanyId((companiesArray[0].id as any).toString());
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      // Fallback: tentar carregar do localStorage
      const currentCompanyData = localStorage.getItem('current_company');
      const userCompanies = localStorage.getItem('companies');
      
      if (userCompanies) {
        try {
          setAvailableCompanies(JSON.parse(userCompanies));
        } catch (e) {
          console.error('Erro ao parsear empresas do localStorage:', e);
        }
      }
      
      if (currentCompanyData) {
        try {
          setCurrentCompany(JSON.parse(currentCompanyData));
        } catch (e) {
          console.error('Erro ao parsear empresa atual:', e);
        }
      }
    }
  };

  const drawerWidth = sidebarCollapsed ? drawerWidthCollapsed : drawerWidthExpanded;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCompanyMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCompanyAnchorEl(event.currentTarget);
  };

  const handleCompanyMenuClose = () => {
    setCompanyAnchorEl(null);
  };

  const handleCompanyChange = (company: Company | null) => {
    try {
      // Salva no contexto local (localStorage)
      if (company === null) {
        setCurrentCompany(null);
        setIsAllCompaniesSelected(true);
        setSelectedCompanyId(ALL_COMPANIES_OPTION_ID);
        localStorage.removeItem('current_company');
      } else {
        setCurrentCompany(company);
        setIsAllCompaniesSelected(false);
        const companyIdStr = (company.id as any).toString();
        setSelectedCompanyId(companyIdStr);
        localStorage.setItem('current_company', JSON.stringify(company));
      }
      handleCompanyMenuClose();
      
      // Recarrega a pÃ¡gina para buscar dados da nova empresa
      window.location.reload();
    } catch (error) {
      console.error('Erro ao trocar de empresa:', error);
      alert('Erro ao trocar de empresa. Tente novamente.');
    }
  };

  const handleProfile = () => {
    handleMenuClose();
    router.push('/profile');
  };

  const handleSettings = () => {
    handleMenuClose();
    router.push('/personalization');
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('current_company');
    localStorage.removeItem('companies');
    localStorage.removeItem('selected_company_id');
    router.push('/login');
  };

  const drawer = (collapsed: boolean) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: brand.primary }}>
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
            <LumeLogo variant="full" size="md" darkBg />
            <IconButton
              onClick={handleSidebarToggle}
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
            onClick={handleSidebarToggle}
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

      {/* Menu Items */}
      <List sx={{ px: collapsed ? 0.5 : 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          const listItemButton = (
            <ListItemButton
              component={Link}
              href={item.path}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 1.5,
                bgcolor: isActive ? `${brand.accent}26` : 'transparent',
                color: isActive ? brand.accent : 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  bgcolor: isActive ? `${brand.accent}33` : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? brand.accent : 'white',
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
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.text} disablePadding>
              {collapsed ? (
                <Tooltip title={item.text} placement="right">
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: mode === 'dark' ? '#0F1318' : brand.background }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: mode === 'dark' ? '#181D24' : 'white',
          color: 'text.primary',
          boxShadow: mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
          borderBottom: '1px solid',
          borderColor: mode === 'dark' ? '#2A3240' : '#e2e8f0',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon size={22} />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* ========== SELETOR DE EMPRESA INTEGRADO COM API ========== */}
          {availableCompanies.length > 0 && (
            <Box
              onClick={handleCompanyMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
              border: '1px solid',
              borderColor: mode === 'dark' ? '#2A3240' : 'rgba(10,30,61,0.10)',
              bgcolor: mode === 'dark' ? '#1E252E' : brand.background,
                cursor: 'pointer',
                transition: 'all 0.2s',
                mr: 2,
                '&:hover': {
                  bgcolor: brand.surfaceAlt,
                  borderColor: brand.border,
                },
              }}
            >
              {/* Ãcone da Empresa */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!isAllCompaniesSelected && currentCompany?.logo ? (
                  <img 
                    src={currentCompany.logo} 
                    alt={currentCompany.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : (
                  <Building2 size={18} color="#ffffff" />
                )}
              </Box>

              {/* Nome da Empresa */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', lineHeight: 1.2 }}>
                  Empresa
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', lineHeight: 1.2 }}>
                  {isAllCompaniesSelected ? 'Todas as empresas' : currentCompany?.name || 'Selecionar empresa'}
                </Typography>
              </Box>

              {/* Indicador de dropdown */}
              <ChevronDown size={16} color={mode === 'dark' ? '#8896A6' : '#64748b'} />
            </Box>
          )}

          {/* Menu Dropdown de Empresas */}
          <Menu
            anchorEl={companyAnchorEl}
            open={Boolean(companyAnchorEl)}
            onClose={handleCompanyMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 240,
                borderRadius: 2,
                border: '1px solid',
                borderColor: mode === 'dark' ? '#2A3240' : '#e2e8f0',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                Trocar Empresa
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {availableCompanies.length} {availableCompanies.length === 1 ? 'empresa disponí­vel' : 'empresas disponí­veis'}
              </Typography>
            </Box>
            <Divider />
            {availableCompanies.length > 1 && (
              <MenuItem
                onClick={() => handleCompanyChange(null)}
                selected={isAllCompaniesSelected}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  fontSize: '0.875rem',
                  '&.Mui-selected': {
                    bgcolor: brand.surfaceAlt,
                    '&:hover': {
                      bgcolor: brand.muted,
                    },
                  },
                }}
              >
                <MuiListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: isAllCompaniesSelected ? 'primary.main' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={16} color="#ffffff" />
                  </Box>
                </MuiListItemIcon>
                <Box>
                  <Typography variant="body2" fontWeight={isAllCompaniesSelected ? 600 : 400}>
                    Todas as empresas
                  </Typography>
                </Box>
              </MenuItem>
            )}
            {availableCompanies.map((company) => (
              <MenuItem
                key={company.id}
                onClick={() => handleCompanyChange(company)}
                selected={!isAllCompaniesSelected && currentCompany?.id === company.id}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  fontSize: '0.875rem',
                  '&.Mui-selected': {
                    bgcolor: brand.surfaceAlt,
                    '&:hover': {
                      bgcolor: brand.muted,
                    },
                  },
                }}
              >
                <MuiListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: !isAllCompaniesSelected && currentCompany?.id === company.id ? 'primary.main' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {company.logo ? (
                      <img 
                        src={company.logo} 
                        alt={company.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <Building2 size={16} color="#ffffff" />
                    )}
                  </Box>
                </MuiListItemIcon>
                <Box>
                  <Typography variant="body2" fontWeight={!isAllCompaniesSelected && currentCompany?.id === company.id ? 600 : 400}>
                    {company.name}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* Menu do UsuÃ¡rio */}
          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}>
              <User size={20} />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                border: '1px solid',
                borderColor: mode === 'dark' ? '#2A3240' : '#e2e8f0',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Carregando...'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {currentUser?.email || ''}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfile} sx={{ py: 1, fontSize: '0.875rem' }}>
              <MuiListItemIcon>
                <User size={18} />
              </MuiListItemIcon>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleSettings} sx={{ py: 1, fontSize: '0.875rem' }}>
              <MuiListItemIcon>
                <Palette size={18} />
              </MuiListItemIcon>
              Personalização
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1, fontSize: '0.875rem', color: '#ef4444' }}>
              <MuiListItemIcon>
                <LogOut size={18} color="#ef4444" />
              </MuiListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
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

        {/* Desktop Drawer */}
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

