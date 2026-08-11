'use client';

import { useState, useEffect } from 'react';
import { useCompanyContext } from '@/lib/hooks/useCompanyContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { api, User, Company } from '@/lib/api';
const ALL_COMPANIES_OPTION_ID = '__all__';

// Definição de funções/roles disponíveis
const rolePermissions = {
  SuperAdmin: {
    label: 'Super Admin',
    description: 'Acesso total ao sistema',
  },
  Admin: {
    label: 'Administrador',
    description: 'Acesso total ao sistema',
  },
  Editor: {
    label: 'Gestor',
    description: 'Gerenciar colaboradores e departamentos',
  },
  Visualizador: {
    label: 'Usuário',
    description: 'Acesso limitado - visualização apenas',
  },
};

interface UserCompanyRole {
  companyId: string;
  roles: string[];
}

interface FormDataWithCompanies {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  companies: UserCompanyRole[];
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'email' | 'companies' | 'status' | 'lastLoginAt' | 'updatedAt';

interface NormalizedUserCompany {
  id: string;
  name?: string;
  roles: string[];
}

export default function UsersPage() {
  const { selectedCompanyId, isLoading: isLoadingCompany } = useCompanyContext();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataWithCompanies>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true,
    companies: [],
  });

  // Buscar usuários e empresas ao montar o componente e quando empresa selecionada mudar
  useEffect(() => {
    if (!isLoadingCompany) {
      fetchData();
    }
  }, [selectedCompanyId, isLoadingCompany]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const [usersResult, companiesResult, currentUserResult] = await Promise.allSettled([
        api.getUsers(),
        api.getCompanies(),
        api.getCurrentUser(),
      ]);

      const usersResponse = usersResult.status === 'fulfilled' ? usersResult.value : [];
      const companiesResponse = companiesResult.status === 'fulfilled' ? companiesResult.value : [];
      const currentUserResponse = currentUserResult.status === 'fulfilled' ? currentUserResult.value : null;

      const users = usersResponse;
      let companiesList = companiesResponse;
      const meCompanies = currentUserResponse?.companies || [];

      const hasSuperAdminRole = meCompanies.some((company: any) =>
        (company.roles || []).some((role: any) =>
          ['SUPER_ADMIN', 'Super Admin', 'SUPERADMIN', 'SuperAdmin'].includes(role?.name),
        ),
      );

      if (hasSuperAdminRole) {
        companiesList = await api.getAllCompaniesForAdmin();
      }

      const companiesFromUsers: Company[] = users.flatMap((user: any) => {
        const raw = user?.companies || user?.userCompanies || user?.user_companies || [];
        if (!Array.isArray(raw)) return [];
        return raw
          .map((entry: any) => {
            const company = entry?.company || entry;
            const id = entry?.companyId || company?.id;
            if (!id) return null;
            return {
              id,
              name: company?.name || entry?.name || 'Empresa',
            } as Company;
          })
          .filter((company): company is Company => Boolean(company));
      });

      const mergedCompaniesMap = new Map<string, Company>();
      [...companiesList, ...meCompanies, ...companiesFromUsers].forEach((company) => {
        if (!company) return;
        const id = typeof company.id === 'string' ? company.id : company.id.toString();
        if (!mergedCompaniesMap.has(id)) {
          mergedCompaniesMap.set(id, company);
        }
      });

      setUsersList(users);
      setCompanies(Array.from(mergedCompaniesMap.values()));
    } catch (err) {
      setPageError('Erro ao carregar dados. Verifique sua conexão com a API.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      const normalizedCompanies = getUserCompanies(user);
      setSelectedUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        confirmPassword: '',
        isActive: user.isActive || false,
        companies: normalizedCompanies.map((company) => ({
          companyId: company.id,
          roles: company.roles,
        })),
      });
    } else {
      setSelectedUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        isActive: true,
        companies: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormError(null);
  };


  const handleAddCompany = () => {
    setFormData({
      ...formData,
      companies: [...formData.companies, { companyId: '', roles: [] }],
    });
  };

  const handleRemoveCompany = (index: number) => {
    setFormData({
      ...formData,
      companies: formData.companies.filter((_, i) => i !== index),
    });
  };

  const handleCompanyChange = (index: number, companyId: string) => {
    const updatedCompanies = [...formData.companies];
    updatedCompanies[index].companyId = companyId;
    updatedCompanies[index].roles = []; // Reset roles when company changes
    setFormData({
      ...formData,
      companies: updatedCompanies,
    });
  };

  const handleRoleToggle = (companyIndex: number, role: string) => {
    const updatedCompanies = [...formData.companies];
    const currentRoles = updatedCompanies[companyIndex].roles;
    if (currentRoles.includes(role)) {
      updatedCompanies[companyIndex].roles = currentRoles.filter((r) => r !== role);
    } else {
      updatedCompanies[companyIndex].roles = [...currentRoles, role];
    }
    setFormData({
      ...formData,
      companies: updatedCompanies,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setFormError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!selectedUser && !formData.password) {
      setFormError('Senha é obrigatória para novo usuário');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('As senhas não correspondem');
      return;
    }

    if (formData.companies.length === 0) {
      setFormError('Selecione pelo menos uma empresa para o usuário');
      return;
    }
    if (formData.companies.some((c) => !c.companyId)) {
      setFormError('Selecione uma empresa válida para cada vínculo');
      return;
    }
    if (formData.companies.some((c) => c.roles.length === 0)) {
      setFormError('Defina pelo menos uma permissão em cada empresa vinculada');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const isPasswordUpdate = Boolean(selectedUser && formData.password);

      if (selectedUser) {
        // Atualizar usuário existente
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          isActive: formData.isActive,
          companies: formData.companies.map((c) => ({
            companyId: c.companyId,
            roles: c.roles,
          })),
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.updateUser(selectedUser.id, updateData);
      } else {
        // Criar novo usuário
        await api.createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          companies: formData.companies.map((c) => ({
            companyId: c.companyId,
            roles: c.roles,
          })),
        } as any);
      }

      // Recarregar lista de usuários
      await fetchData();
      handleCloseDialog();
      if (isPasswordUpdate) {
        setSuccessMessage('Senha alterada com sucesso');
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário');
      console.error('Error saving user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setSubmitting(true);
      await api.deleteUser(userToDelete.id);
      await fetchData();
      handleCloseDeleteDialog();
    } catch (err: any) {
      setPageError(err.message || 'Erro ao deletar usuário');
      handleCloseDeleteDialog();
      console.error('Error deleting user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCompanyName = (companyId: number | string) => {
    const company = companies.find((c) => {
      const cIdStr = typeof c.id === 'string' ? c.id : c.id.toString();
      const companyIdStr = typeof companyId === 'string' ? companyId : companyId.toString();
      return cIdStr === companyIdStr;
    });
    return company?.name || 'Empresa não encontrada';
  };

  const mapRoleValues = (value: any): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((role) => {
        if (typeof role === 'string') return role;
        if (role?.name) return role.name as string;
        if (role?.id) return role.id as string;
        return null;
      })
      .filter((role): role is string => Boolean(role));
  };

  const extractRolesFromCompanyEntry = (entry: any): string[] => {
    const directRoles = mapRoleValues(entry?.roles);
    const nestedUserRoles = Array.isArray(entry?.userRoles)
      ? entry.userRoles
          .map((ur: any) => ur?.role?.name || ur?.role?.id || null)
          .filter((role: any): role is string => Boolean(role))
      : [];
    return Array.from(new Set([...directRoles, ...nestedUserRoles]));
  };

  const getUserCompanies = (user: User): NormalizedUserCompany[] => {
    const rawCompanies = (
      (user as any).companies ||
      (user as any).userCompanies ||
      (user as any).user_companies ||
      []
    ) as any[];
    if (!Array.isArray(rawCompanies)) return [];

    const normalized = rawCompanies
      .map((entry) => {
        if (!entry) return null;
        if (entry.company || entry.companyId) {
          const companyRef = entry.company || {};
          const companyId = entry.companyId || companyRef.id;
          if (!companyId) return null;
          return {
            id: companyId.toString(),
            name: companyRef.name || entry.name,
            roles: extractRolesFromCompanyEntry(entry),
          };
        }

        const companyId = entry.id;
        if (!companyId) return null;
        return {
          id: companyId.toString(),
          name: entry.name,
          roles: extractRolesFromCompanyEntry(entry),
        };
      })
      .filter((company) => Boolean(company)) as NormalizedUserCompany[];

    const uniqueById = new Map<string, NormalizedUserCompany>();
    normalized.forEach((company) => {
      const current = uniqueById.get(company.id);
      if (!current) {
        uniqueById.set(company.id, company);
        return;
      }
      uniqueById.set(company.id, {
        ...current,
        name: current.name || company.name,
        roles: Array.from(new Set([...current.roles, ...company.roles])),
      });
    });
    return Array.from(uniqueById.values());
  };

  const getUserInitials = (firstName = '', lastName = '') =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const formatLastLogin = (value?: string) => {
    const formatted = formatDateTime(value);
    return formatted === '-' ? 'Nunca' : formatted;
  };

  const getAvailableRolesByCompany = (companyId: string) => {
    const selectedCompany = companies.find((c) => {
      const cId = typeof c.id === 'string' ? c.id : c.id.toString();
      return cId === companyId.toString();
    });

    if (selectedCompany?.roles && selectedCompany.roles.length > 0) {
      return selectedCompany.roles.map((role) => {
        const permissionsSummary =
          role.permissions && role.permissions.length > 0
            ? role.permissions.map((p) => `${p.resource}:${p.action}`).join(', ')
            : 'Sem permissões detalhadas';

        return {
          key: role.name || role.id,
          label: role.name,
          description: permissionsSummary,
        };
      });
    }

    return Object.entries(rolePermissions).map(([key, role]) => ({
      key,
      label: role.label,
      description: role.description,
    }));
  };

  const isAllCompaniesSelected = selectedCompanyId === ALL_COMPANIES_OPTION_ID;
  const filteredByCompany = selectedCompanyId
    ? (isAllCompaniesSelected
        ? usersList
        : usersList.filter((user) =>
            getUserCompanies(user).some((company) => company.id === selectedCompanyId),
          ))
    : [];

  const filteredUsers = filteredByCompany.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const companiesText = getUserCompanies(user)
      .map((company) => company.name || getCompanyName(company.id))
      .join(' ')
      .toLowerCase();
    return fullName.includes(term) || email.includes(term) || companiesText.includes(term);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aName = `${a.firstName} ${a.lastName}`.trim();
    const bName = `${b.firstName} ${b.lastName}`.trim();
    const aCompanies = getUserCompanies(a)
      .map((c) => c.name || getCompanyName(c.id))
      .join(', ');
    const bCompanies = getUserCompanies(b)
      .map((c) => c.name || getCompanyName(c.id))
      .join(', ');

    const aTime = (value?: string) => (value ? new Date(value).getTime() : 0);
    let result = 0;

    switch (sortField) {
      case 'email':
        result = (a.email || '').localeCompare(b.email || '', 'pt-BR', { sensitivity: 'base' });
        break;
      case 'companies':
        result = aCompanies.localeCompare(bCompanies, 'pt-BR', { sensitivity: 'base' });
        break;
      case 'status':
        result = (a.isActive ? 'Ativo' : 'Inativo').localeCompare(
          b.isActive ? 'Ativo' : 'Inativo',
          'pt-BR',
          { sensitivity: 'base' },
        );
        break;
      case 'lastLoginAt':
        result = aTime(a.lastLoginAt) - aTime(b.lastLoginAt);
        break;
      case 'updatedAt':
        result = aTime(a.updatedAt) - aTime(b.updatedAt);
        break;
      case 'name':
      default:
        result = aName.localeCompare(bName, 'pt-BR', { sensitivity: 'base' });
        break;
    }

    return sortDirection === 'asc' ? result : -result;
  });

  const handleSortBy = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };


  if (loading || isLoadingCompany) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Usuários do sistema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedCompanyId
              ? `${sortedUsers.length} usuários ${
                  isAllCompaniesSelected ? 'com acesso às empresas disponíveis' : 'com acesso à empresa selecionada'
                }`
              : 'Selecione uma empresa para visualizar os usuários'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog()}
            disabled={!selectedCompanyId}
            sx={{
              bgcolor: 'primary.main',
              textTransform: 'none',
              px: 2.5,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            Novo Usuário
          </Button>
        </Box>
      </Box>

      {pageError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPageError(null)}>
          {pageError}
        </Alert>
      )}

      {selectedCompanyId && (
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Filtrar usuários por nome, e-mail ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      )}

      {!selectedCompanyId && (
        <Paper
          sx={{
            p: 6,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
            boxShadow: 'none',
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Nenhuma empresa selecionada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione uma empresa no topo da aplicação para listar os usuários com acesso.
          </Typography>
        </Paper>
      )}

      {selectedCompanyId && (
        <Paper
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('name')}
                    >
                      USUÁRIO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'email'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('email')}
                    >
                      CONTATO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'companies'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('companies')}
                    >
                      EMPRESAS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'status'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('status')}
                    >
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'lastLoginAt'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('lastLoginAt')}
                    >
                      ÚLTIMO LOGIN
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'updatedAt'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('updatedAt')}
                    >
                      MODIFICADO EM
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    AÇÕES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                          }}
                        >
                          {getUserInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                        {user.firstName} {user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 340 }}>
                        {getUserCompanies(user).slice(0, 2).map((company, idx) => (
                          <Chip
                            key={idx}
                            label={company.name || getCompanyName(company.id)}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: '#F0F2F5',
                              color: 'primary.main',
                            }}
                          />
                        ))}
                        {getUserCompanies(user).length > 2 && (
                          <Chip
                            label={`+${getUserCompanies(user).length - 2}`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: '#f3f4f6',
                              color: '#6b7280',
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={user.isActive ? 'Ativo' : 'Inativo'}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: user.isActive ? '#dcfce7' : '#fee2e2',
                          color: user.isActive ? '#166534' : '#991b1b',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {formatLastLogin(user.lastLoginAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {formatDateTime(user.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }} align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Editar usuário">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(user)}
                            disabled={submitting}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                color: 'primary.main',
                                bgcolor: 'transparent',
                              },
                            }}
                          >
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deletar usuário">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(user)}
                            disabled={submitting}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                color: '#dc2626',
                                bgcolor: 'transparent',
                              },
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {selectedCompanyId && sortedUsers.length === 0 && (
        <Paper
          sx={{
            p: 6,
            mt: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
            boxShadow: 'none',
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Nenhum usuário com acesso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Não há usuários vinculados à empresa selecionada.
          </Typography>
        </Paper>
      )}

      {/* Dialog - Novo/Editar Usuário */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <form noValidate onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {formError && <Alert severity="error">{formError}</Alert>}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Primeiro Nome"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={submitting}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Sobrenome"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={submitting}
                    size="small"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="email"
                label="E-mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={submitting}
                size="small"
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label={selectedUser ? 'Nova Senha' : 'Senha'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!selectedUser}
                    disabled={submitting}
                    size="small"
                    helperText={selectedUser ? 'Preencha apenas se quiser alterar a senha' : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirmar Senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required={!selectedUser}
                    disabled={submitting}
                    size="small"
                  />
                </Grid>
              </Grid>
              {selectedUser && (
                <>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                        Status do usuário
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {formData.isActive ? 'Usuário pode acessar o sistema' : 'Usuário sem acesso ao sistema'}
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      disabled={submitting}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                </>
              )}



              {/* Empresas e Permissões */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                    Empresas e Permissões
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={handleAddCompany}
                    disabled={submitting || companies.length === 0}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      borderColor: 'divider',
                    }}
                  >
                    Adicionar Empresa
                  </Button>
                </Box>

                {formData.companies.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Nenhuma empresa selecionada. Clique em "Adicionar Empresa" para começar.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formData.companies.map((company, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Empresa</InputLabel>
                            <Select
                              value={company.companyId}
                              label="Empresa"
                              onChange={(e) => handleCompanyChange(index, e.target.value as string)}
                              disabled={submitting}
                            >
                              <MenuItem value="">Selecione uma empresa</MenuItem>
                              {companies.map((c) => (
                                <MenuItem
                                  key={c.id}
                                  value={typeof c.id === 'string' ? c.id : c.id.toString()}
                                  disabled={formData.companies.some(
                                    (entry, entryIndex) =>
                                      entryIndex !== index &&
                                      entry.companyId === (typeof c.id === 'string' ? c.id : c.id.toString()),
                                  )}
                                >
                                  {c.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveCompany(index)}
                            disabled={submitting}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { bgcolor: '#fee2e2', color: '#dc2626' },
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>

                        {company.companyId && (
                          <Box>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1, display: 'block' }}>
                              PERMISSÕES DISPONÍVEIS NA EMPRESA
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {getAvailableRolesByCompany(company.companyId).map((role) => (
                                <FormControlLabel
                                  key={role.key}
                                  control={
                                    <Checkbox
                                      checked={company.roles.includes(role.key)}
                                      onChange={() => handleRoleToggle(index, role.key)}
                                      disabled={submitting}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                                        {role.label}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        {role.description}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={handleCloseDialog}
              disabled={submitting}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: 'primary.main',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
                '&:disabled': { bgcolor: '#9ca3af', color: 'white' },
              }}
            >
              {submitting ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog - Confirmação de Exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700, pb: 1 }}>
          Excluir usuário?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tem certeza que deseja excluir o usuário{' '}
              <Typography
                component="span"
                fontWeight={700}
                color="text.primary"
                sx={{ fontSize: 'inherit' }}
              >
                {userToDelete?.firstName} {userToDelete?.lastName}
              </Typography>
              ? Esta ação não pode ser desfeita.
            </Typography>
            <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
              O acesso do usuário ao sistema será removido imediatamente.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={submitting}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: '#dc2626',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#b91c1c', boxShadow: 'none' },
              '&:disabled': { bgcolor: '#9ca3af', color: 'white' },
            }}
          >
            {submitting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3500}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}






