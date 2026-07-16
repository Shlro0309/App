# Cyber Game Management (bài tập lớn đầu tiên của tôi)

Hệ thống quản lý Cyber Game gồm backend Spring Boot và frontend React/Vite.

## Công cụ

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

Quy ươc của dụ án:

- Không tự ý chỉnh sửa cấu trúc database.
- Hibernate dùng `ddl-auto=validate`.
- Entity sẽ được sinh/map theo đúng bảng và khóa ngoại trong file SQL.
- Không trả Entity trực tiếp ra API, chi trả DTO.

## Yêu cầu môi trường cho dự án này

- Java 21
- Maven 3.9+
- Node.js 20+
- Microsoft SQL Server

## Chạy backend

tạo biến môi trường theo `backend/.env.example`, sau đó:

```bash
cd backend
mvn spring-boot:run
```

Swagger UI:

```text
http://localhost:8080/api/swagger-ui.html
```

## Chạy frontend

tạo biến môi trường theo `frontend/.env.example`, sau đó:

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định:

```text
http://localhost:5173
```

## Tiến độ hiện tại

Đã hoan thanh giai doan 1:

- Tao khung backend Spring Boot.
- Tao khung frontend React/Vite.
- Cau hinh SQL Server profile local.
- Cau hinh Swagger/OpenAPI.
- Cau hinh Global Exception Handler nen tang.
- Cau hinh Tailwind/shadcn/ui nen tang.
- Chua them bang moi vao database.

Giai doan tiep theo: cau hinh ket noi SQL Server va sinh/map Entity tu schema hien co.
