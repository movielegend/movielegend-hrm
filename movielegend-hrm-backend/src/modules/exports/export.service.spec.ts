import { BadRequestException } from '@nestjs/common';
import { ExportService } from './export.service';

describe('ExportService', () => {
  const service = new ExportService();

  it('exports CSV with UTF-8 BOM for Vietnamese Excel compatibility', () => {
    const result = service.exportCsv('attendance report', [{ name: 'Nguyen Van A', workedMinutes: 480 }]);
    expect(result.filename).toBe('attendance-report.csv');
    expect(result.content.charCodeAt(0)).toBe(0xfeff);
  });

  it('keeps numeric Excel cells numeric', () => {
    const result = service.exportExcel('payroll', [{ employeeCount: 2, netTotal: 1000 }]);
    expect(result.content).toContain('ss:Type="Number">1000');
  });

  it('enforces large export limit', () => {
    expect(() => service.exportCsv('large', Array.from({ length: service.maxRows + 1 }, () => ({ id: 1 })))).toThrow(BadRequestException);
  });
});
