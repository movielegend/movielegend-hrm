"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
let ExportService = class ExportService {
    maxRows = 5000;
    exportCsv(filename, rows) {
        this.assertLimit(rows.length);
        const headers = this.headers(rows);
        const lines = [headers.join(',')].concat(rows.map((row) => headers.map((header) => this.csvCell(row[header])).join(',')));
        return {
            filename: this.safeFilename(filename, 'csv'),
            mimeType: 'text/csv; charset=utf-8',
            encoding: 'utf8',
            content: `\uFEFF${lines.join('\n')}`,
        };
    }
    exportExcel(filename, rows) {
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
    safeFilename(name, extension) {
        const safe = name.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'report';
        return `${safe}.${extension}`;
    }
    assertLimit(count) {
        if (count > this.maxRows)
            throw (0, error_util_1.badRequest)('EXPORT_LIMIT_EXCEEDED', `Export limit is ${this.maxRows} rows`);
    }
    headers(rows) {
        return rows.length ? Object.keys(rows[0]) : ['empty'];
    }
    csvCell(value) {
        const text = value === null || value === undefined ? '' : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    }
    excelCell(value) {
        if (typeof value === 'number')
            return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
        return `<Cell><Data ss:Type="String">${this.xml(value === null || value === undefined ? '' : String(value))}</Data></Cell>`;
    }
    xml(value) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)()
], ExportService);
//# sourceMappingURL=export.service.js.map