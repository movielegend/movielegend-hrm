import { Injectable } from '@nestjs/common';
import { badRequest } from '../../common/utils/error.util';

export interface ExportResult {
  filename: string;
  mimeType: string;
  encoding: 'utf8' | 'base64';
  content: string;
}

@Injectable()
export class ExportService {
  readonly maxRows = 5000;

  exportCsv(filename: string, rows: Array<Record<string, unknown>>): ExportResult {
    this.assertLimit(rows.length);
    const headers = this.headers(rows);
    const lines = [headers.join(',')].concat(
      rows.map((row) => headers.map((header) => this.csvCell(row[header])).join(',')),
    );
    return {
      filename: this.safeFilename(filename, 'csv'),
      mimeType: 'text/csv; charset=utf-8',
      encoding: 'utf8',
      content: `\uFEFF${lines.join('\n')}`,
    };
  }

  exportExcel(filename: string, rows: Array<Record<string, unknown>>): ExportResult {
    this.assertLimit(rows.length);
    const headers = this.headers(rows);
    const xmlRows = [
      `<Row>${headers.map((header) => `<Cell><Data ss:Type="String">${this.xml(header)}</Data></Cell>`).join('')}</Row>`,
      ...rows.map((row) => `<Row>${headers.map((header) => this.excelCell(row[header])).join('')}</Row>`),
    ];
    const content = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report"><Table>${xmlRows.join('')}</Table></Worksheet></Workbook>`;
    return {
      filename: this.safeFilename(filename, 'xls'),
      mimeType: 'application/vnd.ms-excel',
      encoding: 'utf8',
      content,
    };
  }

  safeFilename(name: string, extension: string): string {
    const safe = name.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'report';
    return `${safe}.${extension}`;
  }

  private assertLimit(count: number) {
    if (count > this.maxRows) throw badRequest('EXPORT_LIMIT_EXCEEDED', `Export limit is ${this.maxRows} rows`);
  }

  private headers(rows: Array<Record<string, unknown>>) {
    return rows.length ? Object.keys(rows[0]) : ['empty'];
  }

  private csvCell(value: unknown) {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private excelCell(value: unknown) {
    if (typeof value === 'number') return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
    return `<Cell><Data ss:Type="String">${this.xml(value === null || value === undefined ? '' : String(value))}</Data></Cell>`;
  }

  private xml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
