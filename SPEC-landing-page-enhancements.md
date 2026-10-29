# Đặc Tả Kỹ Thuật (SPEC): Nâng Cấp Quản Trị Giao Diện Cổng Tuyển Dụng

> **Tài liệu đặc tả (SPEC) theo chuẩn Spec-Driven Development**  
> **Phiên bản:** 1.1.0  
> **Ngày tạo:** 28/10/2026  
> **Mục tiêu:** Hoàn thiện trải nghiệm quản trị giao diện tuyển dụng: bổ sung nhập chữ, thêm mới/xóa động, tách khối showcase độc lập, chuyển nút Lưu lên thanh trên cùng.

---

## 1. Giả định ban đầu (Assumptions)

1. **Khả năng co giãn (Dynamic Lists)**: Tiện ích không gian (`amenities`), Trụ cột giải pháp (`pillars`), và Showcase rạp phim (`showcases`) sẽ là danh sách mảng động (cho phép thêm mới, chỉnh sửa và xóa phần tử) thay vì bị cố định số lượng 4 hay 3 như trước.
2. **Tiêu đề section tùy biến**: Khối "Trụ cột giải pháp" và "Showcase rạp phim" sẽ lưu thêm cấu hình tiêu đề/mô tả section (`pillarsSection`, `showcasesSection`) và đồng bộ xuống Cổng tuyển dụng public `movielegend-hr`. Nếu không nhập, hệ thống sẽ tự dùng giá trị mặc định của thương hiệu.
3. **Vị trí nút Lưu**: Nút "Lưu Thay Đổi" được đưa lên thanh sticky bar ở trên cùng của giao diện tab (cạnh thanh chọn Sub-tab hoặc ngay đầu form), giúp admin bấm lưu bất cứ lúc nào mà không cần cuộn chuột xuống đáy trang. Nút lưu đơn lẻ ở cuối trang được xóa bỏ.
4. **Trụ cột giải pháp (Pillars)**: Cần có đầy đủ 3 trường: Ảnh minh họa, Tiêu đề (`title`), và Mô tả chi tiết (`description`) tương ứng với giao diện hiển thị trên trang public.

---

## 2. Mục tiêu (Objective)

Nâng cấp giao diện quản trị cổng tuyển dụng (`LandingPageConfigView.tsx`):
- **User**: Ban quản trị nhân sự / Marketing Movie Legend.
- **Vấn đề giải quyết**:
  - Khắc phục việc thiếu ô nhập text cho 4 Trụ cột giải pháp.
  - Tách rời "Trụ cột giải pháp" và "Showcase rạp phim" thành 2 khối độc lập, có tiêu đề và mô tả riêng.
  - Cho phép thêm mới và xóa item linh hoạt ở tất cả các khu vực (Tiện ích, Trụ cột, Showcase).
  - Tối ưu UX cuộn trang: đặt nút Lưu ở thanh trên cùng, loại bỏ nút lưu dưới đáy.
- **Tiêu chuẩn hoàn thành**:
  - Admin sửa ảnh + tiêu đề + mô tả ở admin, bấm Lưu ở thanh trên cùng -> API lưu thành công -> Cổng `http://localhost:5173` hiển thị chính xác 100%.

---

## 3. Lệnh thực thi & Kiểm tra (Commands)

```bash
# Backend build & verify
cd c:\movielegend-hrm\movielegend-hrm-backend
npm run build

# Web Admin build & typecheck
cd c:\movielegend-hrm\movielegend-hrm-web
npx tsc --noEmit

# Public Careers Portal build & verify
cd c:\movielegend-hr
npm run build
```

---

## 4. Cấu trúc Dự án & File liên quan (Project Structure)

| Repository / Module | File đường dẫn | Vai trò |
|---|---|---|
| **Web Admin** | `movielegend-hrm-web/src/components/recruitment/LandingPageConfigView.tsx` | Component chính quản trị 3 sub-tab, bổ sung nút thêm mới, ô nhập chữ, tách section, nút lưu trên đầu |
| **Web Actions** | `movielegend-hrm-web/src/lib/actions/recruitment.ts` | Interface TypeScript & Server Actions gọi backend |
| **Backend Service** | `movielegend-hrm-backend/src/modules/recruitment/recruitment.service.ts` | Cập nhật cấu trúc lưu trữ JSON cho `pillarsSection`, `showcasesSection`, mảng động |
| **Careers Portal** | `movielegend-hr/src/components/AboutPage.tsx` | Nhận và render tiêu đề section tùy biến và danh sách động |
| **Careers Portal** | `movielegend-hr/src/components/DiscoverPage.tsx` | Nhận và render danh sách tiện ích động |

---

## 5. Yêu cầu chi tiết & User Stories (Core Requirements)

### 5.1. Nút Lưu Thay Đổi trên thanh công cụ (Sticky Top Save Action)
- **Vị trí**: Nằm ở thanh sub-tab bar trên cùng hoặc đầu mỗi sub-tab, cố định hoặc luôn dễ thấy.
- **Trạng thái**:
  - Bình thường: Nút nổi bật (màu xanh thương hiệu Movie Legend `#102739` hoặc `#0052CC`), icon `<Save size={16} />` hoặc `<Check size={16} />`.
  - Đang lưu (`saving`): Icon spinner quay `<RefreshCw className="animate-spin" />`, text "Đang lưu...", disable nút để tránh spam.
  - Thành công: Hiển thị thông báo Toast góc màn hình và cập nhật trạng thái đã lưu.
- **Loại bỏ**: Xóa các nút "Lưu thay đổi..." ở tận đáy trang để người dùng không phải cuộn.

### 5.2. Tab Khám Phá (`#discover`): Nút thêm mới Tiện ích Không gian
- Hiện tại có 4 thẻ cố định.
- **Bổ sung**: Nút `+ Thêm tiện ích mới` ở header của khối.
- Khi bấm: Mở form thêm mới hoặc chèn thẻ mới vào danh sách (Tiêu đề, Mô tả, Tải ảnh base64/preset).
- Từng thẻ tiện ích có nút Thùng rác (Xóa thẻ) kèm xác nhận.

### 5.3. Tab Về Movie Legend (`#about`): Ô nhập chữ cho Trụ cột giải pháp
- Hiện tại chỉ có ảnh và tiêu đề cố định.
- **Bổ sung**:
  - Ô nhập `<input>` chỉnh sửa Tiêu đề trụ cột (`title`).
  - Ô nhập `<textarea>` chỉnh sửa Mô tả chi tiết trụ cột (`description`).
  - Nút `+ Thêm trụ cột mới` ở header của khối.
  - Nút Xóa trụ cột cho từng phần tử.

### 5.4. Tab Về Movie Legend (`#about`): Tách Showcase thành Khối riêng biệt
- **Khối 1: Hệ Sinh Thái Sản Phẩm (Trụ Cột Giải Pháp)**:
  - Header khối: Ô nhập Tiêu đề khối (mặc định: "Giải Pháp Trọn Gói Rạp Phim Tại Gia") & Mô tả phụ đề khối.
  - Nút `+ Thêm trụ cột`.
  - Danh sách các trụ cột sản phẩm.
- **Khối 2: Showcase Không Gian Thực Tế (Tách riêng độc lập)**:
  - Header khối: Ô nhập Tiêu đề khối (mặc định: "Từ Bản Vẽ Đến Không Gian Thực Tế") & Mô tả phụ đề khối.
  - Nút `+ Thêm không gian showcase`.
  - Danh sách các showcase: Ảnh công trình, Thẻ vị trí (`tag`, ví dụ "Penthouse Master"), Tên công trình (`title`, ví dụ "Rạp Chiếu 150 inch ALR"), nút Đổi ảnh, nút Xóa.

---

## 6. Tiêu chí Chấp Nhận & Kiểm Thử (Acceptance Criteria)

- [ ] **AC-1**: Nút "Lưu Thay Đổi" hiển thị ở thanh trên cùng của mỗi tab (Khám Phá, Về Movie Legend, Trang Chủ). Không còn nút lưu ở đáy trang.
- [ ] **AC-2**: Bấm lưu ở trên đầu lưu thành công toàn bộ dữ liệu của tab hiện tại, hiển thị Toast báo thành công.
- [ ] **AC-3**: Tab Khám Phá có nút `+ Thêm tiện ích mới`, cho phép nhập tiêu đề, mô tả, tải ảnh và xóa tiện ích.
- [ ] **AC-4**: Tab Về Movie Legend có đầy đủ ô nhập Tiêu đề & Mô tả cho từng Trụ cột giải pháp; có nút `+ Thêm trụ cột mới` và nút Xóa.
- [ ] **AC-5**: Tab Về Movie Legend đã tách hoàn toàn "Showcase Không Gian Thực Tế" thành khối riêng với tiêu đề khối, phụ đề khối, nút `+ Thêm showcase` và nút Xóa.
- [ ] **AC-6**: Dữ liệu lưu xuống backend được phản ánh chính xác 100% trên cả 2 trang public `http://localhost:5173/#discover` và `http://localhost:5173/#about`.
- [ ] **AC-7**: Tất cả các project (`movielegend-hrm-web`, `movielegend-hrm-backend`, `movielegend-hr`) build thành công với exit code 0.
