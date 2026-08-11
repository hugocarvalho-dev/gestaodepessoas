'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Download,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertTriangle,
  FileUp,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';

type Step = 'choose' | 'import-info' | 'import-upload' | 'import-preview' | 'import-result' | 'export-loading' | 'export-done';

interface ImportValidation {
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: Array<{
    rowNumber: number;
    data: Record<string, string>;
    errors: string[];
  }>;
}

interface ImportResult {
  imported: number;
  errors: Array<{ row: number; error: string }>;
}

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function ImportExportModal({ open, onClose, onImportSuccess }: ImportExportModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('choose');
    setLoading(false);
    setError(null);
    setSelectedFile(null);
    setValidation(null);
    setImportResult(null);
  }, []);

  const handleClose = () => {
    const hadImport = step === 'import-result' && importResult && importResult.imported > 0;
    reset();
    onClose();
    // Re-trigger refresh when closing after successful import
    if (hadImport) {
      onImportSuccess?.();
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const blob = await api.downloadEmployeeTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_importacao_colaboradores.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar template');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setStep('export-loading');
      setError(null);
      const blob = await api.exportEmployees();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `colaboradores_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setStep('export-done');
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar');
      setStep('choose');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Formato inválido. Envie um arquivo .xlsx');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.validateEmployeeImport(selectedFile);
      setValidation(result);
      setStep('import-preview');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.importEmployees(selectedFile);
      setImportResult(result);
      setStep('import-result');
      if (result.imported > 0) {
        onImportSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'choose': return 'Importar / Exportar Colaboradores';
      case 'import-info': return 'Importar Colaboradores';
      case 'import-upload': return 'Enviar Planilha';
      case 'import-preview': return 'Pré-visualização da Importação';
      case 'import-result': return 'Resultado da Importação';
      case 'export-loading': return 'Exportando...';
      case 'export-done': return 'Exportação Concluída';
      default: return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={step === 'import-preview' ? 'md' : 'sm'}
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {step !== 'choose' && (
            <IconButton
              size="small"
              onClick={() => {
                if (step === 'import-info') setStep('choose');
                else if (step === 'import-upload') setStep('import-info');
                else if (step === 'import-preview') { setStep('import-upload'); setValidation(null); }
                else reset();
              }}
              sx={{ mr: 0.5 }}
            >
              <ArrowLeft size={18} />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} fontSize="1.05rem">
            {getTitle()}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* STEP: Choose import or export */}
        {step === 'choose' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper
              onClick={() => setStep('import-info')}
              sx={{
                p: 3,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f7ff' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#dbeafe' }}>
                  <Upload size={24} color="#2563eb" />
                </Box>
                <Box>
                  <Typography fontWeight={700} fontSize="0.95rem">
                    Importar Colaboradores
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.82rem">
                    Importe colaboradores em massa usando uma planilha XLSX
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              onClick={handleExport}
              sx={{
                p: 3,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#dcfce7' }}>
                  <Download size={24} color="#16a34a" />
                </Box>
                <Box>
                  <Typography fontWeight={700} fontSize="0.95rem">
                    Exportar Colaboradores
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize="0.82rem">
                    Exporte todos os colaboradores para uma planilha XLSX
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* STEP: Import info - download template */}
        {step === 'import-info' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Alert severity="info" icon={<FileSpreadsheet size={20} />}>
              A planilha deve seguir o modelo de importação. Baixe o template abaixo para preencher os dados corretamente.
            </Alert>

            <Box>
              <Typography fontWeight={600} fontSize="0.9rem" sx={{ mb: 1 }}>
                Colunas obrigatórias (marcadas com *)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {[
                  { label: 'Nome Completo*', required: true },
                  { label: 'Nome Social', required: false },
                  { label: 'CPF*', required: true },
                  { label: 'RG', required: false },
                  { label: 'PIS/PASEP', required: false },
                  { label: 'Data Nascimento', required: false },
                  { label: 'Gênero', required: false },
                  { label: 'Nacionalidade', required: false },
                  { label: 'Estado Civil', required: false },
                  { label: 'E-mail*', required: true },
                  { label: 'Telefone', required: false },
                  { label: 'Endereço / CEP', required: false },
                  { label: 'Matrícula', required: false },
                  { label: 'Departamento', required: false },
                  { label: 'Cargo', required: false },
                  { label: 'Tipo Vínculo', required: false },
                  { label: 'Tipo Contrato', required: false },
                  { label: 'Centro de Custo', required: false },
                  { label: 'Gestor (CPF)', required: false },
                  { label: 'Data Admissão*', required: true },
                  { label: 'Salário', required: false },
                  { label: 'Observação', required: false },
                ].map((col) => (
                  <Chip
                    key={col.label}
                    label={col.label}
                    size="small"
                    sx={{
                      fontWeight: col.required ? 700 : 500,
                      fontSize: '0.75rem',
                      bgcolor: col.required ? '#dbeafe' : '#f1f5f9',
                      color: col.required ? '#1d4ed8' : '#475569',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography fontWeight={600} fontSize="0.9rem" sx={{ mb: 0.5 }}>
                Observações:
              </Typography>
              <Typography variant="body2" color="text.secondary" fontSize="0.82rem" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Datas podem estar no formato DD/MM/AAAA ou como data nativa do Excel</li>
                  <li>Gênero aceita: MALE, FEMALE ou OTHER</li>
                  <li>Departamento, Cargo e Centro de Custo devem corresponder aos já cadastrados</li>
                  <li>Salário deve ser um valor numérico (ex: 5000.00)</li>
                  <li>Gestor: informe o CPF do colaborador que será o gestor</li>
                  <li>Baixe o template para ver todas as colunas disponíveis</li>
                </ul>
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <Download size={16} />}
              onClick={handleDownloadTemplate}
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e2e8f0',
                color: '#475569',
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
              }}
            >
              Baixar Planilha Modelo (.xlsx)
            </Button>
          </Box>
        )}

        {/* STEP: Upload file */}
        {step === 'import-upload' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <Paper
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: selectedFile ? 'primary.main' : 'divider',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: selectedFile ? '#f0f7ff' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: '#f8fafc' },
              }}
            >
              {selectedFile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <FileSpreadsheet size={36} color="#2563eb" />
                  <Typography fontWeight={600} fontSize="0.9rem">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Clique para trocar o arquivo
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <FileUp size={36} color="#94a3b8" />
                  <Typography fontWeight={600} fontSize="0.9rem" color="text.secondary">
                    Clique para selecionar um arquivo .xlsx
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tamanho máximo: 5MB
                  </Typography>
                </Box>
              )}
            </Paper>

            {selectedFile && (
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={16} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                {loading ? 'Processando...' : 'Processar Planilha'}
              </Button>
            )}
          </Box>
        )}

        {/* STEP: Preview validation results */}
        {step === 'import-preview' && validation && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Summary */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  {validation.totalRows}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Total de linhas
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid', borderColor: '#dcfce7', bgcolor: '#f0fdf4', textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700} color="#16a34a">
                  {validation.validRows}
                </Typography>
                <Typography variant="caption" color="#16a34a" fontWeight={600}>
                  Válidos
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, borderRadius: 2, border: '1px solid', borderColor: validation.errorRows > 0 ? '#fecaca' : '#dcfce7', bgcolor: validation.errorRows > 0 ? '#fef2f2' : '#f0fdf4', textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700} color={validation.errorRows > 0 ? '#dc2626' : '#16a34a'}>
                  {validation.errorRows}
                </Typography>
                <Typography variant="caption" color={validation.errorRows > 0 ? '#dc2626' : '#16a34a'} fontWeight={600}>
                  Com erros
                </Typography>
              </Paper>
            </Box>

            {validation.errorRows > 0 && (
              <Alert severity="warning" icon={<AlertTriangle size={20} />}>
                Corrija os erros na planilha e envie novamente. Apenas linhas sem erros podem ser importadas.
              </Alert>
            )}

            {/* Error details table */}
            {validation.rows.some((r) => r.errors.length > 0) && (
              <Box>
                <Typography fontWeight={600} fontSize="0.9rem" sx={{ mb: 1 }}>
                  Detalhes dos Erros
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300, border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: 'none' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>Linha</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>Erros</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validation.rows
                        .filter((r) => r.errors.length > 0)
                        .map((row) => (
                          <TableRow key={row.rowNumber}>
                            <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                              {row.rowNumber}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>
                              {row.data.legal_name || '-'}
                            </TableCell>
                            <TableCell>
                              {row.errors.map((err, idx) => (
                                <Typography key={idx} variant="body2" color="error" fontSize="0.78rem">
                                  • {err}
                                </Typography>
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Valid rows preview */}
            {validation.validRows > 0 && (
              <Box>
                <Typography fontWeight={600} fontSize="0.9rem" sx={{ mb: 1 }}>
                  Colaboradores a Importar ({validation.validRows})
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 250, border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: 'none' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>CPF</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>E-mail</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>Departamento</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem', bgcolor: '#f8fafc' }}>Cargo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validation.rows
                        .filter((r) => r.errors.length === 0)
                        .map((row) => (
                          <TableRow key={row.rowNumber}>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{row.data.legal_name}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{row.data.government_id}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{row.data.email}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{row.data.department || '-'}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{row.data.position || '-'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* STEP: Import result */}
        {step === 'import-result' && importResult && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CheckCircle size={48} color="#16a34a" />
            <Typography variant="h6" fontWeight={700}>
              Importação Concluída
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} color="#16a34a">
                  {importResult.imported}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Importados
                </Typography>
              </Box>
              {importResult.errors.length > 0 && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="#dc2626">
                    {importResult.errors.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Erros
                  </Typography>
                </Box>
              )}
            </Box>

            {importResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ width: '100%' }}>
                <Typography fontWeight={600} fontSize="0.85rem" sx={{ mb: 0.5 }}>
                  Erros durante a importação:
                </Typography>
                {importResult.errors.map((err, idx) => (
                  <Typography key={idx} variant="body2" fontSize="0.8rem">
                    Linha {err.row}: {err.error}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        )}

        {/* STEP: Export loading */}
        {step === 'export-loading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
            <CircularProgress />
            <Typography color="text.secondary" fontWeight={600}>
              Gerando planilha de exportação...
            </Typography>
          </Box>
        )}

        {/* STEP: Export done */}
        {step === 'export-done' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
            <CheckCircle size={48} color="#16a34a" />
            <Typography variant="h6" fontWeight={700}>
              Exportação Concluída
            </Typography>
            <Typography variant="body2" color="text.secondary">
              O arquivo foi baixado automaticamente.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 'choose' && (
          <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Fechar
          </Button>
        )}

        {step === 'import-info' && (
          <>
            <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={() => setStep('import-upload')}
              sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
            >
              Continuar
            </Button>
          </>
        )}

        {step === 'import-upload' && (
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
        )}

        {step === 'import-preview' && validation && (
          <>
            <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            {validation.errorRows > 0 ? (
              <Button
                variant="outlined"
                onClick={() => { setStep('import-upload'); setValidation(null); setSelectedFile(null); }}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Corrigir e Reenviar
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={loading || validation.validRows === 0}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
                sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
              >
                {loading ? 'Importando...' : `Importar ${validation.validRows} Colaborador${validation.validRows > 1 ? 'es' : ''}`}
              </Button>
            )}
          </>
        )}

        {(step === 'import-result' || step === 'export-done') && (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
