/* ─── Lume · PDF Report Generator ─────────────────────────────────────
 *  Generates branded PDF reports using jsPDF + jspdf-autotable.
 *  Uses dynamic imports to avoid SSR issues with Next.js.
 *  Follows the Lume visual identity:
 *    Navy primary: #0A1E3D
 *    Gold accent:  #D4A84B
 *    Light bg:     #F7F8FA
 *    Footer:       Lume · Gestão de Pessoas © 2026
 * ──────────────────────────────────────────────────────────────────── */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Dynamic imports to avoid SSR issues (jsPDF accesses browser globals)
async function getJsPDF() {
  const mod = await import('jspdf');
  return mod.default || mod.jsPDF;
}

async function getAutoTable() {
  const mod = await import('jspdf-autotable');
  return mod.default || mod.autoTable;
}

// ─── Brand Colors ────────────────────────────────────────────────────
const COLORS = {
  navy: [10, 30, 61] as [number, number, number],
  gold: [212, 168, 75] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [247, 248, 250] as [number, number, number],
  textPrimary: [10, 30, 61] as [number, number, number],
  textSecondary: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  positive: [5, 150, 105] as [number, number, number],
  negative: [220, 38, 38] as [number, number, number],
};

// ─── Types ───────────────────────────────────────────────────────────
export interface ReportConfig {
  title: string;
  subtitle?: string;
  companyName?: string;
  columns: { header: string; dataKey: string; width?: number }[];
  rows: Record<string, string | number>[];
  summary?: { label: string; value: string | number }[];
  orientation?: 'portrait' | 'landscape';
}

// ─── Draw Lume Logo (geometric prism as rectangles) ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawLumeLogo(doc: any, x: number, y: number, scale: number = 1) {
  const s = scale;
  // Background rect
  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(x, y, 18 * s, 18 * s, 4 * s, 4 * s, 'F');
  // Back plane
  doc.setFillColor(26, 58, 92);
  doc.roundedRect(x + 4.5 * s, y + 4.5 * s, 6.3 * s, 6.3 * s, 1 * s, 1 * s, 'F');
  // Front plane (gold)
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(x + 7.2 * s, y + 7.2 * s, 6.3 * s, 6.3 * s, 1 * s, 1 * s, 'F');
  // Intersection highlight (light semi-transparent effect)
  doc.setFillColor(220, 220, 230);
  doc.roundedRect(x + 7.2 * s, y + 7.2 * s, 3.6 * s, 3.6 * s, 0.7 * s, 0.7 * s, 'F');
  // Core light accent
  doc.setFillColor(200, 165, 80);
  doc.roundedRect(x + 5 * s, y + 5 * s, 1.8 * s, 1.8 * s, 0.5 * s, 0.5 * s, 'F');
}

// ─── Draw Header ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawHeader(doc: any, config: ReportConfig) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 32;

  // Navy background
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo
  drawLumeLogo(doc, 12, 7, 1);

  // Brand text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text('Lume', 34, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GESTÃO DE PESSOAS', 34, 21);

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  const titleWidth = doc.getTextWidth(config.title);
  doc.text(config.title, pageWidth / 2 - titleWidth / 2, 14);

  // Subtitle (date)
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const subtitle = config.subtitle || `Relatório gerado em ${now}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  const subWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, pageWidth / 2 - subWidth / 2, 20);

  // Confidencial tag
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENCIAL', pageWidth - 14, 14, { align: 'right' });

  // Company name if provided
  if (config.companyName) {
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(config.companyName, pageWidth - 14, 20, { align: 'right' });
  }

  return headerHeight + 4; // Return Y offset for content
}

// ─── Draw Summary Cards ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawSummaryCards(doc: any, startY: number, summary: { label: string; value: string | number }[]) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usable = pageWidth - margin * 2;
  const cardCount = Math.min(summary.length, 5);
  const gap = 4;
  const cardW = (usable - gap * (cardCount - 1)) / cardCount;
  const cardH = 18;

  let x = margin;

  summary.slice(0, 5).forEach((item) => {
    // Card background
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, 'F');

    // Border
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, 'S');

    // Gold accent line (top)
    doc.setFillColor(...COLORS.gold);
    doc.rect(x + 4, startY + 2.5, 8, 0.8, 'F');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textSecondary);
    doc.text(item.label, x + 4, startY + 7);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.textPrimary);
    doc.text(String(item.value), x + 4, startY + 14.5);

    x += cardW + gap;
  });

  return startY + cardH + 6;
}

// ─── Draw Footer ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawFooter(doc: any, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - 8;

  // Top border line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(14, y - 4, pageWidth - 14, y - 4);

  // Left text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textSecondary);
  doc.text('Lume · Gestão de Pessoas © 2026', 14, y);

  // Right text
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 14, y, { align: 'right' });
}

// ─── Generate PDF ────────────────────────────────────────────────────
export async function generatePDF(config: ReportConfig) {
  const JsPDF = await getJsPDF();
  const autoTable = await getAutoTable();

  const orientation = config.orientation || 'landscape';
  const doc = new JsPDF({ orientation, unit: 'mm', format: 'a4' });

  // Header
  const contentY = drawHeader(doc, config);

  // Summary cards (if provided)
  let tableStartY = contentY;
  if (config.summary && config.summary.length > 0) {
    tableStartY = drawSummaryCards(doc, contentY, config.summary);
  }

  // Section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textPrimary);
  doc.text('Dados Detalhados', 14, tableStartY + 4);
  tableStartY += 8;

  // Table
  const head = [config.columns.map((c: { header: string }) => c.header)];
  const body = config.rows.map((row: Record<string, string | number>) =>
    config.columns.map((c: { dataKey: string }) => String(row[c.dataKey] ?? '-'))
  );

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: COLORS.textPrimary,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: config.columns.reduce((acc: Record<number, { cellWidth: number }>, col: { width?: number }, i: number) => {
      if (col.width) acc[i] = { cellWidth: col.width };
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    didDrawPage: () => {
      // Re-draw header on every page
      if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.pageNumber > 1) {
        drawHeader(doc, config);
      }
    },
  });

  // Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  return doc;
}

// ─── Download Helper ─────────────────────────────────────────────────
export async function downloadPDF(config: ReportConfig, filename?: string) {
  const doc = await generatePDF(config);
  const name = filename || `lume-${config.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(name);
}

// ─── Preview Helper (opens in new tab) ───────────────────────────────
export async function previewPDF(config: ReportConfig) {
  const doc = await generatePDF(config);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  // Use link click instead of window.open to avoid popup blockers
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Clean up the URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ─── Format Helpers ──────────────────────────────────────────────────
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ON_LEAVE: 'Afastado',
  TERMINATED: 'Desligado',
};

export const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Tempo Integral',
  PART_TIME: 'Meio Período',
  CONTRACTOR: 'Prestador',
  INTERN: 'Estagiário',
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  INDEFINITE: 'Indeterminado',
  FIXED_TERM: 'Prazo Fixo',
  APPRENTICE: 'Aprendiz',
  TEMPORARY: 'Temporário',
};

export const PAYMENT_CATEGORY_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  HOURLY: 'Horista',
  COMMISSION: 'Comissão',
};
