import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const CONFIG_STORAGE_FILE = path.join(STORAGE_DIR, 'level_dept_configs.json');
const PROJECT_STORAGE_FILE = path.join(STORAGE_DIR, 'level_dept_projects.json');

export interface LevelGmvItem {
  levelNumber: number;
  levelName: string;
  currentGmv: number;
  promotionCeilingGmv: number;
  retentionFloorGmv: number;
  gmvUnit: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BulletSubTaskItem {
  id: string;
  orderNumber: number;
  title: string;
  targetKpi?: string;
  description?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LEADER_APPROVED' | 'ADMIN_APPROVED';
  submissionNote?: string;
  evidenceUrl?: string;
  evidenceImages?: string[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LevelDepartmentProjectItem {
  levelNumber: number;
  levelName: string;
  departmentName: string;
  projectName: string;
  totalSubTasks: number;
  completedSubTasks: number;
  rewardItem?: string;
  subTasks: BulletSubTaskItem[];
}

@Injectable()
export class LevelingService {
  private gmvConfigs: LevelGmvItem[] = [
    { levelNumber: 1, levelName: 'Level 1', currentGmv: 0, promotionCeilingGmv: 50, retentionFloorGmv: 0, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 2, levelName: 'Level 2', currentGmv: 0, promotionCeilingGmv: 150, retentionFloorGmv: 30, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 3, levelName: 'Level 3', currentGmv: 0, promotionCeilingGmv: 400, retentionFloorGmv: 100, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 4, levelName: 'Level 4', currentGmv: 0, promotionCeilingGmv: 800, retentionFloorGmv: 400, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 5, levelName: 'Level 5', currentGmv: 0, promotionCeilingGmv: 1000, retentionFloorGmv: 500, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 6, levelName: 'Level 6', currentGmv: 0, promotionCeilingGmv: 1500, retentionFloorGmv: 800, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 7, levelName: 'Level 7', currentGmv: 0, promotionCeilingGmv: 3000, retentionFloorGmv: 1500, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 8, levelName: 'Level 8', currentGmv: 0, promotionCeilingGmv: 5000, retentionFloorGmv: 3000, gmvUnit: 'Tr VNĐ' },
  ];

  private projects: LevelDepartmentProjectItem[] = [
    {
      levelNumber: 1,
      levelName: 'Level 1',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Khởi Động: Chuẩn hóa vận hành phòng Live & Kỹ thuật thiết bị',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'Bộ Kit Tân Binh & Thưởng khởi động',
      subTasks: [
        { id: 't1_1', orderNumber: 1, title: 'Kiểm tra và hiệu chỉnh hệ thống ánh sáng 3 điểm trước ca live', targetKpi: '100% ca đạt chuẩn ánh sáng', status: 'PENDING' },
        { id: 't1_2', orderNumber: 2, title: 'Test âm thanh micro không dây và bộ lọc chống ồn', targetKpi: 'Không trễ tiếng, không tạp âm', status: 'PENDING' },
        { id: 't1_3', orderNumber: 3, title: 'Setup phần mềm OBS, kiểm tra bitrate và độ trễ stream', targetKpi: 'Bitrate 6000kbps, 60fps', status: 'PENDING' },
        { id: 't1_4', orderNumber: 4, title: 'Kiểm đếm và sắp xếp mẫu sản phẩm livestream lên kệ theo kịch bản', targetKpi: 'Đầy đủ 100% SKU hot', status: 'PENDING' },
        { id: 't1_5', orderNumber: 5, title: 'Soạn thảo bảng giá và mã giảm giá hiển thị trên màn hình', targetKpi: 'Chuẩn mã voucher theo giờ', status: 'PENDING' },
        { id: 't1_6', orderNumber: 6, title: 'Hỗ trợ Streamer ghim sản phẩm đúng thời điểm chốt đơn', targetKpi: 'Ghim trong 3 giây sau khi gọi tên', status: 'PENDING' },
        { id: 't1_7', orderNumber: 7, title: 'Theo dõi chỉ số mắt xem (CCU) và ghi nhận biến động', targetKpi: 'Cập nhật mỗi 15 phút', status: 'PENDING' },
        { id: 't1_8', orderNumber: 8, title: 'Phản hồi bình luận thắc mắc của khách hàng trên kênh chat', targetKpi: 'Tốc độ phản hồi < 10 giây', status: 'PENDING' },
        { id: 't1_9', orderNumber: 9, title: 'Tổng kết số lượng đơn hàng phát sinh ngay khi kết thúc ca', targetKpi: 'Báo cáo sau 10 phút đóng live', status: 'PENDING' },
        { id: 't1_10', orderNumber: 10, title: 'Vệ sinh phòng live, đóng gói thiết bị và bàn giao ca tiếp theo', targetKpi: '100% thiết bị tắt đúng quy trình', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 2,
      levelName: 'Level 2',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Nâng Cao: Tối ưu tương tác & Kỹ thuật điều phối phiên Live độc lập',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'Thưởng nóng 1.000.000đ & Kỷ niệm chương Thâm Niên',
      subTasks: [
        { id: 't2_1', orderNumber: 1, title: 'Độc lập điều phối toàn bộ hệ thống kỹ thuật cho ca live 4 tiếng', targetKpi: '0 lỗi kỹ thuật gián đoạn', status: 'PENDING' },
        { id: 't2_2', orderNumber: 2, title: 'Xây dựng kịch bản minigame tăng tương tác đầu ca', targetKpi: 'Tăng 20% giữ chân người xem', status: 'PENDING' },
        { id: 't2_3', orderNumber: 3, title: 'Điều chỉnh ánh sáng & góc máy động theo từng loại sản phẩm', targetKpi: 'Làm nổi bật chi tiết sản phẩm', status: 'PENDING' },
        { id: 't2_4', orderNumber: 4, title: 'Tối ưu luồng phản hồi và xử lý khiếu nại nhanh trong ca', targetKpi: 'Giải quyết 95% khúc mắc tại chỗ', status: 'PENDING' },
        { id: 't2_5', orderNumber: 5, title: 'Phối hợp với Streamer tạo nhịp điệu kích thích chốt đơn', targetKpi: 'Đạt mốc 50 đơn/giờ vàng', status: 'PENDING' },
        { id: 't2_6', orderNumber: 6, title: 'Kiểm soát tồn kho sản phẩm Flash Sale theo thời gian thực', targetKpi: 'Không bán vượt tồn kho thực tế', status: 'PENDING' },
        { id: 't2_7', orderNumber: 7, title: 'Phân tích báo cáo sau live (Drop-off rate, Click-through rate)', targetKpi: 'Báo cáo chi tiết gửi trong 1 giờ', status: 'PENDING' },
        { id: 't2_8', orderNumber: 8, title: 'Đề xuất 2 cải tiến kịch bản cho sản phẩm có chuyển đổi thấp', targetKpi: 'Có ít nhất 1 ý tưởng áp dụng ngay', status: 'PENDING' },
        { id: 't2_9', orderNumber: 9, title: 'Hướng dẫn nhân sự mới Level 1 làm quen phần mềm OBS', targetKpi: 'Nhân sự mới thao tác độc lập', status: 'PENDING' },
        { id: 't2_10', orderNumber: 10, title: 'Tổng hợp danh sách khách hàng thân thiết để chăm sóc sau live', targetKpi: '100% khách VIP được ghi nhận', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 3,
      levelName: 'Level 3',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Chuyên Nghiệp: Đột phá tỷ lệ chuyển đổi & Kèm cặp nhân sự',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'TAI NGHE BLUETOOTH CHỐNG ỒN + 3.000.000đ',
      subTasks: [
        { id: 't3_1', orderNumber: 1, title: 'Xây dựng kịch bản bán hàng độc quyền cho dòng sản phẩm chủ lực', targetKpi: 'Tăng 15% doanh số dòng chủ lực', status: 'PENDING' },
        { id: 't3_2', orderNumber: 2, title: 'Kèm cặp và hướng dẫn thực hành cho 1 nhân sự mới Level 1', targetKpi: 'Nhân sự kèm cặp đạt chuẩn ca trực', status: 'PENDING' },
        { id: 't3_3', orderNumber: 3, title: 'Điều phối phiên livestream sự kiện Payday / Mega Sale kéo dài', targetKpi: 'Duy trì hiệu suất ca live liên tục', status: 'PENDING' },
        { id: 't3_4', orderNumber: 4, title: 'Tối ưu phễu chuyển đổi từ người xem sang giỏ hàng (CTR > 10%)', targetKpi: 'CTR giỏ hàng ≥ 10%', status: 'PENDING' },
        { id: 't3_5', orderNumber: 5, title: 'Xử lý khủng hoảng tín hiệu mạng và sự cố âm thanh trong ca lớn', targetKpi: 'Khắc phục trong vòng dưới 60 giây', status: 'PENDING' },
        { id: 't3_6', orderNumber: 6, title: 'Thiết kế bố cục màn hình live bắt mắt với đồ họa động', targetKpi: 'Tăng 25% tỷ lệ giữ chân xem tiếp', status: 'PENDING' },
        { id: 't3_7', orderNumber: 7, title: 'Phối hợp với phòng Marketing chạy quảng cáo TikTok Live Ads', targetKpi: 'ROAS quảng cáo live ≥ 4.0', status: 'PENDING' },
        { id: 't3_8', orderNumber: 8, title: 'Đánh giá năng lực và phản hồi định kỳ cho các nhân sự cấp dưới', targetKpi: 'Hoàn thành phiếu đánh giá tuần', status: 'PENDING' },
        { id: 't3_9', orderNumber: 9, title: 'Đề xuất chiến lược định giá combo sản phẩm tăng AOV', targetKpi: 'Giá trị đơn trung bình tăng 15%', status: 'PENDING' },
        { id: 't3_10', orderNumber: 10, title: 'Biên soạn tài liệu câu hỏi thường gặp (FAQ) cho đội trực live', targetKpi: 'Bộ 50 câu hỏi & kịch bản trả lời', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 4,
      levelName: 'Level 4',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Cao Cấp: Dẫn dắt chiến dịch bán hàng quy mô lớn & Chuẩn hóa tài liệu',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'IPAD AIR 4K + 5.000.000đ',
      subTasks: [
        { id: 't4_1', orderNumber: 1, title: 'Chủ trì lên kế hoạch tổng thể cho chiến dịch Mega Live 12.12', targetKpi: 'Kế hoạch hoàn chỉnh trước 2 tuần', status: 'PENDING' },
        { id: 't4_2', orderNumber: 2, title: 'Điều phối đội ngũ 10 nhân sự vận hành 3 phòng live đồng thời', targetKpi: '100% phòng live hoạt động trơn tru', status: 'PENDING' },
        { id: 't4_3', orderNumber: 3, title: 'Đàm phán với Brand đối tác về tài trợ quà tặng độc quyền phiên live', targetKpi: 'Tối thiểu 100 phần quà tài trợ', status: 'PENDING' },
        { id: 't4_4', orderNumber: 4, title: 'Tổ chức buổi workshop nội bộ đào tạo kỹ năng ứng biến cho Streamer', targetKpi: '100% Streamer tham gia đánh giá tốt', status: 'PENDING' },
        { id: 't4_5', orderNumber: 5, title: 'Xây dựng hệ thống cảnh báo sớm khi tín hiệu live gặp sự cố', targetKpi: 'Hệ thống tự động thông báo Telegram', status: 'PENDING' },
        { id: 't4_6', orderNumber: 6, title: 'Tối ưu hóa chi phí vận hành ca live giảm 10% chi phí phụ trợ', targetKpi: 'Tiết kiệm chi phí đo lường được', status: 'PENDING' },
        { id: 't4_7', orderNumber: 7, title: 'Phân tích đối thủ cạnh tranh trên TikTok Shop và đề xuất đối sách', targetKpi: 'Báo cáo phân tích 5 kênh top ngành', status: 'PENDING' },
        { id: 't4_8', orderNumber: 8, title: 'Kèm cặp và đào tạo 2 nhân sự Level 2 lên Level 3', targetKpi: 'Cả 2 nhân sự đủ điều kiện thăng cấp', status: 'PENDING' },
        { id: 't4_9', orderNumber: 9, title: 'Nghiên cứu áp dụng công nghệ AI tạo phụ đề tự động theo giọng nói', targetKpi: 'Tăng trải nghiệm người xem live', status: 'PENDING' },
        { id: 't4_10', orderNumber: 10, title: 'Đo lường và cải thiện chỉ số hài lòng khách hàng CSAT sau mua', targetKpi: 'CSAT phòng live đạt ≥ 96%', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 5,
      levelName: 'Level 5',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Thủ Lĩnh Bộ Phận: Xây dựng hệ thống quản trị năng suất & Chuẩn hóa giáo trình',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'MACBOOK AIR M3 + 8.000.000đ',
      subTasks: [
        { id: 't5_1', orderNumber: 1, title: 'Xây dựng bộ chỉ số KPI chi tiết theo từng vị trí ca trực livestream', targetKpi: 'Ban hành áp dụng toàn phòng ban', status: 'PENDING' },
        { id: 't5_2', orderNumber: 2, title: 'Thiết kế giáo trình đào tạo chuẩn 8 cấp bậc phòng livestream', targetKpi: 'Giáo trình 50 trang kèm bài kiểm tra', status: 'PENDING' },
        { id: 't5_3', orderNumber: 3, title: 'Trực tiếp chỉ đạo chiến dịch Mega Live bứt phá 1 Tỷ GMV/tháng', targetKpi: 'Đạt mốc GMV 1 Tỷ VNĐ', status: 'PENDING' },
        { id: 't5_4', orderNumber: 4, title: 'Tuyển dụng và phỏng vấn 5 nhân sự kỹ thuật live mới', targetKpi: '100% nhân sự tuyển đạt chuẩn thử việc', status: 'PENDING' },
        { id: 't5_5', orderNumber: 5, title: 'Xây dựng quy trình phối hợp tự động giữa Kho và Phòng Live', targetKpi: 'Giảm 50% thời gian xác nhận tồn', status: 'PENDING' },
        { id: 't5_6', orderNumber: 6, title: 'Tổ chức kỳ đánh giá nâng cấp định kỳ tháng cho toàn bộ nhân sự', targetKpi: '100% nhân sự được xét duyệt đúng hạn', status: 'PENDING' },
        { id: 't5_7', orderNumber: 7, title: 'Đàm phán với TikTok Shop Vietnam về các gói tài trợ traffic độc quyền', targetKpi: 'Được cấp voucher độc quyền nền tảng', status: 'PENDING' },
        { id: 't5_8', orderNumber: 8, title: 'Tối ưu hóa tỷ lệ hoàn đơn từ phiên live xuống dưới 5%', targetKpi: 'Tỷ lệ hoàn đơn < 5%', status: 'PENDING' },
        { id: 't5_9', orderNumber: 9, title: 'Đào tạo 1 nhân sự kế cận có thể đảm nhiệm vai trò Quản lý ca trực', targetKpi: 'Nhân sự kế cận tự vận hành ca lớn', status: 'PENDING' },
        { id: 't5_10', orderNumber: 10, title: 'Báo cáo tổng kết hiệu quả kinh doanh quý lên Ban Giám Đốc', targetKpi: 'Báo cáo được BGĐ thông qua', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 6,
      levelName: 'Level 6',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Quản Trị Hệ Thống: Mở rộng mô hình đa studio & Tối ưu chi phí vận hành',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'IPHONE 16 PRO MAX + 15.000.000đ',
      subTasks: [
        { id: 't6_1', orderNumber: 1, title: 'Quy hoạch và triển khai hạ tầng mạng chuyên dụng cho 5 studio mới', targetKpi: 'Băng thông 1Gbps độc lập từng phòng', status: 'PENDING' },
        { id: 't6_2', orderNumber: 2, title: 'Xây dựng lịch phát sóng 24/7 không gián đoạn cho hệ sinh thái kênh', targetKpi: 'Lấp đầy 100% khung giờ trong tuần', status: 'PENDING' },
        { id: 't6_3', orderNumber: 3, title: 'Phát triển chính sách hoa hồng lũy tiến kích thích doanh số nhân sự', targetKpi: 'Được phòng Nhân sự & BGĐ phê duyệt', status: 'PENDING' },
        { id: 't6_4', orderNumber: 4, title: 'Thiết lập hệ thống camera giám sát chất lượng trực tiếp từ xa', targetKpi: 'Theo dõi real-time trên Dashboard', status: 'PENDING' },
        { id: 't6_5', orderNumber: 5, title: 'Tuyển chọn và ký hợp đồng với 5 Streamer KOL/KOC danh tiếng', targetKpi: '5 hợp đồng độc quyền ký thành công', status: 'PENDING' },
        { id: 't6_6', orderNumber: 6, title: 'Tổ chức giải thi đấu nội bộ giữa các ca live tăng động lực team', targetKpi: '100% nhân sự tham gia sôi nổi', status: 'PENDING' },
        { id: 't6_7', orderNumber: 7, title: 'Chuẩn hóa quy trình sao lưu và bảo mật dữ liệu khách hàng', targetKpi: 'Bảo mật 100% dữ liệu theo chuẩn', status: 'PENDING' },
        { id: 't6_8', orderNumber: 8, title: 'Kiểm toán chất lượng thiết bị định kỳ và lên ngân sách thay thế', targetKpi: 'Không gián đoạn do hỏng thiết bị', status: 'PENDING' },
        { id: 't6_9', orderNumber: 9, title: 'Đào tạo kỹ năng quản lý và phân quyền cho các Leader cấp dưới', targetKpi: 'Các Leader tự chủ phân công việc', status: 'PENDING' },
        { id: 't6_10', orderNumber: 10, title: 'Định hình chiến lược phát triển kênh thương hiệu riêng cho công ty', targetKpi: 'Đạt mốc 100.000 follower kênh mới', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 7,
      levelName: 'Level 7',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Chiến Lược Cấp Cao: Tự động hóa vận hành 24/7 & Mở rộng thị trường',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'MACBOOK PRO MAX + 1 CÂY VÀNG 9999 + 30.000.000đ',
      subTasks: [
        { id: 't7_1', orderNumber: 1, title: 'Xây dựng mô hình 10 studio livestream vận hành đồng thời 24/7', targetKpi: 'Hệ thống vận hành liên tục 30 ngày', status: 'PENDING' },
        { id: 't7_2', orderNumber: 2, title: 'Phát triển đội ngũ 50 nhân sự livestream chuyên nghiệp', targetKpi: 'Tỷ lệ gắn bó nhân sự ≥ 90%', status: 'PENDING' },
        { id: 't7_3', orderNumber: 3, title: 'Tự động hóa luồng xử lý đơn hàng và đồng bộ kho thông minh qua API', targetKpi: 'Thời gian xử lý đơn < 1 giây', status: 'PENDING' },
        { id: 't7_4', orderNumber: 4, title: 'Xây dựng quỹ đãi ngộ và lộ trình ESOP cho nhân sự nòng cốt', targetKpi: 'Ký kết thỏa thuận gắn kết dài hạn', status: 'PENDING' },
        { id: 't7_5', orderNumber: 5, title: 'Dẫn dắt chiến dịch bán hàng đạt mốc 3 Tỷ GMV toàn hệ thống', targetKpi: 'Doanh số toàn phòng đạt 3 Tỷ VNĐ', status: 'PENDING' },
        { id: 't7_6', orderNumber: 6, title: 'Mở rộng chi nhánh studio livestream tại TP.HCM và Đà Nẵng', targetKpi: 'Khai trương 2 studio mới đúng tiến độ', status: 'PENDING' },
        { id: 't7_7', orderNumber: 7, title: 'Hợp tác với các nhãn hàng quốc tế phân phối độc quyền trên live', targetKpi: 'Ít nhất 3 nhãn hàng quốc tế ký kết', status: 'PENDING' },
        { id: 't7_8', orderNumber: 8, title: 'Tổ chức hội nghị vinh danh và trao giải thưởng thăng cấp quý', targetKpi: 'Sự kiện trang trọng, gắn kết 100% nhân sự', status: 'PENDING' },
        { id: 't7_9', orderNumber: 9, title: 'Đào tạo 4 nhân sự nòng cốt đạt tiêu chuẩn lên Level 4 & Level 5', targetKpi: 'Cả 4 nhân sự thăng cấp thành công', status: 'PENDING' },
        { id: 't7_10', orderNumber: 10, title: 'Đóng góp ý kiến vào chiến lược kinh doanh 5 năm của MovieLegend', targetKpi: 'Được Hội Đồng Quản Trị thông qua', status: 'PENDING' },
      ],
    },
    {
      levelNumber: 8,
      levelName: 'Level 8',
      departmentName: 'Phòng Livestream TikTok',
      projectName: 'Dự án Thủ Lĩnh Tinh Anh: Định hình vị thế dẫn đầu ngành & Hệ sinh thái mở rộng',
      totalSubTasks: 10,
      completedSubTasks: 0,
      rewardItem: 'XE Ô TÔ CÔNG VỤ + CỔ PHẦN ESOP + 50.000.000đ',
      subTasks: [
        { id: 't8_1', orderNumber: 1, title: 'Dẫn dắt toàn bộ hệ sinh thái livestream đạt mốc lịch sử 5 Tỷ GMV', targetKpi: 'Cột mốc doanh số 5 Tỷ VNĐ', status: 'PENDING' },
        { id: 't8_2', orderNumber: 2, title: 'Xây dựng trung tâm đào tạo Livestream Academy tiêu chuẩn quốc tế', targetKpi: 'Đào tạo 200 học viên/năm', status: 'PENDING' },
        { id: 't8_3', orderNumber: 3, title: 'Đại diện MovieLegend ký kết hợp tác chiến lược với TikTok Global', targetKpi: 'Thỏa thuận đối tác chiến lược cấp cao', status: 'PENDING' },
        { id: 't8_4', orderNumber: 4, title: 'Xây dựng cơ chế chia sẻ lợi nhuận và cổ phần thưởng cho toàn team', targetKpi: '100% nhân sự hài lòng và cống hiến', status: 'PENDING' },
        { id: 't8_5', orderNumber: 5, title: 'Dẫn dắt 10 chi nhánh nhượng quyền phòng live trên toàn quốc', targetKpi: '10 chi nhánh hoạt động có lãi', status: 'PENDING' },
        { id: 't8_6', orderNumber: 6, title: 'Tổ chức Gala thường niên tôn vinh các Thủ Lĩnh và Chiến Binh xuất sắc', targetKpi: 'Sự kiện quy mô 500 khách mời', status: 'PENDING' },
        { id: 't8_7', orderNumber: 7, title: 'Xây dựng quỹ an sinh xã hội và học bổng cống hiến MovieLegend', targetKpi: 'Hỗ trợ 100 trường hợp khó khăn', status: 'PENDING' },
        { id: 't8_8', orderNumber: 8, title: 'Phát triển thương hiệu cá nhân của đội ngũ Streamer thành ngôi sao', targetKpi: 'Có ít nhất 3 Streamer top 10 Việt Nam', status: 'PENDING' },
        { id: 't8_9', orderNumber: 9, title: 'Xây dựng văn hóa doanh nghiệp kỷ luật, nhân văn và đoàn kết', targetKpi: 'Chỉ số eNPS đạt ≥ +80', status: 'PENDING' },
        { id: 't8_10', orderNumber: 10, title: 'Chuyển giao và đào tạo thế hệ lãnh đạo kế cận kế thừa vị trí Level 8', targetKpi: 'Hệ thống vận hành độc lập hoàn toàn', status: 'PENDING' },
      ],
    },
  ];

  private departmentConfigs = new Map<string, any>();
  private departmentProjects = new Map<string, LevelDepartmentProjectItem[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(CONFIG_STORAGE_FILE)) {
        const raw = fs.readFileSync(CONFIG_STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([k, v]) => this.departmentConfigs.set(k, v));
      }
    } catch {
      // ignore
    }

    try {
      if (fs.existsSync(PROJECT_STORAGE_FILE)) {
        const raw = fs.readFileSync(PROJECT_STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([k, v]) => this.departmentProjects.set(k, v as any));
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      const configObj = Object.fromEntries(this.departmentConfigs.entries());
      fs.writeFileSync(CONFIG_STORAGE_FILE, JSON.stringify(configObj, null, 2), 'utf8');

      const projectObj = Object.fromEntries(this.departmentProjects.entries());
      fs.writeFileSync(PROJECT_STORAGE_FILE, JSON.stringify(projectObj, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  public getGmvConfigs(): LevelGmvItem[] {
    return this.gmvConfigs;
  }

  public getGmvByLevel(levelNumber: number): LevelGmvItem {
    const found = this.gmvConfigs.find((c) => c.levelNumber === levelNumber);
    if (!found) throw new NotFoundException(`Level ${levelNumber} GMV config not found`);
    return found;
  }

  public updateGmv(
    levelNumber: number,
    currentGmv: number,
    promotionCeilingGmv: number,
    retentionFloorGmv: number,
    updatedBy?: string,
    departmentId?: string,
  ): LevelGmvItem {
    const index = this.gmvConfigs.findIndex((c) => c.levelNumber === levelNumber);
    const item: LevelGmvItem = {
      levelNumber,
      levelName: `Level ${levelNumber}`,
      currentGmv,
      promotionCeilingGmv,
      retentionFloorGmv,
      gmvUnit: 'Tr VNĐ',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    if (index >= 0) {
      this.gmvConfigs[index] = item;
    } else {
      this.gmvConfigs.push(item);
    }

    if (departmentId) {
      this.realtimeEvents.emitToDepartment(departmentId, 'level:gmv:updated', item);
    }
    this.realtimeEvents.emitToRoom('level:config_room', 'level:gmv:updated', item);

    return item;
  }

  public getAdminDepartmentConfig(departmentId: string, year?: number, departmentName?: string): any | null {
    const y = year || 2026;
    const key1 = `${departmentId}_${y}`;
    const key2 = `${departmentName || ''}_${y}`;
    return this.departmentConfigs.get(key1) || this.departmentConfigs.get(key2) || null;
  }

  public saveAdminDepartmentConfig(payload: {
    departmentId: string;
    departmentName: string;
    year: number;
    levels: any[];
  }) {
    const { departmentId, departmentName, year, levels } = payload;
    const configKey = `${departmentId}_${year}`;
    this.departmentConfigs.set(configKey, levels);
    if (departmentName) {
      this.departmentConfigs.set(`${departmentName}_${year}`, levels);
    }

    // Convert Admin levels to LevelDepartmentProjectItem[]
    const convertedProjects: LevelDepartmentProjectItem[] = levels.map((lvl: any) => {
      const levelNumber = Number(lvl.levelNumber) || 1;
      const levelName = lvl.levelName || `Level ${levelNumber}`;
      const projectName =
        lvl.project?.projectName || `Dự Án Level ${levelNumber} - ${departmentName}`;
      const rewardItem =
        lvl.physicalItemName || `Thưởng thăng cấp Level ${levelNumber} - ${departmentName}`;

      const rawBullets: string[] =
        Array.isArray(lvl.project?.subTaskBullets) && lvl.project.subTaskBullets.length > 0
          ? lvl.project.subTaskBullets
          : [
              `Hoàn thành 100% chỉ tiêu KPI tháng cho Level ${levelNumber}`,
              `Thực hiện quy trình chuẩn hóa Level ${levelNumber} phòng ${departmentName}`,
            ];

      // Find existing project if any to preserve assigned user or progress
      const existingProject = this.findProjectList(departmentId, departmentName).find(
        (p) => p.levelNumber === levelNumber,
      );

      const subTasks: BulletSubTaskItem[] = rawBullets.map((bText: string, idx: number) => {
        const cleanTitle = String(bText).replace(/^[•\-\*]\s*/, '').trim();
        const subTaskId = `st_${levelNumber}_${idx + 1}`;
        const existingSub = existingProject?.subTasks?.find(
          (t) => t.id === subTaskId || t.orderNumber === idx + 1,
        );

        return {
          id: subTaskId,
          orderNumber: idx + 1,
          title: cleanTitle,
          targetKpi: 'Nghiệm thu đạt chuẩn 100%',
          status: existingSub?.status || 'PENDING',
          assignedUserId: existingSub?.assignedUserId,
          assignedUserName: existingSub?.assignedUserName,
          submissionNote: existingSub?.submissionNote,
          evidenceUrl: existingSub?.evidenceUrl,
          evidenceImages: existingSub?.evidenceImages,
          submittedAt: existingSub?.submittedAt,
          reviewedAt: existingSub?.reviewedAt,
          reviewedBy: existingSub?.reviewedBy,
        };
      });

      const completedCount = subTasks.filter(
        (t) => t.status === 'LEADER_APPROVED' || t.status === 'ADMIN_APPROVED',
      ).length;

      return {
        levelNumber,
        levelName,
        departmentName,
        projectName,
        totalSubTasks: subTasks.length,
        completedSubTasks: completedCount,
        rewardItem,
        subTasks,
      };
    });

    // Store in departmentProjects map
    this.departmentProjects.set(departmentId, convertedProjects);
    if (departmentName) {
      this.departmentProjects.set(departmentName, convertedProjects);
      this.departmentProjects.set(departmentName.toLowerCase().trim(), convertedProjects);
    }

    // Persist changes to disk storage
    this.saveToStorage();

    // Update GMV configs if provided in level items
    levels.forEach((lvl: any) => {
      const lvlNum = Number(lvl.levelNumber);
      if (lvlNum >= 1 && lvlNum <= 12 && (lvl.promotionCeilingGmv || lvl.retentionFloorGmv)) {
        const found = this.gmvConfigs.find((g) => g.levelNumber === lvlNum);
        if (found) {
          if (lvl.promotionCeilingGmv) found.promotionCeilingGmv = Number(lvl.promotionCeilingGmv);
          if (lvl.retentionFloorGmv) found.retentionFloorGmv = Number(lvl.retentionFloorGmv);
        }
      }
    });

    // Realtime broadcast to department and global listeners
    this.realtimeEvents.emitToDepartment(departmentId, 'level:config:updated', {
      departmentId,
      departmentName,
      year,
      levels,
      projects: convertedProjects,
    });
    this.realtimeEvents.emitToRoom('level:config_room', 'level:config:updated', {
      departmentId,
      departmentName,
      year,
      levels,
      projects: convertedProjects,
    });

    return { success: true, count: convertedProjects.length, departmentName };
  }

  private findProjectList(departmentId?: string, departmentName?: string): LevelDepartmentProjectItem[] {
    if (departmentId && this.departmentProjects.has(departmentId)) {
      return this.departmentProjects.get(departmentId)!;
    }
    if (departmentName) {
      if (this.departmentProjects.has(departmentName)) {
        return this.departmentProjects.get(departmentName)!;
      }
      const lower = departmentName.toLowerCase().trim();
      if (this.departmentProjects.has(lower)) {
        return this.departmentProjects.get(lower)!;
      }
    }
    return this.projects;
  }

  public getProjects(departmentId?: string, departmentName?: string): LevelDepartmentProjectItem[] {
    const list = this.findProjectList(departmentId, departmentName);
    if (list === this.projects && departmentName && departmentName !== 'Phòng Livestream TikTok') {
      // Dynamic fallback template for specific department if not yet configured by admin
      return Array.from({ length: 8 }, (_, i) => {
        const lvlNum = i + 1;
        return {
          levelNumber: lvlNum,
          levelName: `Level ${lvlNum}`,
          departmentName: departmentName,
          projectName: `Dự Án Level ${lvlNum}: Chuyên môn & Tối ưu năng suất ${departmentName}`,
          totalSubTasks: 10,
          completedSubTasks: 0,
          rewardItem: `Thưởng & Vinh Danh Level ${lvlNum}`,
          subTasks: Array.from({ length: 10 }, (__, tIdx) => ({
            id: `st_${lvlNum}_${tIdx + 1}`,
            orderNumber: tIdx + 1,
            title: `Tiêu chuẩn nghiệp vụ số ${tIdx + 1} - Level ${lvlNum} (${departmentName})`,
            targetKpi: 'Nghiệm thu đạt chuẩn 100%',
            status: 'PENDING' as const,
          })),
        };
      });
    }
    return list;
  }

  public getProjectByLevel(
    levelNumber: number,
    departmentId?: string,
    departmentName?: string,
  ): LevelDepartmentProjectItem {
    const list = this.getProjects(departmentId, departmentName);
    const found = list.find((p) => p.levelNumber === levelNumber);
    if (!found) throw new NotFoundException(`Level ${levelNumber} project not found`);
    return found;
  }

  public assignSubTask(
    levelNumber: number,
    subTaskId: string,
    assignedUserId: string,
    assignedUserName: string,
    departmentId?: string,
    departmentName?: string,
  ) {
    const list = this.findProjectList(departmentId, departmentName);
    const project = list.find((p) => p.levelNumber === levelNumber);
    if (!project) throw new NotFoundException(`Project Level ${levelNumber} not found`);

    const subTask = project.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) throw new NotFoundException(`SubTask ${subTaskId} not found`);

    subTask.assignedUserId = assignedUserId;
    subTask.assignedUserName = assignedUserName;
    this.saveToStorage();
    return { success: true, subTask };
  }

  public submitSubTask(
    levelNumber: number,
    subTaskId: string,
    submissionNote: string,
    evidenceUrl?: string,
    evidenceImages?: string[],
    departmentId?: string,
    departmentName?: string,
  ) {
    const list = this.findProjectList(departmentId, departmentName);
    const project = list.find((p) => p.levelNumber === levelNumber);
    if (!project) throw new NotFoundException(`Project Level ${levelNumber} not found`);

    const subTask = project.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) throw new NotFoundException(`SubTask ${subTaskId} not found`);

    subTask.status = 'SUBMITTED';
    subTask.submissionNote = submissionNote;
    subTask.evidenceUrl = evidenceUrl;
    subTask.evidenceImages = evidenceImages;
    subTask.submittedAt = new Date().toISOString();
    this.saveToStorage();

    return { success: true, subTask };
  }

  public reviewSubTask(
    levelNumber: number,
    subTaskId: string,
    status: 'LEADER_APPROVED' | 'PENDING',
    reviewerName?: string,
    departmentId?: string,
    departmentName?: string,
  ) {
    const list = this.findProjectList(departmentId, departmentName);
    const project = list.find((p) => p.levelNumber === levelNumber);
    if (!project) throw new NotFoundException(`Project Level ${levelNumber} not found`);

    const subTask = project.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) throw new NotFoundException(`SubTask ${subTaskId} not found`);

    subTask.status = status;
    subTask.reviewedAt = new Date().toISOString();
    subTask.reviewedBy = reviewerName;

    // Recalculate completed count
    project.completedSubTasks = project.subTasks.filter(
      (t) => t.status === 'LEADER_APPROVED' || t.status === 'ADMIN_APPROVED',
    ).length;
    this.saveToStorage();

    return { success: true, subTask, completedSubTasks: project.completedSubTasks };
  }
}
