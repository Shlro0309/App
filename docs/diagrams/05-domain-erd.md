# Domain ERD

Sơ đồ chỉ giữ các entity cốt lõi trực tiếp tham gia các chức năng đang được trình bày. Các entity `Game`, `Membership`, `Promotion` và `MaintenanceHistory` không xuất hiện vì chưa có module nghiệp vụ hoàn chỉnh trên giao diện.

```mermaid
erDiagram
    ROLE ||--o{ USER : "phân quyền"
    USER ||--o| CUSTOMER : "có hồ sơ"
    USER ||--o| EMPLOYEE : "có hồ sơ"

    AREA ||--o{ MACHINE : "quản lý"

    CUSTOMER ||--o{ RESERVATION : "đặt máy"
    RESERVATION ||--|{ RESERVATION_MACHINE : "gồm"
    MACHINE ||--o{ RESERVATION_MACHINE : "được đặt"

    CUSTOMER ||--o{ PLAY_SESSION : "sử dụng"
    MACHINE ||--o{ PLAY_SESSION : "chạy phiên"

    CUSTOMER ||--o{ CUSTOMER_ORDER : "đặt dịch vụ"
    EMPLOYEE o|--o{ CUSTOMER_ORDER : "xử lý"
    PLAY_SESSION o|--o{ CUSTOMER_ORDER : "phát sinh trong"
    CUSTOMER_ORDER ||--|{ ORDER_DETAIL : "gồm"
    SERVICE_ITEM ||--o{ ORDER_DETAIL : "được chọn"

    CUSTOMER ||--o{ INVOICE : "thanh toán"
    EMPLOYEE o|--o{ INVOICE : "xác nhận"
    CUSTOMER_ORDER o|--o| INVOICE : "tạo hóa đơn"
    PLAY_SESSION o|--o{ INVOICE : "liên kết"

    ROLE {
        int role_id PK
        string name
        string description
    }

    USER {
        int user_id PK
        int role_id FK
        string username
        string password_hash
        string full_name
        string phone_number
        string email
        string status
    }

    CUSTOMER {
        int customer_id PK
        int user_id FK
        decimal balance
        string online_status
        datetime registered_at
    }

    EMPLOYEE {
        int employee_id PK
        int user_id FK
        datetime hired_at
    }

    AREA {
        int area_id PK
        string name
        string description
    }

    MACHINE {
        int machine_id PK
        int area_id FK
        string name
        decimal hourly_price
        string status
        string configuration
    }

    RESERVATION {
        int reservation_id PK
        int customer_id FK
        datetime reserved_at
        datetime expires_at
        decimal deposit
        string status
    }

    RESERVATION_MACHINE {
        int reservation_id PK, FK
        int machine_id PK, FK
    }

    PLAY_SESSION {
        int session_id PK
        int customer_id FK
        int machine_id FK
        datetime started_at
        datetime ended_at
        decimal total_hourly_amount
        string status
    }

    SERVICE_ITEM {
        int service_id PK
        string name
        string service_type
        decimal price
        int stock_quantity
        string status
    }

    CUSTOMER_ORDER {
        int order_id PK
        int customer_id FK
        int employee_id FK
        int session_id FK
        datetime ordered_at
        decimal total_amount
        string status
    }

    ORDER_DETAIL {
        int order_id PK, FK
        int service_id PK, FK
        int quantity
        decimal unit_price
        decimal line_total
    }

    INVOICE {
        int invoice_id PK
        int customer_id FK
        int employee_id FK
        int order_id FK
        int session_id FK
        string transaction_type
        decimal amount
        string payment_method
        string status
        datetime transaction_at
    }
```

## Quan hệ nghiệp vụ chính

- Một user có một role và có thể có hồ sơ Customer hoặc Employee.
- Một khu vực chứa nhiều máy.
- Một reservation có thể giữ nhiều máy thông qua bảng nối.
- Mỗi play session thuộc một khách hàng và một máy.
- Một order gồm nhiều order detail; mỗi detail tham chiếu một service item.
- Invoice luôn thuộc một khách hàng và có thể liên kết order hoặc play session.
