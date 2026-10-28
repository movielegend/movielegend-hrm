# Specification: Chuyển Đổi Quản Trị Giao Diện Cổng Tuyển Dụng Thành Tab Toàn Màn Hình

**Tài liệu Đặc tả Kỹ thuật (Spec-Driven Development)**  
**Dự án**: MovieLegend HRM (`movielegend-hrm-web` & `movielegend-hrm-backend` & `movielegend-hr`)  
**Trạng thái**: Chờ duyệt (Pending Approval)  
**Tác giả**: Antigravity Pair Programmer  

---

## 1. Objective (Mục tiêu & Phạm vi)

### Bối cảnh
Trước đây, cấu hình hình ảnh và banner cho Cổng tuyển dụng nằm rải rác trong `RecruitmentCategoriesModal` và sau đó được gom vào modal popup `LandingPageConfigModal`. Tuy nhiên, việc quản trị hàng chục hình ảnh độ phân giải cao (Hero 4K, tiện ích, gallery, dòng lịch sử, trụ cột, showcase) trong một cửa sổ modal nhỏ hẹp gây bất tiện, khó quan sát tổng thể và dễ bị cuộn lồng.

### Mục tiêu
1. **Loại bỏ hoàn toàn modal popup** đối với tính năng quản trị giao diện Cổng tuyển dụng.
2. **Tạo Tab chính thứ 3** toàn trang trên thanh điều hướng của trang Tuyển dụng (`RecruitmentDashboard.tsx`), đặt ngay cạnh tab **"Hồ sơ ứng viên"**.
3. **Đảm bảo không bỏ sót bất kỳ thành phần nào** của Cổng tuyển dụng:
   - **Mục 1: Trang Chủ Tuyển Dụng**: Hero Banner chính (kèm ô tìm kiếm) & Slider Banner "Cơ hội đặc biệt".
   - **Mục 2: Trang Khám Phá (`#discover`)**: Hero Banner 4K, 4 thẻ tiện ích không gian làm việc, Thư viện Gallery (8 ảnh với 3 danh mục workplace/lifestyle/cinema, tag, mô tả).
   - **Mục 3: Trang Về Movie Legend (`#about`)**: Hero Banner 4K, Tầm nhìn & Sứ mệnh, 5 mốc lịch sử (2020–2026), 4 Trụ cột sản phẩm, 3 Showcase rạp phim thực tế.
4. **Trải nghiệm người dùng cao cấp**: Khung xem trước ảnh lớn, tải ảnh trực tiếp từ máy (tối đa 5MB) hoặc dán URL, chọn nhanh từ thư viện ảnh mẫu Movie Legend, thông báo trạng thái rõ ràng và lưu thay đổi theo từng trang.

---

## 2. Tech Stack & Environment

- **Frontend Admin**: Next.js 14 / React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend API**: NestJS, TypeScript, Storage JSON engine (`storage/*.json`).
- **Careers Portal**: React 18 + Vite, Tailwind CSS, TypeScript.

---

## 3. Commands

- **Kiểm tra TypeScript Web**:
  ```bash
  npx --prefix "c:\movielegend-hrm\movielegend-hrm-web" tsc --project tsconfig.json --noEmit
  ```
- **Biên dịch Backend**:
  ```bash
  npm --prefix "c:\movielegend-hrm\movielegend-hrm-backend" run build
  ```
- **Biên dịch Cổng Tuyển Dụng**:
  ```bash
  npm --prefix "C:\movielegend-hr" run build
  ```

---

## 4. Project Structure & File Map

```
c:\movielegend-hrm\
├── movielegend-hrm-web\
│   └── src\
│       ├── components\recruitment\
│       │   ├── RecruitmentDashboard.tsx       → Thêm tab 'landing-page' cạnh 'applications'
│       │   ├── LandingPageConfigView.tsx      → Component to toàn màn hình thay thế modal
│       │   └── LandingPageConfigModal.tsx     → Xóa bỏ (loại bỏ hoàn toàn modal)
│       └── lib\actions\recruitment.ts         → Duy trì các Server Actions đã tạo
├── movielegend-hrm-backend\
│   └── src\modules\recruitment\
│       ├── recruitment.service.ts             → Đã sẵn sàng (GET/PUT discover & about)
│       ├── recruitment-admin.controller.ts    → Đã sẵn sàng
│       └── recruitment-public.controller.ts   → Đã sẵn sàng
└── C:\movielegend-hr\
    └── src\components\
        ├── DiscoverPage.tsx                   → Đã kết nối dữ liệu động từ API
        └── AboutPage.tsx                      → Đã kết nối dữ liệu động từ API
```

---

## 5. Detailed Component Specification (`LandingPageConfigView.tsx`)

### Bố cục Tab Bar chính (`RecruitmentDashboard.tsx`)
```tsx
<div className="flex items-center gap-6">
  <button onClick={() => setActiveTab('jobs')}>Tin tuyển dụng ({jobs.length})</button>
  <button onClick={() => setActiveTab('applications')}>Hồ sơ ứng viên</button>
  <button onClick={() => setActiveTab('landing-page')}>
    <LayoutTemplate size={16} />
    <span>Giao diện Cổng Tuyển Dụng</span>
  </button>
</div>
```

### Bố cục bên trong `LandingPageConfigView.tsx`:
1. **Header**: Tiêu đề trang, icon `LayoutTemplate`, nút tải lại dữ liệu `RefreshCw`, badge trạng thái.
2. **Sub-tabs chuyển đổi giữa 3 trang**:
   - `[Trang Chủ]` | `[Trang Khám Phá (#discover)]` | `[Trang Về Movie Legend (#about)]`
3. **Chi tiết đầy đủ không thiếu mục nào**:
   - **Tab Trang Chủ**:
     - *Hero Banner*: Ảnh nền, Tiêu đề lớn, Eyebrow, Mô tả phụ, nút tải ảnh từ máy, chọn ảnh mẫu gợi ý, khung xem trước khổ lớn.
     - *Slider Cơ hội đặc biệt*: Danh sách banner slider, nút Thêm banner, Sửa, Xóa, Bật/Ẩn, Form nhập tiêu đề, tag, ảnh banner, mô tả phụ.
   - **Tab Trang Khám Phá (`#discover`)**:
     - *Hero Banner 4K*: Ảnh nền 4K, Tiêu đề, Mô tả phụ, tải ảnh, xem trước.
     - *4 Thẻ tiện ích không gian làm việc*: Phòng chiếu 150" rạp phim, Văn phòng mở, Quầy cà phê & Pantry, Showroom Flagship (mỗi thẻ có Tiêu đề, Mô tả chi tiết, Ảnh, Tải ảnh).
     - *Thư viện Gallery (8 ảnh)*: Danh sách thẻ ảnh, Phân loại category (`workplace`, `lifestyle`, `cinema`), Thẻ Tag, Tiêu đề, Mô tả, Tải ảnh, nút Thêm ảnh gallery mới và Xóa ảnh.
   - **Tab Trang Về Movie Legend (`#about`)**:
     - *Hero Banner 4K*: Ảnh nền 4K, Tiêu đề lớn, Mô tả phụ, tải ảnh, xem trước.
     - *Tầm nhìn & Sứ mệnh*: 2 khối riêng biệt, mỗi khối có Ảnh minh họa, Tag không gian, Tiêu đề, Mô tả đầy đủ, Dòng cam kết phụ.
     - *5 Mốc lịch sử phát triển*: Năm 2020, 2022, 2024, 2025, 2026 (Năm, Tiêu đề mốc, Nội dung chi tiết, Ảnh minh họa, Tải ảnh).
     - *4 Trụ cột sản phẩm*: Máy chiếu Laser 4K, Màn quang học ALR, Âm thanh Dolby Atmos, Thi công & Phụ kiện (Tiêu đề, Mô tả, Ảnh, Tải ảnh).
     - *3 Showcase không gian thực tế*: Penthouse Master, Căn hộ cao cấp, Villa dã ngoại (Tag, Tiêu đề, Ảnh, Tải ảnh).
4. **Hành động & Phản hồi**:
   - Nút **"Lưu Thay Đổi Trang"** nổi bật kèm icon `Check`, trạng thái `Đang lưu...`, tự động khóa form khi đang gửi API.
   - Toast thông báo thành công hoặc thông báo lỗi trực quan.

---

## 6. Boundaries (Giới hạn thực hiện)

- **Always do**:
  - Giữ nguyên cấu trúc dữ liệu và API đã xây dựng tại backend.
  - Tự động fallback về bộ ảnh mặc định chuẩn studio nếu API chưa có dữ liệu.
  - Xác thực kiểu dữ liệu TypeScript nghiêm ngặt, không dùng `any` bừa bãi.
  - Xóa sạch file modal cũ không còn sử dụng để tránh dư thừa mã nguồn.
- **Ask first**:
  - Không thay đổi cấu trúc database hay sửa các module nhân sự khác ngoài module recruitment.
- **Never do**:
  - Không được bỏ sót bất kỳ khối nội dung hay hình ảnh nào của 2 tab Discover và About.
  - Không làm gián đoạn hiển thị của Cổng tuyển dụng public (`movielegend-hr`).

---

## 7. Reframed Success Criteria (Tiêu chí Nghiệm thu Thành công)

1. **Vị trí Tab**: Tab **"Giao diện Cổng Tuyển Dụng"** xuất hiện ngay cạnh tab **"Hồ sơ ứng viên"** trên thanh tab chính của Tuyển dụng. Khi click vào, chuyển tab mượt mà không mở bất kỳ popup/modal nào.
2. **Đầy đủ 100% nội dung**:
   - Trang chủ có đủ Hero Banner và Slider Cơ hội đặc biệt.
   - Trang Khám phá có đủ Hero 4K, 4 tiện ích không gian, Thư viện Gallery (8 ảnh).
   - Trang Về Movie Legend có đủ Hero 4K, Tầm nhìn - Sứ mệnh, 5 Milestones, 4 Trụ cột, 3 Showcases.
3. **Thao tác tải ảnh**: Có thể bấm "Tải ảnh từ máy" chọn file ảnh (.png, .jpg) hoặc nhập URL, ảnh lập tức hiển thị xem trước.
4. **Lưu & Đồng bộ**: Nhấn nút "Lưu Thay Đổi", dữ liệu gửi lên backend thành công; F5 hoặc mở tab `#discover` / `#about` trên cổng ứng viên (`localhost:5173`) thấy ảnh mới được cập nhật ngay lập tức.
5. **Chất lượng mã nguồn**: `npx tsc --noEmit` và `npm run build` đạt kết quả exit code 0 trên cả 3 dự án.

---

## 8. Assumptions Surfaced
1. Giao diện toàn trang được thiết kế responsive trên container chuẩn của trang Tuyển dụng (`max-w-7xl mx-auto`).
2. Nút nhỏ "Cấu hình Giao diện Cổng" mở modal cũ ở góc trên bên phải thanh công cụ sẽ được gỡ bỏ vì đã có tab to chính thức.
3. Dung lượng ảnh tải lên trực tiếp từ máy tính giới hạn tối đa 5MB/ảnh để tối ưu tốc độ đường truyền.

---

## 9. Open Questions (Câu hỏi mở)
- *Hiện không có câu hỏi mở kỹ thuật nào còn vướng mắc; toàn bộ luồng dữ liệu backend và frontend đã được kết nối thông suốt.*
