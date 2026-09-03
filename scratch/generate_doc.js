const fs = require('fs');
const path = require('path');

const docContent = `xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
xmlns="http://www.w3.org/TR/REC-html40">

<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Báo cáo Đặc tả Yêu cầu Phần mềm - MovieLegend HRM</title>
<style>
  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1F2937;
    margin: 40px;
  }
  h1 {
    font-size: 20pt;
    color: #1E3A8A;
    text-align: center;
    border-bottom: 2px solid #1E3A8A;
    padding-bottom: 8px;
    margin-top: 20px;
    margin-bottom: 20px;
  }
  h2 {
    font-size: 15pt;
    color: #1E40AF;
    border-left: 4px solid #3B82F6;
    padding-left: 10px;
    margin-top: 25px;
    margin-bottom: 12px;
  }
  h3 {
    font-size: 12pt;
    color: #1E3A8A;
    margin-top: 15px;
    margin-bottom: 8px;
  }
  p, li {
    font-size: 11pt;
  }
  .header-box {
    background-color: #F0F9FF;
    border: 1px solid #BAE6FD;
    padding: 15px 20px;
    border-radius: 6px;
    margin-bottom: 30px;
  }
  .header-title {
    font-size: 22pt;
    font-weight: bold;
    color: #0369A1;
    text-align: center;
    margin: 0;
  }
  .header-subtitle {
    font-size: 13pt;
    text-align: center;
    color: #0284C7;
    margin-top: 5px;
  }
  .meta-table {
    width: 100%;
    margin-top: 15px;
    border-collapse: collapse;
  }
  .meta-table td {
    padding: 4px 8px;
    font-size: 10.5pt;
  }
  table.spec-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 20px;
  }
  table.spec-table th {
    background-color: #1E40AF;
    color: #FFFFFF;
    font-weight: bold;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #1E3A8A;
    font-size: 10pt;
  }
  table.spec-table td {
    padding: 8px 10px;
    border: 1px solid #D1D5DB;
    font-size: 10pt;
    vertical-align: top;
  }
  table.spec-table tr:nth-child(even) {
    background-color: #F9FAFB;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 9pt;
    font-weight: bold;
    color: #FFFFFF;
    border-radius: 4px;
  }
  .code-block {
    background-color: #1E293B;
    color: #F8FAFC;
    font-family: 'Consolas', 'Courier New', monospace;
    padding: 12px;
    border-radius: 6px;
    font-size: 9.5pt;
    white-space: pre-wrap;
    margin: 10px 0;
  }
  .highlight-item {
    color: #059669;
    font-weight: bold;
  }
  .warning-item {
    color: #DC2626;
    font-weight: bold;
  }
</style>
</head>
<body>

<div class="header-box">
  <div class="header-title">BÁO CÁO ĐẶC TẢ YÊU CẦU PHẦN MỀM</div>
  <div class="header-subtitle">Quy Trình Thi Đua 2 Bước: Leader Duyệt Vòng 1 & Admin Phê Duyệt Nâng Level Cuối Tháng</div>
  <table class="meta-table">
    <tr>
      <td><strong>Dự án:</strong> MovieLegend HRM</td>
      <td><strong>Phiên bản:</strong> 9.0 - 2-Step Competition & Monthly Level Decision Integration</td>
    </tr>
    <tr>
      <td><strong>Ngày lập:</strong> 03/09/2026</td>
      <td><strong>Đơn vị nhận:</strong> Ban Giám Đốc / Đội ngũ Dev / BA / UI-UX</td>
    </tr>
  </table>
</div>

<h2>I. QUY TRÌNH 3 GIAI ĐOẠN QUẢN LÝ THI ĐUA & XÉT NÂNG LEVEL CUẤI THÁNG</h2>
<p>Chương trình Thi đua được thiết kế chuẩn chỉnh theo quy trình 3 giai đoạn minh bạch, kết hợp giữa dữ liệu hệ thống tự động, sự đánh giá sát sao của Leader và quyền quyết định thăng cấp cuối cùng từ Admin/BĐH:</p>

<table class="spec-table">
  <thead>
    <tr>
      <th style="width: 15%;">Giai đoạn</th>
      <th style="width: 25%;">Đối tượng Thực hiện</th>
      <th style="width: 35%;">Hành động & Nội dung Đánh giá</th>
      <th style="width: 25%;">Kết quả Đầu ra (Output)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Giai đoạn 1: ĐẦU THÁNG</b><br>(Cấu hình Thi đua)</td>
      <td><b>Admin / Ban Giám Đốc</b></td>
      <td>Cấu hình Mục tiêu & Tiêu chí Thi đua Tháng cho <b>từng Bộ phận riêng biệt</b> (Livestream, HR, Kho, MKT, CSKH, Kế toán, IT).</td>
      <td>Bộ chỉ số Thi đua Tháng hiển thị trên App Mobile toàn bộ công ty.</td>
    </tr>
    <tr>
      <td><b>Giai đoạn 2: CUỐI THÁNG (Vòng 1)</b><br>(Leader Duyệt Vòng 1)</td>
      <td><b>Team Leader</b></td>
      <td>• Mở màn hình Duyệt Thi đua Vòng 1.<br>• Xem kết quả thực tế của từng nhân viên trong Team.<br>• Đánh giá mức độ đóng góp & Bấm <b>[Đề xuất Nâng Level / Giữ nguyên]</b>.</td>
      <td>Phiếu Đề xuất Thi đua Vòng 1 gửi lên Admin.</td>
    </tr>
    <tr>
      <td><b>Giai đoạn 3: CUỐI THÁNG (Vòng 2)</b><br>(Admin Phê duyệt Cuối tháng)</td>
      <td><b>Admin / HR / Ban Giám Đốc</b></td>
      <td>• Mở Dashboard Phê duyệt Thi đua Toàn công ty.<br>• Kiểm tra: Dữ liệu thực tế + Nhận xét Leader + Lịch sử kỷ luật.<br>• Quyết định <b>Nâng Level / Giữ Level / Giảm Level</b>.</td>
      <td><span class="highlight-item">Cập nhật Level mới cho Nhân sự</span> + Thông báo chúc mừng & Thưởng.</td>
    </tr>
  </tbody>
</table>

<h2>II. CẤU TRÚC DATABASE SCHEMA (2-STEP COMPETITION WORKFLOW)</h2>

<div class="code-block">
// Trạng thái Phê duyệt Thi đua Tháng của Nhân sự
enum CompetitionReviewStatus {
  PENDING_LEADER_REVIEW   // Chờ Leader duyệt Vòng 1
  LEADER_RECOMMENDED      // Leader đã đề xuất Nâng Level
  LEADER_REJECTED         // Leader không đề xuất
  ADMIN_APPROVED_PROMOTION// Admin chốt Nâng Level cuối tháng
  ADMIN_RETAINED_LEVEL    // Admin chốt Giữ nguyên Level
  ADMIN_DEMOTED_LEVEL     // Admin chốt Giảm Level
}

model MonthlyCompetitionReview {
  id                 String                  @id @default(uuid())
  userId             String
  user               User                    @relation(fields: [userId], references: [id])
  departmentId       String
  period             String                  // "2026-09"
  
  // Kết quả thực tế
  actualSales        Decimal?                @db.Decimal(15, 2)
  completedTaskRate  Decimal?                @db.Decimal(5, 2)
  csatScore          Decimal?                @db.Decimal(3, 2)
  
  // Vòng 1: Leader Review
  leaderStatus       CompetitionReviewStatus @default(PENDING_LEADER_REVIEW)
  leaderNote         String?
  leaderReviewedAt   DateTime?
  
  // Vòng 2: Admin Monthly Final Decision
  adminStatus        CompetitionReviewStatus @default(PENDING_LEADER_REVIEW)
  fromLevelId        String?
  toLevelId          String?
  adminNote          String?
  adminApprovedAt    DateTime?
  
  createdAt          DateTime                @default(now())

  @@unique([userId, period])
}
</div>

</body>
</html>
`;

try {
  fs.writeFileSync(path.join('d:\\MovieLegend', 'Bao_Cao_Dac_Ta_MovieLegend_HRM_v13.doc'), docContent, 'utf-8');
  console.log('Doc file v13 created successfully');
} catch (e) {
  console.error(e);
}
