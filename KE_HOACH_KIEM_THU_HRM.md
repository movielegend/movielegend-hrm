# 📋 KẾ HOẠCH & KỊCH BẢN KIỂM THỬ (TEST PLAN)
**Hệ thống Quản lý Nhân sự & Chi tiêu (MovieLegend HRM)**
*Ngày lập: 08/10/2026*

---

## I. MỤC TIÊU KIỂM THỬ
Xác nhận tính đúng đắn, mượt mà và an toàn của các luồng nghiệp vụ mới được nâng cấp:
1. **Đơn thanh toán (`EXPENSE`)**: Phân luồng kiểm soát $\le$ 2 triệu, > 2 triệu có/không VAT, tính năng 3 nút lựa chọn và cơ chế upload ảnh bill giải ngân.
2. **Đơn mua hàng (`PURCHASE`)**: Form rút gọn (chỉ tên sản phẩm, số lượng, ngày cần, lý do), quy trình duyệt 3 bên (Leader $\rightarrow$ Kế toán $\rightarrow$ HR), và luồng HR mua hàng tạo yêu cầu thanh toán chuyển tiếp.
3. **Phân quyền & Hiển thị phòng ban**: Leader Kế toán (Kế toán trưởng), Kế toán viên (chỉ xem), Leader các bộ phận khác.
4. **Báo cáo & Xuất file Excel giao dịch**: Đầy đủ 13 cột thông tin, chuẩn hóa tên người đề xuất, trưởng bộ phận duyệt, người cập nhật và Hyperlink mở trực tiếp ảnh bill đính kèm.

---

## II. MA TRẬN PHÂN QUYỀN (ROLE & PERMISSION MATRIX)

| Nghiệp vụ / Vai trò | Nhân viên | Leader phòng ban khác | Kế toán viên | Kế toán trưởng (Leader KT) | Ban Giám Đốc (Admin) | Phòng HR / HCNS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tạo đơn Thanh toán / Mua hàng** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Xem đơn toàn công ty** | ❌ (Chỉ xem đơn mình) | ❌ (Chỉ xem phòng ban mình) | ✅ (Toàn công ty) | ✅ (Toàn công ty) | ✅ (Toàn công ty) | ✅ (Đơn mua hàng PENDING_HR) |
| **Duyệt đơn phòng ban** | ❌ | ✅ (Bước 1) | ❌ | ✅ | ✅ | ❌ |
| **Duyệt & Giải ngân (Kèm upload Bill)** | ❌ | ❌ | ❌ (Chỉ xem) | ✅ | ✅ | ❌ |
| **Duyệt chuyển Ban Giám Đốc** | ❌ | ❌ | ❌ | ✅ (Đơn > 2tr ko VAT) | N/A | ❌ |
| **Tạo yêu cầu thanh toán sau mua hàng** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Tại đơn PENDING_HR_PURCHASE) |
| **Xuất Excel giao dịch trong ngày** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## III. KỊCH BẢN KIỂM THỬ CHI TIẾT (TEST CASES)

### 📌 PHẦN 1: ĐƠN THANH TOÁN (`EXPENSE`)

#### 🧪 Test Case 1.1: Đơn thanh toán $\le$ 2 triệu (hoặc Có hóa đơn VAT)
* **Tiền đề:** Nhân viên A thuộc bộ phận Kỹ thuật tạo đơn.
* **Dữ liệu đầu vào:**
  - Loại đơn: `Đề xuất thanh toán` (`EXPENSE`)
  - Số tiền: `1.200.000 VNĐ`
  - Hóa đơn VAT: `Không có VAT` (hoặc `Có VAT` với số tiền bất kỳ)
  - Lý do: *"Thanh toán tiền mua vật tư linh kiện sửa chữa"*
  - Đính kèm: 1 ảnh hóa đơn mua hàng.
* **Các bước thực hiện & Kết quả mong đợi:**
  1. **Bước 1 (Nhân viên):** Nhân viên A bấm gửi đơn $\rightarrow$ Hệ thống tạo đơn thành công, trạng thái hiển thị: `PENDING_LEADER` (Chờ Trưởng bộ phận duyệt).
  2. **Bước 2 (Leader):** Trưởng bộ phận Kỹ thuật đăng nhập $\rightarrow$ Thấy đơn trong danh sách chờ $\rightarrow$ Bấm **Duyệt** $\rightarrow$ Trạng thái chuyển sang `PENDING_ACCOUNTANT` (Chờ Kế toán duyệt).
  3. **Bước 3 (Kế toán trưởng):** Kế toán trưởng mở đơn:
     - Giao diện hiển thị 2 nút: **[Duyệt & Giải ngân]** và **[Từ chối]**.
     - Bấm **Duyệt & Giải ngân** $\rightarrow$ Popup tải ảnh bill chuyển khoản hiện lên.
     - Chọn ảnh biên lai chuyển khoản $\rightarrow$ Bấm Xác nhận.
  4. **Kết quả cuối:** Đơn chuyển sang `APPROVED` (Đã thanh toán). Thông tin người giải ngân, ngày giờ và ảnh bill được lưu đầy đủ.

---

#### 🧪 Test Case 1.2: Đơn thanh toán > 2 triệu & KHÔNG VAT $\rightarrow$ Luồng 3 Nút (Duyệt chờ thanh toán)
* **Tiền đề:** Nhân viên A tạo đơn số tiền lớn không có VAT.
* **Dữ liệu đầu vào:**
  - Loại đơn: `Đề xuất thanh toán` (`EXPENSE`)
  - Số tiền: `5.000.000 VNĐ`
  - Hóa đơn VAT: `Không có VAT`
  - Đính kèm: Ảnh chứng từ hóa đơn bán lẻ.
* **Các bước thực hiện & Kết quả mong đợi:**
  1. **Bước 1 (Leader duyệt):** Leader duyệt thông qua $\rightarrow$ Đơn chuyển về `PENDING_ACCOUNTANT`.
  2. **Bước 2 (Kế toán trưởng kiểm tra giao diện 3 nút):**
     - Mở chi tiết đơn $\rightarrow$ Giao diện hiển thị đầy đủ **3 nút**:
       - 🔴 **[Từ chối]**
       - 🟡 **[Duyệt chờ TT]** (Chuyển Ban Giám Đốc)
       - 🟢 **[Duyệt & Giải ngân]** (Kế toán tự chi)
  3. **Bước 3 (Kế toán chọn Duyệt chờ TT):**
     - Kế toán bấm **[Duyệt chờ TT]** $\rightarrow$ Trạng thái đơn chuyển ngay sang **`PENDING_ADMIN`** (Chờ Ban Giám Đốc duyệt).
  4. **Bước 4 (Ban Giám Đốc / Admin xử lý):**
     - Tài khoản Admin/Ban Giám Đốc đăng nhập $\rightarrow$ Thấy đơn trong danh sách chờ duyệt.
     - Admin bấm **[Duyệt & Giải ngân]** $\rightarrow$ Chọn ảnh bill chuyển khoản và ấn Xác nhận.
  5. **Kết quả cuối:** Đơn chuyển sang `APPROVED` (Đã thanh toán).

---

#### 🧪 Test Case 1.3: Đơn thanh toán > 2 triệu & KHÔNG VAT $\rightarrow$ Kế toán duyệt & giải ngân trực tiếp
* **Các bước thực hiện & Kết quả mong đợi:**
  1. Kế toán trưởng mở đơn > 2tr không VAT.
  2. Kế toán trưởng bấm trực tiếp **[Duyệt & Giải ngân]** $\rightarrow$ Tải ảnh bill chuyển khoản $\rightarrow$ Xác nhận.
  3. **Kết quả:** Đơn hoàn tất ngay sang `APPROVED`, không cần chuyển qua Admin.

---

#### 🧪 Test Case 1.4: Từ chối đơn thanh toán
* **Các bước thực hiện & Kết quả mong đợi:**
  1. Leader / Kế toán / Admin bấm nút **[Từ chối]** tại bất kỳ bước nào.
  2. Modal hiện lên bắt buộc nhập **Lý do từ chối** (không cho để trống).
  3. Bấm Xác nhận từ chối $\rightarrow$ Trạng thái đơn chuyển sang `REJECTED`, hiển thị lý do từ chối rõ ràng cho người tạo đơn.

---

### 📌 PHẦN 2: ĐƠN MUA HÀNG (`PURCHASE`)

#### 🧪 Test Case 2.1: Giao diện tạo đơn mua hàng rút gọn
* **Người thực hiện:** Nhân viên bất kỳ.
* **Kiểm tra giao diện:**
  - Chọn Loại đơn: `Đề xuất mua hàng` (`PURCHASE`).
  - ✅ **Hiển thị đúng 4 trường:**
    1. *Tên sản phẩm / vật tư cần mua* (Ví dụ: `Bàn phím cơ & Chuột không dây Logitech`)
    2. *Số lượng* (Ví dụ: `2 bộ`)
    3. *Ngày cần có* (Ví dụ: `15/10/2026`)
    4. *Lý do đề xuất* (Ví dụ: `Cấp mới cho nhân sự thử việc phòng Dev`)
  - ❌ **Không hiển thị:** Không có ô nhập số tiền và không yêu cầu upload ảnh minh chứng.
* **Kết quả:** Bấm Gửi $\rightarrow$ Đơn tạo thành công ở trạng thái `PENDING_LEADER`.

---

#### 🧪 Test Case 2.2: Luồng duyệt đơn mua hàng (Leader $\rightarrow$ Kế toán $\rightarrow$ HR)
* **Các bước thực hiện & Kết quả mong đợi:**
  1. **Leader duyệt:** Leader mở đơn $\rightarrow$ Thấy rõ thông tin sản phẩm, số lượng, ngày cần $\rightarrow$ Bấm **[Duyệt]** $\rightarrow$ Đơn chuyển sang `PENDING_ACCOUNTANT`.
  2. **Kế toán duyệt:**
     - Kế toán trưởng mở đơn mua hàng $\rightarrow$ Thấy nút **[Duyệt đề xuất]** (Không yêu cầu nhập tiền hay up bill).
     - Bấm **Duyệt đề xuất** $\rightarrow$ Trạng thái đơn chuyển thành **`PENDING_HR_PURCHASE`** (Chờ HR mua hàng).
     - **Kiểm tra thông báo:** Hệ thống tự động push notification đến toàn bộ nhân sự phòng ban **HR / HCNS**.

---

#### 🧪 Test Case 2.3: HR mua hàng & Tạo yêu cầu thanh toán
* **Người thực hiện:** Nhân viên HR (Ví dụ: `HR Linh`).
* **Các bước thực hiện & Kết quả mong đợi:**
  1. HR Linh đăng nhập $\rightarrow$ Mở đơn mua hàng đang ở trạng thái `PENDING_HR_PURCHASE`.
  2. **Kiểm tra giao diện:**
     - Hiển thị Action Card nổi bật: **"Tạo yêu cầu thanh toán (Đã mua hàng)"**.
     - HR Linh bấm vào nút này $\rightarrow$ Modal hiện lên cho phép nhập:
       - *Số tiền thực tế đã mua* (Ví dụ: `1.850.000 VNĐ`)
       - *Tình trạng hóa đơn* (Chọn `Có VAT` hoặc `Không có VAT`)
       - *Ảnh hóa đơn / chứng từ thanh toán* (Bắt buộc)
       - *Ghi chú bổ sung* (Ví dụ: `Đã mua tại Phong Vũ`)
     - Bấm **Xác nhận**.
  3. **Kiểm tra đơn thanh toán mới sinh ra:**
     - Hệ thống tự động tạo 1 đơn đề xuất thanh toán (`EXPENSE`) mới.
     - **Người đề xuất (`userId`):** Chính là **Nhân viên tạo đơn mua ban đầu** (Ví dụ: Dev A).
     - **Người cập nhật (`purchasedByHrName`):** Là **`HR Linh`**.
     - **Nội dung:** `[Thanh toán mua hàng: Bàn phím cơ & Chuột không dây Logitech] Cấp mới cho nhân sự thử việc phòng Dev (SL: 2 bộ - Mua bởi: HR Linh)`.
     - **Trạng thái:** Chuyển thẳng về `PENDING_ACCOUNTANT` để Kế toán trưởng giải ngân.

---

### 📌 PHẦN 3: KIỂM THỬ XUẤT BÁO CÁO EXCEL GIAO DỊCH

#### 🧪 Test Case 3.1: Xuất file Excel và kiểm tra cấu trúc 13 cột
* **Thao tác:** Kế toán trưởng vào màn hình Quản lý $\rightarrow$ Bấm **Xuất Excel giao dịch** $\rightarrow$ Chọn ngày $\rightarrow$ Tải file `.xlsx`.
* **Kiểm tra Header và dữ liệu các cột:**

| Cột | Tên Cột Excel | Dữ liệu kiểm tra | Kết quả mong đợi |
| :---: | :--- | :--- | :--- |
| **A** | `Ngày` | Ngày duyệt / tạo đơn | Định dạng `DD/MM/YYYY` |
| **B** | `Người đề xuất` | Tên nhân viên yêu cầu | Hiển thị đúng tên nhân viên tạo đơn ban đầu |
| **C** | `Trưởng bộ phận đề xuất` | Tên Leader | Hiển thị đúng tên Leader đã duyệt bước 1 |
| **D** | `Nội dung đề xuất` | Nội dung / Tên sản phẩm | Thể hiện đầy đủ nội dung yêu cầu |
| **E** | `Xác nhận đề xuất` | Trạng thái xác nhận | `ok` / `Đã duyệt` |
| **F** | `Số tiền theo hóa đơn` | Số tiền VNĐ | Định dạng số tiền (VD: `30,000`, `1,850,000`) |
| **G** | `Hóa đơn VAT` | Loại hóa đơn | `Có VAT` / `Không có VAT` |
| **H** | `Trạng thái` | Trạng thái thanh toán | `Đã thanh toán` / `Chờ thanh toán` / `Từ chối` |
| **I** | `Người cập nhật` | Người xử lý cuối | Tên Kế toán trưởng hoặc tên HR (đối với đơn HR mua) |
| **J** | `Ghi chú` | Ghi chú đơn / Lý do từ chối | Chuỗi văn bản ghi chú |
| **K** | `Công ty` | Tên chi nhánh / công ty | Tên chi nhánh của nhân viên |
| **L** | `Kế Toán Check` | Tên kế toán kiểm tra | Tên Kế toán viên / Kế toán trưởng check |
| **M** | `Chứng từ / Bill đính kèm` | Hyperlink ảnh bill | Chữ xanh gạch chân **`Xem ảnh Bill 🔗`** |

---

#### 🧪 Test Case 3.2: Kiểm tra liên kết mở ảnh Bill (`Hyperlink`)
* **Thao tác:** Mở file Excel vừa tải $\rightarrow$ Tìm dòng có đơn đã giải ngân $\rightarrow$ Nhấp chuột vào link **`Xem ảnh Bill 🔗`** ở Cột M.
* **Kết quả mong đợi:** Trình duyệt mặc định tự động mở URL ảnh bill và hiển thị sắc nét hình ảnh biên lai thanh toán.

---

## IV. BẢNG TỔNG HỢP THEO DÕI KIỂM THỬ (CHECKLIST)

| ID | Hạng mục kiểm tra | Tester | Môi trường | Kết quả (PASS/FAIL) | Ghi chú |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **TC-01** | Đơn $\le$ 2tr: Leader duyệt $\rightarrow$ Kế toán duyệt & up bill thành công | Automated Suite | Local NeonDB | ✅ PASS | Đã verify status `APPROVED` & lưu bill |
| **TC-02** | Đơn > 2tr không VAT: Hiển thị đúng 3 nút thao tác & duyệt chờ TT chuyển Ban Giám Đốc | Automated Suite | Local NeonDB | ✅ PASS | Chuyển đúng `PENDING_ADMIN` |
| **TC-03** | Đơn > 2tr không VAT: Ban Giám Đốc (Admin) duyệt & up bill giải ngân | Automated Suite | Local NeonDB | ✅ PASS | Đã verify status `APPROVED` & lưu bill |
| **TC-04** | Đơn > 2tr không VAT: Kế toán bấm Duyệt & Giải ngân trực tiếp kèm up bill | Automated Suite | Local NeonDB | ✅ PASS | Hoàn tất giải ngân tại chỗ |
| **TC-05** | Form Đơn Mua Hàng: Chỉ 4 trường, không có số tiền & không bắt buộc ảnh | Automated Suite | Local NeonDB | ✅ PASS | Đúng metadata `itemName`, `quantity` |
| **TC-06** | Đơn Mua Hàng: Leader duyệt $\rightarrow$ Kế toán duyệt $\rightarrow$ Đổi sang `PENDING_HR_PURCHASE` | Automated Suite | Local NeonDB | ✅ PASS | Trạng thái chuyển đúng luồng |
| **TC-07** | Đơn Mua Hàng: Tự động bắn thông báo cho phòng ban HR/HCNS | Automated Suite | Local NeonDB | ✅ PASS | Đã push notification đến HR |
| **TC-08** | HR mua hàng: Bấm tạo yêu cầu thanh toán $\rightarrow$ Điền tiền, VAT, ảnh bill | Automated Suite | Local NeonDB | ✅ PASS | Tạo thành công đơn `EXPENSE` |
| **TC-09** | Đơn thanh toán sinh ra từ HR: Mang tên nhân viên đề xuất ban đầu & người cập nhật là HR | Automated Suite | Local NeonDB | ✅ PASS | `userId` = Requester, `purchasedByHrName` = HR |
| **TC-10** | Phân quyền: Kế toán xem được danh sách đơn toàn công ty | Automated Suite | Local NeonDB | ✅ PASS | Query toàn bộ công ty thành công |
| **TC-11** | Phân quyền: Leader phòng ban khác chỉ thấy đơn phòng ban mình | Automated Suite | Local NeonDB | ✅ PASS | Đã cô lập phạm vi phòng ban |
| **TC-12** | Xuất Excel: Đầy đủ 13 cột (có Người đề xuất, Trưởng bộ phận, Người cập nhật) | Automated Suite | Local NeonDB | ✅ PASS | Đúng 13 cột chuẩn theo mẫu |
| **TC-13** | Xuất Excel: Link `Xem ảnh Bill 🔗` click mở được ảnh trực tiếp | Automated Suite | Local NeonDB | ✅ PASS | Format Hyperlink URL chuẩn |
