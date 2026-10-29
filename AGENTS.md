# Quy tắc Tối ưu Hiệu năng & Thao tác cho Agent (MovieLegend HRM)

## 1. Nguyên tắc 1 lần duy nhất (Zero Repeated Reads - Single-Shot Execution)
- **Đọc đúng 1 lần**: TUYỆT ĐỐI KHÔNG gọi `read_file` nhiều lần trên cùng một file trong cùng một lượt xử lý.
- **Định vị chính xác**: Dùng `Select-String` định vị dòng mục tiêu, chỉ đọc đúng đoạn cần sửa (tối đa 1 lần).
- **Sửa dứt điểm 1 lần (Single-Shot Edit)**:
  - Khi viết code, phải tính toán đủ TypeScript types, cú pháp, edge case ngay từ lần sửa đầu tiên.
  - Sử dụng trực tiếp `edit_file` với đoạn `Target` chuẩn xác; TUYỆT ĐỐI KHÔNG tạo script tạm/node eval lòng vòng gây lỗi escape ký tự và phải sửa lại nhiều lần.
  - CẤM cách làm thử - sai (trial-and-error) liên tục trên 1 file.

## 2. Loại bỏ Context thừa & Tối ưu tốc độ (Ultra Lean Mode)
- **Không spam build/test lắt nhắt**: Chỉ build kiểm tra sau khi đã hoàn thành toàn bộ khối công việc.
- **Không in output thừa**: Không in diff khổng lồ hay log dài dòng vào tin nhắn chat.
- **Dọn sạch rác ngay lập tức**: Xóa bỏ mọi file tạm/scratch ngay sau khi dùng xong, không để tích tụ rác trong workspace.
- **Phản hồi siêu tinh gọn**: Đi thẳng vào kết quả giải quyết bằng tiếng Việt súc tích, kèm link file cụ thể `file:///`.
