import { Injectable } from '@nestjs/common';

// import * as ExcelJS from 'exceljs'; // Opcional: npm install exceljs

@Injectable()
export class ExportService {
  /**
   * Exporta dados para CSV
   */
  exportToCSV(data: any[], filename: string): Buffer {
    if (!data || data.length === 0) {
      return Buffer.from('');
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(header => {
        const value = item[header];
        // Escapar valores com vírgula ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }),
    );

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Exporta dados para Excel (requer: npm install exceljs)
   * Descomente o import acima e instale a dependência para usar
   */
  async exportToExcel(
    data: any[],
    filename: string,
    sheetName: string = 'Data',
  ): Promise<Buffer> {
    // if (!data || data.length === 0) {
    //   return Buffer.from('');
    // }
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet(sheetName);
    // const headers = Object.keys(data[0]);
    // worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
    // data.forEach(item => {
    //   worksheet.addRow(item);
    // });
    // worksheet.getRow(1).font = { bold: true };
    // worksheet.getRow(1).fill = {
    //   type: 'pattern',
    //   pattern: 'solid',
    //   fgColor: { argb: 'FFD3D3D3' },
    // };
    // return await workbook.xlsx.writeBuffer();
    
    return Buffer.from('Excel export requires npm install exceljs');
  }

  /**
   * Exporta JSON
   */
  exportToJSON(data: any[], filename: string): Buffer {
    const jsonContent = JSON.stringify(data, null, 2);
    return Buffer.from(jsonContent, 'utf-8');
  }
}

