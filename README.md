# Hệ thống Quản lý Cyber Game

Ứng dụng Web quản lý hoạt động Cyber Game, gồm backend Spring Boot và frontend React/Vite. Dự án được phát triển theo từng giai đoạn để dễ kiểm soát kiến trúc, chất lượng mã nguồn và tiến độ đồ án.

## Công nghệ sử dụng

- Backend: Java 21, Spring Boot 3.x, Spring Security, JWT, Spring Data JPA, Hibernate, Maven, Lombok, MapStruct, WebSocket, OpenAPI.
- Frontend: React 19, Vite, TypeScript, React Router, Axios, Zustand, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Recharts, Framer Motion.
- Database: Microsoft SQL Server.

## Cấu trúc

```text
App/
  backend/
  frontend/
  README.md
```

Backend tuân theo mô hình:

```text
controller -> service -> repository -> database
```

Frontend được chia theo:

```text
api, components, features, hooks, layouts, pages, routes, stores, types, utils, assets
```

## Database

Schema gốc nằm tại:

```text
../Database/script chứa bảng và quan hệ.sql
```

Quy ước của dự án:

- Không tự ý chỉnh sửa cấu trúc database.
- Hibernate dùng `ddl-auto=validate`.
- Entity sẽ được sinh/map theo đúng bảng và khóa ngoại trong file SQL.
- Không trả Entity trực tiếp ra API, chỉ trả DTO.

## Yêu cầu môi trường cho dự án này

- Java 21
- Maven 3.9+
- Node.js 20+
- Microsoft SQL Server

## Chạy Backend

Tạo biến môi trường theo `backend/.env.example`, sau đó:

```bash
cd backend
mvn spring-boot:run
```

Swagger UI:

```text
http://localhost:8080/api/swagger-ui.html
```

## Chạy Frontend

Tạo biến môi trường theo `frontend/.env.example`, sau đó:

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định:

```text
http://localhost:5173
```

## Tiến độ phát triển

### Giai đoạn 1: Khởi tạo dự án và cấu hình nền tảng

Đã hoàn thành:

- Tạo cấu trúc thư mục `backend` và `frontend` trong cùng project `App`.
- Khởi tạo backend Spring Boot với Java 21 và Maven.
- Cấu hình các dependency nền tảng cho backend: Spring Web, Spring Data JPA, SQL Server JDBC Driver, Validation, Lombok, MapStruct, Spring Security, JWT, WebSocket, Actuator và OpenAPI.
- Tạo cấu trúc package backend theo mô hình nhiều tầng: `controller`, `service`, `service.impl`, `repository`, `entity`, `dto`, `mapper`, `config`, `security`, `exception`, `utils`, `validation`, `websocket`.
- Cấu hình kết nối SQL Server qua profile `local` và file `.env`.
- Cấu hình Hibernate dùng `ddl-auto=validate` để kiểm tra schema, không tự tạo hoặc sửa bảng.
- Cấu hình Swagger/OpenAPI tại `/api/swagger-ui.html`.
- Tạo `GlobalExceptionHandler` nền tảng để chuẩn hóa lỗi API.
- Khởi tạo frontend React/Vite/TypeScript.
- Cấu hình Tailwind CSS và cấu trúc thư mục frontend theo hướng module hóa.
- Tạo giao diện nền ban đầu để kiểm tra frontend chạy được với Vite.

### Giai đoạn 2: Mapping database hiện có

Đã hoàn thành:

- Đọc file SQL gốc trong thư mục `Database` và mapping theo đúng bảng, khóa chính, khóa ngoại hiện có.
- Tạo Entity JPA cho các nhóm dữ liệu chính: tài khoản, phân quyền, khách hàng, nhân viên, khu vực, máy tính, game, bảo trì, đặt máy, phiên chơi, dịch vụ, đơn gọi món, chi tiết đơn, hóa đơn, thành viên và khuyến mãi.
- Mapping quan hệ JPA bằng `@OneToOne`, `@OneToMany`, `@ManyToOne` theo quan hệ thật trong database.
- Tạo enum và converter cho các cột trạng thái dạng `tinyint`.
- Tạo Repository cho từng Entity để chuẩn bị cho tầng Service.
- Cấu hình Hibernate dùng `PhysicalNamingStrategyStandardImpl` để giữ nguyên tên bảng/cột tiếng Việt trong SQL Server.
- Chạy kiểm thử kết nối SQL Server và validate schema thành công.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

### Giai đoạn 3: Spring Security, JWT và Authentication

Đã hoàn thành:

- Cấu hình Spring Security theo kiểu stateless, phù hợp REST API.
- Cấu hình `PasswordEncoder` dùng BCrypt.
- Tạo `CurrentUser`, `CustomUserDetailsService`, `JwtService` và `JwtAuthenticationFilter`.
- Sinh và xác thực JWT access token.
- Sinh refresh token bằng JWT theo hướng stateless vì dự án không được bổ sung bảng lưu token.
- Tạo DTO request/response cho Authentication, không trả Entity trực tiếp ra API.
- Tạo `AuthService` và `AuthServiceImpl` để xử lý nghiệp vụ đăng ký, đăng nhập, refresh token, đổi mật khẩu và lấy thông tin người dùng hiện tại.
- Tạo `AuthController` để cung cấp REST API cho module Authentication.
- Tự đảm bảo dữ liệu quyền mặc định `ADMIN`, `EMPLOYEE`, `CUSTOMER` nếu database chưa có, chỉ thêm dữ liệu cần thiết vào bảng quyền hiện có.
- Cập nhật Swagger/OpenAPI để hỗ trợ Bearer JWT.
- Bổ sung exception nghiệp vụ `BusinessException`, `ResourceNotFoundException` và xử lý lỗi xác thực trong `GlobalExceptionHandler`.
- Chạy kiểm thử API Authentication với SQL Server thật.

Các API Authentication hiện có:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/change-password
POST /api/auth/logout
GET  /api/auth/me
```

Lưu ý: refresh token hiện được xử lý stateless bằng JWT vì dự án không được bổ sung bảng lưu token.

## Kiểm thử hiện tại

Các lệnh đã chạy thành công:

```bash
mvn test
mvn package -DskipTests
```

Backend đã build thành công và Hibernate validate được schema SQL Server hiện có.

## Giai đoạn tiếp theo

Giai đoạn kế tiếp sẽ là User Management:

- Quản lý tài khoản.
- Lấy danh sách tài khoản có phân trang, sắp xếp, tìm kiếm.
- Xem chi tiết tài khoản.
- Cập nhật thông tin tài khoản.
- Khóa/mở khóa tài khoản.
- Phân quyền theo role `ADMIN`, `EMPLOYEE`, `CUSTOMER`.
