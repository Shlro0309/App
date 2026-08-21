# Bộ diagram Cyber Game Management

Bộ tài liệu này phản ánh các chức năng tiêu biểu đang có trong code. Các thao tác phổ biến như tìm kiếm, phân trang, validation và CRUD chi tiết được gộp vào use case nghiệp vụ tương ứng.

## Tác nhân

| Tác nhân | Vai trò |
| --- | --- |
| Khách hàng | Gộp khách chưa đăng nhập và khách đã đăng nhập; đặt máy, check-in, chơi, gọi dịch vụ và thanh toán |
| Nhân viên | Vận hành hoạt động hằng ngày của phòng máy |
| Quản trị viên | Kế thừa Nhân viên; quản lý cấu hình, phân quyền và báo cáo |
| Hệ thống | Tính cọc, hết hạn đặt máy, tính phí, quản lý tồn kho và đồng bộ realtime |

## Danh sách sơ đồ

1. [Use Case tổng quan](./01-use-case-overview.md)
2. [Activity Diagram](./02-activity-diagrams.md)
   - Đặt máy trước
   - Check-in và chơi máy
   - Gọi dịch vụ
   - Nạp tiền
3. [Sequence Diagram](./03-sequence-diagrams.md)
   - Khách hàng đặt máy
   - Check-in và mở phiên chơi
   - Hệ thống tự động trừ tiền
   - Gọi món và thanh toán
4. [State Diagram](./04-state-diagrams.md)
   - Machine
   - Reservation
   - Play Session
   - Food Order
   - Invoice
5. [Domain ERD](./05-domain-erd.md)
6. [Component và Deployment](./06-component-deployment.md)

## Thứ tự trình bày đề xuất

1. Use Case để giới thiệu phạm vi và tác nhân.
2. Activity để giải thích quy trình nghiệp vụ.
3. Sequence để trình bày cách frontend, backend và database phối hợp.
4. State để giải thích vòng đời các đối tượng chính.
5. ERD để trình bày dữ liệu.
6. Component/Deployment để kết thúc bằng kiến trúc kỹ thuật.

## Quy ước

- `<<include>>`: chức năng con luôn được thực hiện trong use case chính.
- Mũi tên nét đứt trong sequence: response hoặc realtime notification.
- Các trạng thái viết hoa khớp với enum trong backend.
- Quản trị viên kế thừa toàn bộ quyền nghiệp vụ của Nhân viên.
