# Sequence Diagram

Các sequence dùng cùng kiến trúc: React UI → REST Controller → Transaction Service → Repository → SQL Server. Realtime event chỉ được gửi sau khi transaction commit thành công.

## 1. Khách hàng đặt máy

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách hàng
    participant UI as React Booking UI
    participant API as ReservationController
    participant SVC as ReservationService
    participant REPO as JPA Repositories
    participant DB as SQL Server
    participant WS as Realtime Publisher

    KH->>UI: Chọn máy và xác nhận đặt
    UI->>API: POST /reservations
    API->>SVC: createReservation(currentUser, request)
    SVC->>REPO: Lấy customer và danh sách máy
    REPO->>DB: SELECT customer, machines, active reservations
    DB-->>REPO: Dữ liệu hiện tại
    REPO-->>SVC: Customer và machines
    SVC->>SVC: Kiểm tra AVAILABLE và reservation active
    SVC->>SVC: Tính cọc bằng tổng giá 1 giờ

    alt Số dư không đủ hoặc máy không khả dụng
        SVC-->>API: BusinessException
        API-->>UI: 4xx + thông báo lỗi
        UI-->>KH: Yêu cầu chọn lại/nạp tiền
    else Hợp lệ
        SVC->>REPO: Trừ số dư, lưu reservation CONFIRMED
        SVC->>REPO: Chuyển máy sang RESERVED
        REPO->>DB: UPDATE customer, INSERT reservation, UPDATE machines
        DB-->>REPO: Commit thành công
        SVC->>WS: Đăng ký event sau commit
        WS-->>UI: RESERVATION_CHANGED + MACHINE_STATUS_CHANGED
        SVC-->>API: ReservationResponse
        API-->>UI: Mã đặt và thời gian hết hạn
        UI-->>KH: Hiển thị kết quả đặt máy
    end
```

## 2. Check-in và mở phiên chơi

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách hàng
    participant UI as React Station UI
    participant AUTH as Auth API
    participant API as PlaySessionController
    participant SVC as PlaySessionService
    participant REPO as JPA Repositories
    participant DB as SQL Server
    participant WS as Realtime Publisher

    UI->>API: GET station-active?machineId
    API->>REPO: Tìm reservation CONFIRMED còn hạn
    REPO->>DB: SELECT reservation của máy
    DB-->>UI: Thông tin reservation hoặc null
    KH->>UI: Nhập tài khoản và mã đặt nếu cần
    UI->>AUTH: POST /auth/login
    AUTH-->>UI: JWT + thông tin customer

    alt Máy có reservation
        UI->>UI: Đối chiếu mã reservation
        UI->>API: POST /play-sessions/from-reservation
        API->>SVC: startFromReservation(...)
        SVC->>REPO: Lấy reservation và máy đã chọn
        REPO->>DB: SELECT reservation, customer, machines
        SVC->>SVC: Kiểm tra chủ sở hữu, hạn và trạng thái
        SVC->>REPO: Hoàn cọc tương ứng
    else Máy không có reservation
        UI->>API: POST /play-sessions
        API->>SVC: startSession(...)
        SVC->>REPO: Kiểm tra customer và máy AVAILABLE
    end

    SVC->>REPO: Tạo PlaySession ACTIVE
    SVC->>REPO: Chuyển máy sang PLAYING
    REPO->>DB: INSERT session + UPDATE customer/machine/reservation
    DB-->>REPO: Commit thành công
    SVC->>WS: Đăng ký event sau commit
    WS-->>UI: PLAY_SESSION_CHANGED + MACHINE_STATUS_CHANGED
    SVC-->>API: PlaySessionResponse
    API-->>UI: Phiên chơi đã mở
    UI-->>KH: Hiển thị màn hình phiên chơi
```

## 3. Hệ thống tự động trừ tiền phiên chơi

```mermaid
sequenceDiagram
    autonumber
    actor SYS as Scheduler hệ thống
    participant SVC as PlaySessionService
    participant REPO as JPA Repositories
    participant DB as SQL Server
    participant WS as Realtime Publisher
    participant UI as Các màn hình React

    loop Mỗi 30 giây
        SYS->>SVC: endSessionsWithDepletedBalance()
        SVC->>REPO: Tìm tất cả session ACTIVE
        REPO->>DB: SELECT active play sessions
        DB-->>REPO: Danh sách session

        loop Với từng session
            SVC->>SVC: Tính phí mục tiêu theo số giây
            SVC->>SVC: Tính phần phí tăng thêm
            SVC->>REPO: Trừ số dư và cập nhật tổng phí

            alt Số dư đã hết
                SVC->>REPO: Chuyển session COMPLETED
                SVC->>REPO: Chuyển máy AVAILABLE
                SVC->>REPO: Chuyển customer OFFLINE
                SVC->>WS: PLAY_SESSION_CHANGED (AUTO_COMPLETED)
                SVC->>WS: MACHINE_STATUS_CHANGED
            else Vẫn còn số dư
                SVC->>WS: PLAY_SESSION_CHANGED (BALANCE_UPDATED)
            end

            REPO->>DB: UPDATE session, customer, machine
        end
    end

    DB-->>WS: Transaction commit
    WS-->>UI: Gửi event trên /topic/realtime
    UI->>UI: Tải lại phiên, số dư và trạng thái máy
```

## 4. Khách hàng gọi món và thanh toán

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách hàng
    participant UI as React Customer UI
    participant API as FoodOrderController
    participant SVC as FoodServiceManagementService
    participant REPO as JPA Repositories
    participant DB as SQL Server
    participant WS as Realtime Publisher

    KH->>UI: Chọn món, số lượng và cách thanh toán
    UI->>API: POST /food-orders
    API->>SVC: createOrder(currentUser, request)
    SVC->>REPO: Kiểm tra customer và phiên ACTIVE
    SVC->>REPO: Khóa các ServiceItem cần mua
    REPO->>DB: SELECT service items FOR UPDATE
    DB-->>REPO: Tồn kho hiện tại
    SVC->>SVC: Kiểm tra ACTIVE và đủ số lượng
    SVC->>REPO: Tạo order, order details và trừ tồn kho

    alt Thanh toán bằng ACCOUNT_BALANCE
        SVC->>SVC: Kiểm tra số dư
        SVC->>REPO: Trừ số dư
        SVC->>REPO: Tạo invoice PAID
        SVC->>REPO: Chuyển order PREPARING
    else Tiền mặt hoặc chuyển khoản
        SVC->>REPO: Tạo invoice PENDING
        SVC->>REPO: Giữ order PENDING
    end

    REPO->>DB: INSERT order/details/invoice + UPDATE stock/balance
    DB-->>REPO: Commit thành công
    SVC->>WS: FOOD_ORDER_CHANGED
    SVC->>WS: PAYMENT_CHANGED
    WS-->>UI: Realtime events
    SVC-->>API: CustomerOrderResponse
    API-->>UI: Đơn hàng đã tạo
    UI-->>KH: Hiển thị trạng thái đơn
```
