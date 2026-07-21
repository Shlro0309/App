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
| 6 | User Management | Đã hoàn thành backend, đã bổ sung frontend quản lý tài khoản ở workspace hiện tại |
| 7 | Machine Management | Đã hoàn thành backend, đã bổ sung frontend quản lý máy ở workspace hiện tại |
| 8 | Reservation | Đã hoàn thành backend, đã bổ sung frontend quản lý đặt máy ở workspace hiện tại |
| 9 | Play Session | Đã hoàn thành backend, đã bổ sung frontend quản lý phiên chơi ở workspace hiện tại |
| 10 | Food Service | Đã hoàn thành backend, đã bổ sung frontend quản lý dịch vụ và đơn gọi món ở workspace hiện tại |
| 11 | Payment | Đã hoàn thành backend, đã bổ sung frontend quản lý thanh toán ở workspace hiện tại |
| 12 | Dashboard | Đã hoàn thành backend tổng quan, đã bổ sung frontend Dashboard dữ liệu thật ở workspace hiện tại |
| 13 | Reports | Đã hoàn thành backend báo cáo, đã bổ sung frontend Reports ở workspace hiện tại |
| 14 | Frontend | Đã tách portal vận hành cho ADMIN/EMPLOYEE, side window tại quán `/customer` và web đặt máy trước riêng cho khách gồm `/booking/login`, `/booking` |
| 15 | WebSocket | Đã hoàn thành backend WebSocket/STOMP và frontend realtime client cho các màn hình vận hành/khách hàng |
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

Frontend User Management hiện có:

- Tạo route `/users` trong React Router.
- Bật điều hướng thật cho mục Tài khoản trên sidebar/header.
- Tạo trang quản lý tài khoản với thống kê nhanh tổng tài khoản, khách hàng, nhân viên và tài khoản đã khóa.
- Tạo bộ lọc theo từ khóa, role và trạng thái tài khoản.
- Tạo bảng danh sách tài khoản có phân trang.
- Tạo form thêm tài khoản mới cho `ADMIN`, `EMPLOYEE` hoặc `CUSTOMER`.
- Cho phép sửa thông tin liên hệ, đổi role, khóa tài khoản và mở khóa tài khoản trực tiếp từ bảng.
- Kết nối frontend với các API `/api/users` và `/api/users/roles`.

Lưu ý: file SQL gốc hiện chỉ chứa schema. Workspace hiện có thêm script `config/scripts/seed-dashboard-sample-data.sql` để tạo dữ liệu demo cho Dashboard và tài khoản mẫu khi cần chạy thử local.

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

### Giai đoạn 6: Reservation

Đã hoàn thành:

- Tạo module đặt máy theo mô hình `Controller -> Service -> Repository`.
- Tạo `ReservationController` cho nhóm API `/api/reservations`.
- Tạo `ReservationService` và `ReservationServiceImpl` để xử lý nghiệp vụ đặt máy.
- Tạo DTO riêng cho tạo đặt máy, cập nhật trạng thái và response đặt máy.
- Tạo `ReservationMapper` bằng MapStruct để chuyển Entity sang DTO, không trả Entity trực tiếp ra API.
- Mở rộng `ReservationRepository` với `JpaSpecificationExecutor` để hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp.
- Tạo `ReservationSpecifications` để lọc theo từ khóa, khách hàng và trạng thái đặt máy.
- Khi tạo đặt máy, hệ thống chỉ nhận máy đang `AVAILABLE`, kiểm tra trùng đặt máy active và chuyển máy sang `RESERVED`.
- Khách chỉ đặt máy thành công khi số dư hiện tại đủ ít nhất 1 giờ chơi của toàn bộ máy đã chọn; hệ thống chỉ kiểm tra điều kiện số dư, không trừ tiền ở bước đặt máy.
- Đơn đặt máy tạo thành công chuyển thẳng sang `CONFIRMED` và có mã đặt trước dạng `RSV-000123` được suy ra từ mã đơn hiện có, không bổ sung cột database.
- Bổ sung API `GET /api/reservations/station-active?machineId=...` để màn hình máy trạm đọc reservation `CONFIRMED` còn hạn của máy đó trước khi khách đăng nhập.
- Khi hủy hoặc đóng đặt máy bằng trạng thái kết thúc, hệ thống giải phóng máy về `AVAILABLE` nếu máy còn đang `RESERVED`.
- Phân quyền theo role: `ADMIN`, `EMPLOYEE`, `CUSTOMER` được xem/tạo/hủy theo phạm vi hợp lệ; chỉ `ADMIN` và `EMPLOYEE` được cập nhật trạng thái đặt máy.
- Khách hàng chỉ được xem, tạo và hủy đặt máy của chính mình; `ADMIN` và `EMPLOYEE` được thao tác theo khách hàng cụ thể.
- Bổ sung API danh sách máy còn trống để frontend chọn máy khi tạo đặt máy.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Reservation hiện có:

```text
GET   /api/reservations
GET   /api/reservations/{id}
POST  /api/reservations
PATCH /api/reservations/{id}/status
PATCH /api/reservations/{id}/cancel
GET   /api/reservations/available-machines
GET   /api/reservations/station-active
GET   /api/reservations/statuses
```

Các tham số hỗ trợ cho `GET /api/reservations`:

```text
keyword: tìm theo tên khách hàng, số điện thoại, email, tên máy
customerId: lọc theo khách hàng
status: PENDING, CONFIRMED, CANCELLED, EXPIRED, COMPLETED
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Frontend Reservation hiện có:

- Tạo route `/reservations` trong React Router.
- Bật điều hướng thật cho mục Đặt máy trên sidebar/header.
- Tạo trang quản lý đặt máy với thống kê nhanh theo trạng thái.
- Tạo bộ lọc theo từ khóa, khách hàng và trạng thái.
- Tạo bảng danh sách đặt máy có phân trang.
- Tạo form đặt máy, chọn một hoặc nhiều máy còn trống từ API `/api/reservations/available-machines`.
- Trang đặt máy của khách hiển thị số dư, tổng tiền cần có cho 1 giờ của máy đã chọn và chặn gửi form khi số dư không đủ.
- Lịch đặt của khách hiển thị mã đặt trước `RSV-000123` và bộ đếm ngược cho đơn `CONFIRMED`.
- Cho phép cập nhật trạng thái đặt máy trực tiếp từ bảng.
- Cho phép hủy đặt máy khi đặt máy chưa ở trạng thái kết thúc.
- Kết nối frontend với các API `/api/reservations`, `/api/reservations/statuses` và `/api/reservations/available-machines`.

### Giai đoạn 7: Play Session

Đã hoàn thành:

- Tạo module phiên chơi theo mô hình `Controller -> Service -> Repository`.
- Tạo `PlaySessionController` cho nhóm API `/api/play-sessions`.
- Tạo `PlaySessionService` và `PlaySessionServiceImpl` để xử lý nghiệp vụ bắt đầu, check-in, kết thúc và hủy phiên chơi.
- Tạo DTO riêng cho bắt đầu phiên trực tiếp, check-in từ đặt máy và response phiên chơi.
- Tạo `PlaySessionMapper` bằng MapStruct để chuyển Entity sang DTO, không trả Entity trực tiếp ra API.
- Mở rộng `PlaySessionRepository` với `JpaSpecificationExecutor` để hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp.
- Tạo `PlaySessionSpecifications` để lọc theo từ khóa, khách hàng, máy và trạng thái phiên chơi.
- Cho phép bắt đầu phiên trực tiếp trên máy đang `AVAILABLE`; khi bắt đầu phiên, máy chuyển sang `PLAYING`.
- Cho phép check-in từ reservation đã `CONFIRMED`; hệ thống kiểm tra reservation chưa hết hạn, máy thuộc reservation và máy đang `RESERVED`.
- Khi khách nhập đúng mã đặt trước tại máy trạm và đăng nhập đúng tài khoản sở hữu đơn, backend tạo phiên chơi từ reservation, chuyển máy từ `RESERVED` sang `PLAYING`; nếu toàn bộ máy trong đơn đã được check-in thì reservation chuyển sang `COMPLETED`.
- Chặn bắt đầu phiên trực tiếp hoặc check-in từ reservation nếu số dư khách hàng không lớn hơn `0`; khách phải nạp tiền trước khi vào phiên chơi.
- Khi kết thúc phiên, hệ thống tính `tongTienGio` theo số phút sử dụng và `giaTheoGio`, chuyển phiên sang `COMPLETED`, đồng thời giải phóng máy về `AVAILABLE`.
- Khi tiền giờ đã dùng chạm số dư khách hàng, backend tự kết thúc phiên theo lịch kiểm tra định kỳ, trừ số dư về tối thiểu `0`, chuyển khách về `OFFLINE` và giải phóng máy về `AVAILABLE`.
- Khi hủy phiên, hệ thống chuyển phiên sang `CANCELLED`, đặt tiền giờ bằng `0` và giải phóng máy về `AVAILABLE`.
- Phân quyền theo role: `ADMIN`, `EMPLOYEE`, `CUSTOMER` được xem/bắt đầu/kết thúc theo phạm vi hợp lệ; chỉ `ADMIN` và `EMPLOYEE` được hủy phiên.
- Khách hàng chỉ được xem và thao tác phiên chơi của chính mình; `ADMIN` và `EMPLOYEE` được thao tác theo khách hàng cụ thể.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Play Session hiện có:

```text
GET   /api/play-sessions
GET   /api/play-sessions/{id}
POST  /api/play-sessions
POST  /api/play-sessions/from-reservation
PATCH /api/play-sessions/{id}/end
PATCH /api/play-sessions/{id}/cancel
GET   /api/play-sessions/statuses
```

Các tham số hỗ trợ cho `GET /api/play-sessions`:

```text
keyword: tìm theo tên khách hàng, số điện thoại, email, tên máy, khu vực
customerId: lọc theo khách hàng
machineId: lọc theo máy
status: ACTIVE, COMPLETED, CANCELLED
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Frontend Play Session hiện có:

- Tạo route `/play-sessions` trong React Router.
- Bật điều hướng thật cho mục Phiên chơi trên sidebar/header.
- Tạo trang quản lý phiên chơi với thống kê nhanh theo trạng thái.
- Tạo bộ lọc theo từ khóa, khách hàng, máy và trạng thái.
- Tạo bảng danh sách phiên chơi có phân trang.
- Tạo form bắt đầu phiên trực tiếp bằng mã khách hàng và mã máy.
- Tạo form check-in từ đặt máy bằng mã đặt máy và danh sách mã máy.
- Cho phép kết thúc phiên active trực tiếp từ bảng.
- Cho phép hủy phiên active trực tiếp từ bảng cho tài khoản có quyền.
- Kết nối frontend với các API `/api/play-sessions`, `/api/play-sessions/statuses` và `/api/play-sessions/from-reservation`.

### Giai đoạn 8: Food Service

Đã hoàn thành:

- Tạo module dịch vụ/đồ ăn theo mô hình `Controller -> Service -> Repository`.
- Tạo `FoodServiceController` cho nhóm API `/api/food-services`.
- Tạo `FoodOrderController` cho nhóm API `/api/food-orders`.
- Tạo `FoodServiceManagementService` và `FoodServiceManagementServiceImpl` để xử lý nghiệp vụ danh mục dịch vụ, tồn kho và đơn gọi món.
- Tạo DTO riêng cho tạo/cập nhật dịch vụ, cập nhật trạng thái dịch vụ, tạo đơn gọi món, cập nhật trạng thái đơn và response chi tiết.
- Tạo `ServiceItemMapper` và `CustomerOrderMapper` bằng MapStruct để chuyển Entity sang DTO, không trả Entity trực tiếp ra API.
- Mở rộng `ServiceItemRepository` và `CustomerOrderRepository` với `JpaSpecificationExecutor` để hỗ trợ tìm kiếm, lọc, phân trang và sắp xếp.
- Tạo `ServiceItemSpecifications` để lọc dịch vụ theo từ khóa, loại dịch vụ và trạng thái.
- Tạo `CustomerOrderSpecifications` để lọc đơn gọi món theo từ khóa, khách hàng, phiên chơi và trạng thái.
- Cho phép quản lý danh mục dịch vụ, giá, loại dịch vụ, ảnh, tồn kho và trạng thái `ACTIVE`/`INACTIVE`.
- API xóa dịch vụ được xử lý theo hướng chuyển trạng thái sang `INACTIVE` thay vì xóa vật lý để giữ an toàn dữ liệu lịch sử.
- Cho phép tạo đơn gọi món gắn với khách hàng và tùy chọn gắn với phiên chơi đang `ACTIVE`.
- Khi tạo đơn gọi món, hệ thống chỉ nhận dịch vụ `ACTIVE`, kiểm tra tồn kho và trừ tồn kho trong transaction.
- Khi hủy đơn chưa hoàn tất, hệ thống chuyển đơn sang `CANCELLED` và hoàn lại tồn kho.
- Khi cập nhật đơn sang `COMPLETED`, hệ thống khóa luồng đổi trạng thái ngược để tránh sai lệch dữ liệu cho Payment.
- Phân quyền theo role: `ADMIN`, `EMPLOYEE`, `CUSTOMER` được xem dịch vụ và tạo đơn theo phạm vi hợp lệ; chỉ `ADMIN` và `EMPLOYEE` được quản lý dịch vụ và cập nhật trạng thái đơn.
- Khách hàng chỉ được xem/tạo/hủy đơn của chính mình; `ADMIN` và `EMPLOYEE` được thao tác theo khách hàng cụ thể.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Food Service hiện có:

```text
GET    /api/food-services
GET    /api/food-services/{id}
POST   /api/food-services
PUT    /api/food-services/{id}
PATCH  /api/food-services/{id}/status
DELETE /api/food-services/{id}
GET    /api/food-services/statuses

GET    /api/food-orders
GET    /api/food-orders/{id}
POST   /api/food-orders
PATCH  /api/food-orders/{id}/status
PATCH  /api/food-orders/{id}/cancel
GET    /api/food-orders/statuses
```

Các tham số hỗ trợ cho `GET /api/food-services`:

```text
keyword: tìm theo tên dịch vụ, loại dịch vụ
serviceType: lọc theo loại dịch vụ
status: ACTIVE, INACTIVE
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Các tham số hỗ trợ cho `GET /api/food-orders`:

```text
keyword: tìm theo tên khách hàng, số điện thoại, email, tên dịch vụ, loại dịch vụ
customerId: lọc theo khách hàng
playSessionId: lọc theo phiên chơi
status: PENDING, PREPARING, COMPLETED, CANCELLED
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Frontend Food Service hiện có:

- Tạo route `/food-services` trong React Router.
- Bật điều hướng thật cho mục Dịch vụ trên sidebar/header.
- Tạo trang quản lý dịch vụ với hai tab: Dịch vụ và Đơn gọi món.
- Tạo bộ lọc dịch vụ theo từ khóa, loại dịch vụ và trạng thái.
- Tạo bảng danh sách dịch vụ có phân trang.
- Tạo form thêm/sửa dịch vụ, cập nhật tồn kho và trạng thái.
- Tạo bộ lọc đơn gọi món theo từ khóa, khách hàng, phiên chơi và trạng thái.
- Tạo bảng danh sách đơn gọi món có phân trang.
- Tạo form tạo đơn gọi món với nhiều dòng dịch vụ.
- Cho phép cập nhật trạng thái và hủy đơn gọi món trực tiếp từ bảng.
- Kết nối frontend với các API `/api/food-services`, `/api/food-services/statuses`, `/api/food-orders` và `/api/food-orders/statuses`.

### Giai đoạn 9: Payment

Đã hoàn thành:

- Tạo module hóa đơn/thanh toán theo mô hình `Controller -> Service -> Repository`.
- Tạo `PaymentController` cho nhóm API `/api/payments`.
- Tạo `PaymentService` và `PaymentServiceImpl` để xử lý nghiệp vụ tạo hóa đơn, thanh toán, cập nhật trạng thái và hủy hóa đơn.
- Tạo DTO riêng cho tạo hóa đơn checkout, xác nhận thanh toán, cập nhật trạng thái và response thanh toán.
- Tạo `PaymentMapper` bằng MapStruct để chuyển Entity sang DTO, không trả Entity trực tiếp ra API.
- Mở rộng `InvoiceRepository` với `JpaSpecificationExecutor` và entity graph để hỗ trợ lọc, phân trang, sắp xếp và lấy đủ thông tin liên quan của hóa đơn.
- Tạo `PaymentSpecifications` để lọc hóa đơn theo từ khóa, khách hàng, phiên chơi, đơn gọi món và trạng thái.
- Cho phép tạo hóa đơn từ phiên chơi đã `COMPLETED`, đơn gọi món đã `COMPLETED` hoặc kết hợp cả hai khi cùng thuộc một khách hàng.
- Tự tính số tiền hóa đơn từ `tongTienGio` của Play Session và `tongTien` của Food Service, không nhập tay tổng tiền từ frontend.
- Chặn tạo trùng hóa đơn active cho cùng đơn gọi món hoặc phiên chơi độc lập để tránh ghi nhận thanh toán lặp.
- Cho phép xác nhận thanh toán hóa đơn `PENDING`, cập nhật phương thức thanh toán và thời gian giao dịch.
- Bổ sung API nạp tiền ví khách hàng `POST /api/payments/top-up`, dùng tài khoản `CUSTOMER` đang đăng nhập, cộng vào `khachHang.soDu` và ghi lịch sử hóa đơn `WALLET_TOP_UP` trạng thái `PAID`.
- Cho phép cập nhật trạng thái hóa đơn theo luồng hợp lệ: hóa đơn đã thanh toán không được hủy trực tiếp, chỉ có thể chuyển sang hoàn tiền khi cần.
- Phân quyền theo role: `ADMIN`, `EMPLOYEE`, `CUSTOMER` được xem/tạo/thanh toán/hủy theo phạm vi hợp lệ; chỉ `ADMIN` và `EMPLOYEE` được cập nhật trạng thái quản trị.
- Khách hàng chỉ được thao tác hóa đơn của chính mình; `ADMIN` và `EMPLOYEE` được thao tác theo khách hàng cụ thể.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Payment hiện có:

```text
GET   /api/payments
GET   /api/payments/{id}
POST  /api/payments/checkout
POST  /api/payments/top-up
PATCH /api/payments/{id}/pay
PATCH /api/payments/{id}/status
PATCH /api/payments/{id}/cancel
GET   /api/payments/statuses
GET   /api/payments/methods
```

Các tham số hỗ trợ cho `GET /api/payments`:

```text
keyword: tìm theo tên khách hàng, số điện thoại, email, tên máy hoặc mã giao dịch
customerId: lọc theo khách hàng
playSessionId: lọc theo phiên chơi
orderId: lọc theo đơn gọi món
status: PENDING, PAID, CANCELLED, REFUNDED
page, size, sort: phân trang và sắp xếp theo chuẩn Spring Pageable
```

Frontend Payment hiện có:

- Tạo route `/payments` trong React Router.
- Bật điều hướng thật cho mục Thanh toán trên sidebar/header.
- Tạo trang quản lý thanh toán với thống kê nhanh tổng hóa đơn, tổng tiền đã thanh toán và tổng tiền đang chờ.
- Tạo bộ lọc theo từ khóa, khách hàng, phiên chơi, đơn gọi món và trạng thái.
- Tạo bảng danh sách hóa đơn có phân trang.
- Tạo form checkout để lập hóa đơn từ phiên chơi, đơn gọi món hoặc kết hợp cả hai.
- Hiển thị nhãn giao dịch nạp tiền `WALLET_TOP_UP` là `Nạp tiền` ở Payment, Dashboard, Report và lịch sử thanh toán khách hàng.
- Cho phép xác nhận thanh toán, hủy hóa đơn đang chờ và cập nhật trạng thái hóa đơn trực tiếp từ bảng.
- Kết nối frontend với các API `/api/payments`, `/api/payments/statuses` và `/api/payments/methods`.

### Giai đoạn 10: Dashboard

Đã hoàn thành:

- Tạo module Dashboard theo mô hình `Controller -> Service -> Repository`.
- Tạo `DashboardController` cho nhóm API `/api/dashboard`.
- Tạo `DashboardService` và `DashboardServiceImpl` để gom dữ liệu tổng quan từ các module đã hoàn thành.
- Tạo DTO riêng cho Dashboard gồm số liệu tổng quan, phân bố trạng thái, doanh thu theo ngày, phiên chơi đang hoạt động và thanh toán gần đây.
- Mở rộng các repository hiện có bằng query đọc dữ liệu tổng hợp: `MachineRepository`, `ReservationRepository`, `PlaySessionRepository`, `CustomerOrderRepository`, `InvoiceRepository` và `ServiceItemRepository`.
- Dashboard chỉ đọc dữ liệu, không ghi dữ liệu và không thay đổi schema database.
- API Dashboard yêu cầu role `ADMIN` hoặc `EMPLOYEE` vì đây là màn hình tổng quan vận hành/quản trị.
- Tổng hợp doanh thu hôm nay và 7 ngày gần nhất từ hóa đơn `PAID`.
- Tổng hợp số phiên chơi active, phiên hoàn tất trong ngày, đặt máy trong ngày, đơn gọi món chờ, hóa đơn chờ, máy theo trạng thái, dịch vụ active và dịch vụ sắp hết hàng.
- Bổ sung danh sách phiên chơi đang hoạt động và danh sách thanh toán gần đây để nhân viên có thể quét nhanh tình hình vận hành.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Dashboard hiện có:

```text
GET /api/dashboard/overview
```

Frontend Dashboard hiện có:

- Route `/` đã dùng màn hình Dashboard kết nối dữ liệu thật thay cho số liệu tĩnh.
- Tạo API client `/api/dashboard/overview` và kiểu dữ liệu riêng trong `features/dashboard`.
- Hiển thị các thẻ số liệu nhanh cho doanh thu, phiên chơi, máy, đặt máy, thanh toán, đơn gọi món và dịch vụ.
- Hiển thị biểu đồ doanh thu 7 ngày bằng Recharts.
- Hiển thị phân bố trạng thái máy và hóa đơn.
- Hiển thị danh sách phiên chơi đang hoạt động và thanh toán gần đây.
- Bổ sung trạng thái loading, refresh và thông báo lỗi quyền truy cập khi tài khoản không đủ quyền xem Dashboard.

### Giai đoạn 11: Reports

Đã hoàn thành:

- Tạo module Reports theo mô hình `Controller -> Service -> Repository`.
- Tạo `ReportController` cho nhóm API `/api/reports`.
- Tạo `ReportService` và `ReportServiceImpl` để tổng hợp báo cáo từ dữ liệu thật của hóa đơn, phiên chơi, đơn gọi món, dịch vụ, khách hàng và máy trạm.
- Tạo DTO riêng cho Reports gồm tổng quan kỳ báo cáo, doanh thu theo ngày, doanh thu theo nguồn giao dịch, doanh thu theo phương thức thanh toán, top máy sử dụng, top dịch vụ bán ra và top khách hàng.
- Mở rộng các repository hiện có bằng query đọc dữ liệu tổng hợp: `InvoiceRepository`, `PlaySessionRepository` và `OrderDetailRepository`.
- Reports chỉ đọc dữ liệu, không ghi dữ liệu và không thay đổi schema database.
- API Reports yêu cầu role `ADMIN` hoặc `EMPLOYEE` vì đây là nhóm báo cáo vận hành/quản trị.
- Hỗ trợ lọc báo cáo theo `fromDate` và `toDate`, mặc định lấy 30 ngày gần nhất khi frontend mở màn hình.
- Giới hạn khoảng báo cáo tối đa 366 ngày cho mỗi request để tránh truy vấn quá rộng.
- Tính tổng doanh thu từ hóa đơn `PAID`, tách doanh thu giờ chơi và doanh thu dịch vụ dựa trên liên kết hóa đơn với phiên chơi/đơn gọi món.
- Tính thời lượng sử dụng máy từ các phiên chơi đã hoàn tất và xếp hạng máy theo doanh thu.
- Không bổ sung bảng mới và không thay đổi cấu trúc database.

Các API Reports hiện có:

```text
GET /api/reports/overview
```

Các tham số hỗ trợ cho `GET /api/reports/overview`:

```text
fromDate: ngày bắt đầu kỳ báo cáo theo ISO date, ví dụ 2026-07-01
toDate: ngày kết thúc kỳ báo cáo theo ISO date, ví dụ 2026-07-21
```

Frontend Reports hiện có:

- Tạo route `/reports` trong React Router.
- Bật điều hướng thật cho mục Báo cáo trên sidebar/header.
- Tạo API client `/api/reports/overview` và kiểu dữ liệu riêng trong `features/reports`.
- Tạo bộ lọc thời gian theo ngày bắt đầu và ngày kết thúc.
- Hiển thị các thẻ số liệu nhanh cho tổng doanh thu, doanh thu giờ chơi, doanh thu dịch vụ, số hóa đơn, số phiên hoàn tất, số đơn hoàn tất, thời lượng chơi và trung bình hóa đơn.
- Hiển thị biểu đồ doanh thu theo ngày bằng Recharts.
- Hiển thị phân bổ doanh thu theo nguồn giao dịch và phương thức thanh toán.
- Hiển thị bảng top máy sử dụng, top dịch vụ bán ra và top khách hàng.
- Bổ sung trạng thái loading, refresh và thông báo lỗi quyền truy cập khi tài khoản không đủ quyền xem Reports.

### Giai đoạn 12: Frontend tổng thể

Đã hoàn thành:

- Bổ sung module frontend Authentication trong `features/auth`.
- Tạo API client cho các API `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh` và `/api/auth/logout`.
- Tạo kiểu dữ liệu frontend riêng cho user hiện tại, response đăng nhập, token refresh và form đăng nhập.
- Tạo `tokenStorage` để quản lý `accessToken` và `refreshToken` trong `localStorage` tại một nơi tập trung.
- Tạo `authStore` bằng Zustand để quản lý trạng thái phiên đăng nhập, user hiện tại, đăng nhập, đăng xuất, khởi tạo phiên và xử lý mất phiên.
- Bọc ứng dụng bằng `AuthBootstrap` để khi mở frontend, hệ thống tự kiểm tra token đang có, gọi `/api/auth/me`, thử refresh access token nếu cần và đưa người dùng về trạng thái phù hợp.
- Cập nhật `httpClient` để tự gắn Bearer token vào request, tự refresh access token một lần khi API trả `401` và phát sự kiện mất phiên nếu refresh thất bại.
- Tạo trang `/login` với form đăng nhập thật, kết nối trực tiếp API backend và lưu token sau khi đăng nhập thành công.
- Tạo `RequireAuth` để bảo vệ toàn bộ khu vực cần đăng nhập, có thể cấu hình login path riêng cho portal vận hành, máy trạm khách hàng và web booking khách hàng.
- Tạo `RequireRole` để chặn route theo quyền mà không phụ thuộc vào việc người dùng tự nhập URL.
- Tạo `GuestOnly` để người đã đăng nhập không quay lại màn hình login, có thể cấu hình route chuyển tiếp theo từng khu vực.
- Cập nhật route `/` bằng `HomePage`: `ADMIN` và `EMPLOYEE` vào Dashboard vận hành, `CUSTOMER` được chuyển sang side window `/customer`.
- Tách rõ portal vận hành nội bộ khỏi trải nghiệm khách hàng: layout sidebar vận hành chỉ dành cho `ADMIN` và `EMPLOYEE`.
- Tạo route `/customer/login` cho màn hình đăng nhập máy trạm riêng của khách tại quán, tách khỏi màn hình `/login` của vận hành.
- Màn hình `/customer/login` chỉ cho tài khoản `CUSTOMER` vào phiên chơi; nếu số dư bằng `0` thì giữ khách ở màn hình này, thông báo cần nạp thêm tiền và cho nạp tiền trực tiếp trước khi vào side window.
- Màn hình `/customer/login` nhận `machineId` qua URL, ví dụ `/customer/login?machineId=2`, sau đó ghi nhớ máy trạm trong `localStorage`; nếu máy đó có reservation `CONFIRMED` còn hạn thì hiển thị countdown và yêu cầu nhập mã đặt trước trước khi đăng nhập vào phiên chơi.
- Nếu máy trạm không có reservation còn hạn thì `/customer/login` vẫn hiển thị giao diện đăng nhập phiên chơi bình thường.
- Tạo route `/customer` cho side window khách hàng tại máy trong quán, có thể thu gọn/mở lại, hiển thị tài khoản, máy đang dùng, số dư, thời gian còn lại, thời gian đã dùng, đơn gọi món, lịch sử thanh toán và các thao tác nhanh.
- Side window tự giảm số dư hiển thị theo thời gian chơi, cảnh báo khi còn khoảng `30`, `10`, `5` phút và tự gọi kết thúc phiên rồi quay về màn hình `/customer/login` khi số dư về `0`.
- Tạo route `/booking/login` cho màn hình đăng nhập riêng của khách đặt máy từ laptop/điện thoại cá nhân; route này chỉ cho tài khoản `CUSTOMER` đi vào web booking.
- Tạo route `/booking` cho trang đặt máy trước riêng của khách hàng, dùng tài khoản `CUSTOMER` để xem máy còn trống, chọn nhiều máy, nhập thời gian giữ chỗ và tạo reservation.
- Giữ `/prebook` làm alias chuyển hướng về `/booking` để tránh hỏng đường dẫn cũ trong quá trình test.
- Cập nhật sidebar/header vận hành để hiển thị người dùng hiện tại, role hiện tại và nút đăng xuất.
- Lọc menu theo role: `ADMIN` thấy toàn bộ mục quản trị, `EMPLOYEE` thấy các mục vận hành/báo cáo phù hợp, `CUSTOMER` không đi vào portal vận hành.
- Bổ sung field `balance` vào DTO `/api/auth/me` và response đăng nhập để customer UI đọc số dư từ bảng `khachHang`, không thay đổi schema database.

### Điều chỉnh cấu trúc thư mục

Đã hoàn thành:

- Chuyển cấu trúc project sang dạng `src`, `public`, `tests`, `config`, `docs` theo mẫu thư mục chuẩn.
- Di chuyển backend từ `backend/` sang `src/backend/`.
- Di chuyển frontend từ `frontend/` sang `src/frontend/`.
- Cập nhật `.gitignore` theo đường dẫn mới để không commit `.env`, `target`, `node_modules`, `dist`.
- Thêm `package.json` ở root để gom các script chạy nhanh cho backend và frontend.
- Thêm README ngắn trong `docs`, `config`, `tests`, `public` để giải thích vai trò từng thư mục.
- Không thay đổi package Java, cấu trúc module Spring Boot, cấu trúc source React hoặc schema database.

### Giai đoạn 13: WebSocket

Đã hoàn thành:

- Cấu hình WebSocket/STOMP trong backend tại endpoint `/api/ws`, dùng simple broker `/topic`, application prefix `/app` và user prefix `/user`.
- Mở quyền truy cập handshake WebSocket trong Spring Security cho `/ws/**`, còn các API nghiệp vụ vẫn giữ cơ chế JWT/role hiện có.
- Tạo event realtime dùng chung gồm `RealtimeEvent`, `RealtimeEventType` và `RealtimeEventPublisher`.
- Chuẩn hóa các loại sự kiện realtime chính: `MACHINE_STATUS_CHANGED`, `RESERVATION_CHANGED`, `PLAY_SESSION_CHANGED`, `FOOD_ORDER_CHANGED` và `PAYMENT_CHANGED`.
- `RealtimeEventPublisher` phát sự kiện lên topic `/topic/realtime`; nếu nghiệp vụ đang chạy trong transaction thì sự kiện chỉ được gửi sau khi transaction commit thành công.
- Bổ sung phát sự kiện realtime từ các service hiện có khi máy đổi trạng thái, đơn đặt máy thay đổi, phiên chơi bắt đầu/kết thúc/hủy, đơn dịch vụ thay đổi và thanh toán/nạp tiền cập nhật.
- Khi đặt máy, check-in đặt trước hoặc kết thúc phiên chơi làm đổi trạng thái máy, backend phát cả sự kiện của nghiệp vụ chính và sự kiện máy để các màn hình liên quan tự cập nhật.
- Bổ sung realtime client ở frontend trong `features/realtime`, dùng `@stomp/stompjs`, tự suy ra URL WebSocket từ `VITE_API_BASE_URL`, tự reconnect và gửi Bearer token hiện có khi người dùng đã đăng nhập.
- Tạo hook `useRealtimeEvents` để các màn hình chỉ cần khai báo nhóm event muốn nghe, không phải tự quản lý kết nối STOMP.
- Dashboard, quản lý máy, đặt máy, phiên chơi, dịch vụ, thanh toán, báo cáo, web đặt máy của khách và side window khách hàng đã subscribe các event liên quan để tự reload dữ liệu khi backend phát thay đổi.
- Không thay đổi schema database, không thêm bảng/cột mới; WebSocket chỉ dùng để đồng bộ trạng thái từ các nghiệp vụ hiện có.

## Kiểm thử hiện tại

Backend đã build thành công, Hibernate validate được schema SQL Server hiện có và test Spring Boot cơ bản chạy đạt. Frontend đã cài dependency, build TypeScript/Vite và lint thành công bằng Node.js portable trong `config/tools`. Route frontend `/login`, `/`, `/machines`, `/users`, `/reservations`, `/play-sessions`, `/food-services`, `/payments`, `/reports`, `/customer/login`, `/customer`, `/booking/login`, `/booking` và alias `/prebook` đã được bổ sung vào React Router; Dashboard ở route `/` đã kết nối API `/api/dashboard/overview`, Reports ở route `/reports` đã kết nối API `/api/reports/overview`, khu vực ứng dụng chính đã có route guard và auth store. Nghiệp vụ đặt máy hiện đã có điều kiện số dư đủ 1 giờ, mã đặt trước, countdown ở trang booking và countdown/check-in bằng mã tại màn hình login máy trạm. Giai đoạn WebSocket đã được kiểm tra bằng lint/build frontend và build/test backend.

## Giai đoạn tiếp theo

Theo lộ trình trong file yêu cầu, các module nghiệp vụ chính đã có nền backend/frontend và WebSocket realtime. Giai đoạn kế tiếp nên tập trung vào Testing:

- Bổ sung test backend theo từng service quan trọng, đặc biệt các luồng đặt máy, check-in đặt trước, phiên chơi, số dư ví và thanh toán.
- Bổ sung test frontend cho các màn hình chính và route guard theo role.
- Bổ sung kiểm thử tích hợp/e2e cho luồng khách hàng: đăng nhập máy trạm, đặt máy từ thiết bị cá nhân, check-in bằng mã đặt trước, gọi món, nạp tiền và tự kết thúc phiên khi hết số dư.
