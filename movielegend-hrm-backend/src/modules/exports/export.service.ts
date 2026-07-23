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

  exportAttendanceDetailExcel(filename: string, reportData: any): ExportResult {
    const { startDate, endDate, userGroups } = reportData;
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // Define styles
    const styles = `
      <Styles>
        <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/></Style>
        <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="14"/></Style>
        <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:Bold="1"/><Interior ss:Color="#92D050" ss:Pattern="Solid"/></Style>
        <Style ss:ID="HeaderYellow"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:Bold="1"/><Interior ss:Color="#FFFF00" ss:Pattern="Solid"/></Style>
        <Style ss:ID="Cell"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
        <Style ss:ID="CellBold"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:Bold="1"/></Style>
        <Style ss:ID="SummaryRow"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:Bold="1"/><Interior ss:Color="#FFFF00" ss:Pattern="Solid"/></Style>
      </Styles>
    `;

    const cols = `
      <Column ss:Width="60"/> <!-- Ma NV -->
      <Column ss:Width="120"/> <!-- Ten NV -->
      <Column ss:Width="100"/> <!-- Phong ban -->
      <Column ss:Width="80"/> <!-- Chuc vu -->
      <Column ss:Width="80"/> <!-- Ngay -->
      <Column ss:Width="60"/> <!-- Thu -->
      <Column ss:Width="50"/> <!-- Vao -->
      <Column ss:Width="50"/> <!-- Ra -->
      <Column ss:Width="50"/> <!-- Cong -->
      <Column ss:Width="60"/> <!-- Tong gio -->
      <Column ss:Width="60"/> <!-- OT 150 -->
      <Column ss:Width="60"/> <!-- OT 200 -->
      <Column ss:Width="60"/> <!-- Muon chieu -->
      <Column ss:Width="60"/> <!-- Muon sang -->
      <Column ss:Width="60"/> <!-- Tong muon -->
      <Column ss:Width="60"/> <!-- Ve som -->
      <Column ss:Width="80"/> <!-- Tong muon + som -->
      <Column ss:Width="80"/> <!-- Tru di muon -->
      <Column ss:Width="80"/> <!-- Ho tro dem -->
    `;

    const headers = [
      'Mã NV', 'Tên nhân viên', 'Phòng ban', 'Chức vụ', 'Ngày', 'Thứ', 'Vào', 'Ra', 'Công',
      'Tổng Giờ', 'Tăng ca x150%', 'Tăng ca x200%', 'Đi muộn ca chiều', 'Đi muộn ca sáng',
      'Tổng đi muộn', 'Về sớm', 'Tổng đi muộn + về sớm', 'Trừ đi muộn/quên chấm công', 'Hỗ trợ làm đêm'
    ];

    const xmlRows: string[] = [];
    
    // Title
    xmlRows.push(`<Row ss:Height="25"><Cell ss:MergeAcross="18" ss:StyleID="Title"><Data ss:Type="String">Từ ngày ${startStr} đến ngày ${endStr}</Data></Cell></Row>`);
    
    // Header row
    const headerCells = headers.map((h, i) => {
      const style = (i >= 8 && i <= 10) ? 'Header' : 'HeaderYellow';
      return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${this.xml(h)}</Data></Cell>`;
    }).join('');
    xmlRows.push(`<Row ss:Height="30">${headerCells}</Row>`);

    // Data rows
    for (const group of userGroups) {
      if (group.length === 0) continue;
      const first = group[0];
      
      // Calculate summary
      let sumCong = 0, sumTru = 0, sumDem = 0;
      let sumOt150 = 0, sumOt200 = 0, sumMuon = 0, sumSom = 0;
      for (const row of group) {
        sumCong += row.attendance;
        sumOt150 += row._rawOt150;
        sumOt200 += row._rawOt200;
        sumMuon += row._rawLate;
        sumSom += row._rawEarly;
        sumTru += row.lateDeduction;
        sumDem += row.nightAllowance;
      }
      
      const formatHrs = (mins: number) => {
        if (!mins) return '0:00:00';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return \`\${h}:\${m.toString().padStart(2, '0')}:00\`;
      };

      // Summary Row
      xmlRows.push(\`
        <Row>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${this.xml(first.employeeCode)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${this.xml(first.employeeName)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${this.xml(first.department)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="Number">\${sumCong}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${formatHrs(sumOt150)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${formatHrs(sumOt200)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String"></Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${formatHrs(sumMuon)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${formatHrs(sumSom)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="String">\${formatHrs(sumMuon + sumSom)}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="Number">\${sumTru}</Data></Cell>
          <Cell ss:StyleID="SummaryRow"><Data ss:Type="Number">\${sumDem}</Data></Cell>
        </Row>
      \`);

      // Detail rows
      for (const row of group) {
        xmlRows.push(\`
          <Row>
            <Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.date)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.dayOfWeek)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.checkIn)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.checkOut)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="Number">\${row.attendance}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.totalHours)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.overtime150)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.overtime200)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.lateAfternoon)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.lateMorning)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.totalLate)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.earlyLeave)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="String">\${this.xml(row.totalLateAndEarly)}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="Number">\${row.lateDeduction}</Data></Cell>
            <Cell ss:StyleID="Cell"><Data ss:Type="Number">\${row.nightAllowance}</Data></Cell>
          </Row>
        \`);
      }
    }

    const content = \`<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      \${styles}
      <Worksheet ss:Name="Attendance">
        <Table>
          \${cols}
          \${xmlRows.join('\\n')}
        </Table>
      </Worksheet>
      </Workbook>\`;
      
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
