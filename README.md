# Cyber Game Management

He thong quan ly Cyber Game gom backend Spring Boot va frontend React/Vite.

## Cong nghe

- Backend: Java 21, Spring Boot 3.x, Spring Security, JWT, Spring Data JPA, Hibernate, Maven, Lombok, MapStruct, WebSocket, OpenAPI.
- Frontend: React 19, Vite, TypeScript, React Router, Axios, Zustand, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Recharts, Framer Motion.
- Database: Microsoft SQL Server.

## Cau truc

```text
App/
  backend/
  frontend/
  README.md
```

Backend tuan theo mo hinh:

```text
controller -> service -> repository -> database
```

Frontend duoc chia theo:

```text
api, components, features, hooks, layouts, pages, routes, stores, types, utils, assets
```

## Database

Schema goc nam tai:

```text
../Database/script chứa bảng và quan hệ.sql
```

Quy uoc cua du an:

- Khong tu y sua cau truc database.
- Hibernate dung `ddl-auto=validate`.
- Entity se duoc sinh/map theo dung bang va khoa ngoai trong file SQL.
- Khong tra Entity truc tiep ra API, chi tra DTO.

## Yeu cau moi truong

- Java 21
- Maven 3.9+
- Node.js 20+
- Microsoft SQL Server

## Chay backend

Tao bien moi truong hoac sua theo `backend/.env.example`, sau do:

```bash
cd backend
mvn spring-boot:run
```

Swagger UI:

```text
http://localhost:8080/api/swagger-ui.html
```

## Chay frontend

Tao bien moi truong theo `frontend/.env.example`, sau do:

```bash
cd frontend
npm install
npm run dev
```

Frontend mac dinh:

```text
http://localhost:5173
```

## Trang thai hien tai

Da hoan thanh giai doan 1:

- Tao khung backend Spring Boot.
- Tao khung frontend React/Vite.
- Cau hinh SQL Server profile local.
- Cau hinh Swagger/OpenAPI.
- Cau hinh Global Exception Handler nen tang.
- Cau hinh Tailwind/shadcn/ui nen tang.
- Chua them bang moi vao database.

Giai doan tiep theo: cau hinh ket noi SQL Server va sinh/map Entity tu schema hien co.
