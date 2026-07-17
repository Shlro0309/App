# Hệ thống Quản lý Cyber Game

Ứng dụng Web quản lý hoạt động Cyber Game, gồm backend Spring Boot và frontend React/Vite. Dự án được phát triển theo từng giai đoạn để dễ kiểm soát kiến trúc, chất lượng mã nguồn và tiến độ đồ án.

## Công nghệ sử dụng

- Backend: Java 21, Spring Boot 3.x, Spring Security, JWT, Spring Data JPA, Hibernate, Maven, Lombok, MapStruct, WebSocket, OpenAPI.
- Frontend: React 19, Vite, TypeScript, React Router, Axios, Zustand, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Recharts, Framer Motion.
- Database: Microsoft SQL Server.

## Cấu trúc

```text
my_first_app/
  .vscode/
  cyber_game_management/
    Database/
    App/
      src/
        backend/
        frontend/
      public/
      tests/
      config/
      docs/
      package.json
      .gitignore
      README.md
  document/
```

Trong đó `App/` là Git repository chính của phần mềm:

```text
my_first_app/cyber_game_management/App/
  src/
    backend/
    frontend/
  public/
  tests/
  config/
  docs/
  package.json
  .gitignore
  README.md
```

Ý nghĩa thư mục:

- `src/`: chứa toàn bộ mã nguồn chính của phần mềm.
- `src/backend/`: mã nguồn backend Spring Boot.
- `src/frontend/`: mã nguồn frontend React/Vite.
- `public/`: tài nguyên tĩnh cấp dự án.
- `tests/`: tài liệu và test tích hợp/e2e cấp dự án trong các giai đoạn sau.
- `config/`: tài liệu và file cấu hình mẫu cho môi trường triển khai.
- `docs/`: tài liệu thiết kế, API và ghi chú kiến trúc.
- `src/frontend/node_modules/`: thư viện frontend do npm quản lý tự động, không commit lên Git.

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

Tạo biến môi trường theo `src/backend/.env.example`, sau đó:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File config/scripts/backend-maven.ps1 spring-boot:run
```

Swagger UI:

```text
http://localhost:8080/api/swagger-ui.html
```

## Chạy Frontend

Tạo biến môi trường theo `src/frontend/.env.example`, sau đó:

```bash
cd src/frontend
powershell -NoProfile -ExecutionPolicy Bypass -File ../../config/scripts/frontend-node.ps1 install
powershell -NoProfile -ExecutionPolicy Bypass -File ../../config/scripts/frontend-node.ps1 dev
```

Frontend mặc định:

```text
http://localhost:5173
```

## Tiến độ phát triển

### Lộ trình tổng thể theo yêu cầu

Tiến độ hiện tại được cập nhật theo file yêu cầu dự án:

| Bước | Module | Trạng thái |
| --- | --- | --- |
| 1 | Khởi tạo project | Đã hoàn thành |
| 2 | Cấu hình Spring Boot | Đã hoàn thành |
| 3 | Kết nối SQL Server | Đã hoàn thành |
| 4 | Spring Security + JWT | Đã hoàn thành |
| 5 | Authentication | Đã hoàn thành |
| 6 | User Management | Đã hoàn thành |
| 7 | Machine Management | Đã hoàn thành backend, đã bổ sung frontend quản lý máy ở workspace hiện tại |
| 8 | Reservation | Giai đoạn tiếp theo |
| 9 | Play Session | Chưa thực hiện |
| 10 | Food Service | Chưa thực hiện |
| 11 | Payment | Chưa thực hiện |
| 12 | Dashboard | Mới có giao diện nền ban đầu |
| 13 | Reports | Chưa thực hiện |
| 14 | Frontend | Đang phát triển theo từng module |
| 15 | WebSocket | Chưa thực hiện |
| 16 | Testing | Đã có kiểm tra build/lint cơ bản, chưa có test tích hợp/e2e đầy đủ |

Các module đã hoàn thành vẫn tuân thủ quy tắc chính của file yêu cầu: không thay đổi schema database, backend theo mô hình `Controller -> Service -> Repository`, API trả DTO thay vì Entity, dùng MapStruct, validation và phân quyền theo role.

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

### Giai đoạn 4: User Management

Đã hoàn thành:

- Tạo module quản lý tài khoản theo mô hình `Controller -> Service -> Repository`.
- Tạo `UserManagementController` cho nhóm API `/api/users`.
- Tạo `UserManagementService` và `UserManagementServiceImpl` để xử lý nghiệp vụ quản lý tài khoản.
- Tạo DTO riêng cho tạo tài khoản, cập nhật thông tin, cập nhật role, cập nhật trạng thái và response tài khoản.
- Tạo `UserMapper` bằng MapStruct để chuyển Entity sang DTO, không trả Entity trực tiếp ra API.
- Mở rộng `UserRepository` với `JpaSpecificationExecutor` để hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp.
- Tạo `UserSpecifications` để lọc theo từ khóa, role và trạng thái tài khoản.
- API quản lý tài khoản yêu cầu role `ADMIN` bằng `@PreAuthorize("hasRole('ADMIN')")`.
- Khi tạo tài khoản role `CUSTOMER`, hệ thống tạo hồ sơ khách hàng tối thiểu trong bảng `khachHang`.
- Khi tạo tài khoản role `EMPLOYEE`, hệ thống tạo hồ sơ nhân viên tối thiểu trong bảng `nhanVien`.
- API xóa tài khoản được xử lý theo hướng khóa tài khoản (`LOCKED`) thay vì xóa vật lý để giữ an toàn dữ liệu lịch sử.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API User Management hiện có:

```text
GET    /api/users
GET    /api/users/{id}
POST   /api/users
PUT    /api/users/{id}
PATCH  /api/users/{id}/status
PATCH  /api/users/{id}/role
DELETE /api/users/{id}
GET    /api/users/roles
```

Các tham số hỗ trợ cho `GET /api/users`:

```text
keyword: tìm theo username, họ tên, số điện thoại, email
role: ADMIN, EMPLOYEE, CUSTOMER
status: ACTIVE, LOCKED
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Lưu ý: file SQL gốc hiện chỉ chứa schema, không có dữ liệu tài khoản admin mẫu. Để dùng các API quản trị, database cần có sẵn ít nhất một tài khoản role `ADMIN` hoặc cần bootstrap dữ liệu admin ban đầu bằng quy trình triển khai riêng.

### Giai đoạn 5: Machine Management

Đã hoàn thành:

- Tạo module quản lý máy theo mô hình `Controller -> Service -> Repository`.
- Tạo `MachineManagementController` cho nhóm API `/api/machines`.
- Tạo `MachineManagementService` và `MachineManagementServiceImpl` để xử lý nghiệp vụ quản lý máy.
- Tạo DTO riêng cho tạo máy, cập nhật máy, cập nhật trạng thái và response máy.
- Tạo `MachineMapper` bằng MapStruct để chuyển Entity sang DTO, không trả Entity trực tiếp ra API.
- Mở rộng `MachineRepository` với `JpaSpecificationExecutor` để hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp.
- Tạo `MachineSpecifications` để lọc theo từ khóa, khu vực và trạng thái máy.
- API thêm, sửa, đổi trạng thái và khóa máy yêu cầu role `ADMIN` bằng `@PreAuthorize("hasRole('ADMIN')")`.
- API xóa máy được xử lý theo hướng chuyển trạng thái sang `OFFLINE` thay vì xóa vật lý để giữ an toàn dữ liệu lịch sử.
- Bổ sung API danh sách khu vực và danh sách trạng thái máy để frontend dùng cho bộ lọc/form.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Machine Management hiện có:

```text
GET    /api/machines
GET    /api/machines/{id}
POST   /api/machines
PUT    /api/machines/{id}
PATCH  /api/machines/{id}/status
DELETE /api/machines/{id}
GET    /api/machines/areas
GET    /api/machines/statuses
```

Các tham số hỗ trợ cho `GET /api/machines`:

```text
keyword: tìm theo tên máy, CPU, GPU, độ phân giải, tên khu vực
areaId: lọc theo khu vực
status: AVAILABLE, RESERVED, PLAYING, MAINTENANCE, OFFLINE
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Frontend Machine Management hiện có:

- Tạo route `/machines` trong React Router.
- Tạo trang quản lý máy với thống kê nhanh theo trạng thái.
- Tạo bộ lọc theo từ khóa, khu vực và trạng thái.
- Tạo bảng danh sách máy có phân trang.
- Tạo form thêm máy và sửa thông tin máy.
- Cho phép đổi trạng thái máy trực tiếp từ bảng.
- Cho phép chuyển máy sang `OFFLINE` theo API xóa mềm của backend.
- Kết nối frontend với các API `/api/machines`, `/api/machines/areas` và `/api/machines/statuses`.
- Sidebar đã có điều hướng thật cho Dashboard và Máy trạm; các module chưa làm được để trạng thái chưa hoạt động để tránh vào route lỗi.

### Điều chỉnh cấu trúc thư mục

Đã hoàn thành:

- Chuyển cấu trúc project sang dạng `src`, `public`, `tests`, `config`, `docs` theo mẫu thư mục chuẩn.
- Di chuyển backend từ `backend/` sang `src/backend/`.
- Di chuyển frontend từ `frontend/` sang `src/frontend/`.
- Cập nhật `.gitignore` theo đường dẫn mới để không commit `.env`, `target`, `node_modules`, `dist`.
- Thêm `package.json` ở root để gom các script chạy nhanh cho backend và frontend.
- Thêm README ngắn trong `docs`, `config`, `tests`, `public` để giải thích vai trò từng thư mục.
- Không thay đổi package Java, cấu trúc module Spring Boot, cấu trúc source React hoặc schema database.

## Kiểm thử hiện tại

Các lệnh đã chạy thành công:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File config/scripts/backend-maven.ps1 test
powershell -NoProfile -ExecutionPolicy Bypass -File config/scripts/backend-maven.ps1 package -DskipTests
powershell -NoProfile -ExecutionPolicy Bypass -File config/scripts/frontend-node.ps1 install
powershell -NoProfile -ExecutionPolicy Bypass -File config/scripts/frontend-node.ps1 build
powershell -NoProfile -ExecutionPolicy Bypass -File config/scripts/frontend-node.ps1 lint
```

Backend đã build thành công, Hibernate validate được schema SQL Server hiện có. Frontend đã cài dependency, build TypeScript/Vite và lint thành công bằng Node.js portable trong `config/tools`. Route frontend `/machines` đã được kiểm tra trả về trang Vite thành công qua dev server local.

## Giai đoạn tiếp theo

Theo lộ trình trong file yêu cầu, giai đoạn kế tiếp là Reservation:

- Thiết kế API đặt máy dựa trên schema `datCho` và bảng liên kết `datCho_mayTram`.
- Cho khách hàng xem máy còn trống theo khu vực và trạng thái.
- Cho phép đặt một hoặc nhiều máy.
- Cho phép hủy đặt máy và chuẩn bị luồng gia hạn.
- Chuẩn bị dữ liệu cho sơ đồ phòng máy và luồng check-in ở module Play Session.
