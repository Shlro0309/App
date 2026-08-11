# Component và Deployment Diagram

## 1. Component Diagram

```mermaid
flowchart LR
    subgraph CLIENT["Frontend React/Vite"]
        pages["Pages & Feature Components"]
        store["Zustand Auth Store"]
        apiClient["Feature API Modules"]
        axios["Axios + JWT Interceptors"]
        realtimeClient["STOMP Realtime Client"]

        pages --> store
        pages --> apiClient
        apiClient --> axios
        realtimeClient --> pages
    end

    subgraph BACKEND["Backend Spring Boot"]
        security["Spring Security + JWT Filter"]
        controllers["REST Controllers"]
        services["Transactional Business Services"]
        repositories["Spring Data JPA Repositories"]
        scheduler["Scheduled Jobs"]
        publisher["Realtime Event Publisher"]
        broker["STOMP Simple Broker"]

        security --> controllers
        controllers --> services
        scheduler --> services
        services --> repositories
        services --> publisher
        publisher -->|"after commit"| broker
    end

    database[("SQL Server")]

    axios -->|"REST /api + Bearer JWT"| security
    repositories -->|"JPA/Hibernate"| database
    realtimeClient -->|"WebSocket /api/ws"| broker
    broker -->|"/topic/realtime"| realtimeClient
```

## 2. Deployment Diagram

```mermaid
flowchart TB
    subgraph USER_DEVICES["Thiết bị người dùng"]
        personal["Laptop/Điện thoại khách hàng"]
        station["Máy trạm Cyber Game"]
        operator["Máy quản lý Admin/Employee"]
    end

    subgraph APP_HOST["Application Host"]
        frontend["React/Vite Frontend\nPort 5173"]
        backend["Spring Boot Backend\nPort 8081 · Context /api"]
        websocket["STOMP WebSocket\nEndpoint /api/ws"]
    end

    subgraph DATA_HOST["Database Host"]
        sql[("Microsoft SQL Server\nPort 1433\nCyberGameManagement")]
    end

    personal -->|"HTTP"| frontend
    station -->|"HTTP"| frontend
    operator -->|"HTTP"| frontend
    frontend -->|"REST + JWT"| backend
    frontend <-->|"WebSocket realtime"| websocket
    websocket --- backend
    backend -->|"JDBC/JPA"| sql
```

## Giao thức và endpoint chính

| Kết nối | Giao thức | Địa chỉ local |
| --- | --- | --- |
| Browser → Frontend | HTTP | `http://localhost:5173/` |
| Frontend → Backend | REST/JSON + JWT | `http://localhost:8081/api` |
| Frontend ↔ Realtime | WebSocket/STOMP | `ws://localhost:8081/api/ws` |
| Backend → Database | JDBC | `localhost:1433/CyberGameManagement` |

## Luồng đồng bộ dữ liệu

1. UI gửi REST request kèm access token.
2. JWT filter xác thực và chuyển request vào controller.
3. Service thực hiện nghiệp vụ trong transaction và lưu qua repository.
4. Sau khi database commit, publisher gửi realtime event.
5. Frontend nhận event rồi tải lại dữ liệu REST liên quan.
