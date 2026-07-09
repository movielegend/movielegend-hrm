export interface ExportResult {
    filename: string;
    mimeType: string;
    encoding: 'utf8' | 'base64';
    content: string;
}
export declare class ExportService {
    readonly maxRows = 5000;
    exportCsv(filename: string, rows: Array<Record<string, unknown>>): ExportResult;
    exportExcel(filename: string, rows: Array<Record<string, unknown>>): ExportResult;
    safeFilename(name: string, extension: string): string;
    private assertLimit;
    private headers;
    private csvCell;
    private excelCell;
    private xml;
}
