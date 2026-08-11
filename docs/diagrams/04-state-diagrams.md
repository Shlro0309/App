# State Diagram

## 1. Machine

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE
    AVAILABLE --> RESERVED: Tạo reservation
    RESERVED --> PLAYING: Check-in reservation
    RESERVED --> AVAILABLE: Hủy / hết hạn reservation
    AVAILABLE --> PLAYING: Mở phiên trực tiếp
    PLAYING --> AVAILABLE: Kết thúc / hủy phiên
    AVAILABLE --> MAINTENANCE: Đưa máy đi bảo trì
    MAINTENANCE --> AVAILABLE: Hoàn tất bảo trì
```

## 2. Reservation

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> CONFIRMED: Xác nhận
    PENDING --> CANCELLED: Hủy
    CONFIRMED --> COMPLETED: Check-in toàn bộ máy
    CONFIRMED --> CANCELLED: Hủy hợp lệ
    CONFIRMED --> EXPIRED: Quá thời gian giữ chỗ
    COMPLETED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]
```

> Service hiện tạo reservation mới trực tiếp ở trạng thái `CONFIRMED`; `PENDING` vẫn tồn tại trong enum và luồng quản trị.

## 3. Play Session

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Mở phiên
    ACTIVE --> COMPLETED: Khách kết thúc
    ACTIVE --> COMPLETED: Hết số dư
    ACTIVE --> CANCELLED: Nhân viên/Admin hủy
    COMPLETED --> [*]
    CANCELLED --> [*]
```

## 4. Food Order

```mermaid
stateDiagram-v2
    [*] --> PENDING: Tạo đơn chờ thanh toán
    [*] --> PREPARING: Trả ngay bằng số dư
    PENDING --> PREPARING: Xác nhận thanh toán
    PENDING --> CANCELLED: Hủy đơn/hóa đơn
    PREPARING --> COMPLETED: Giao món
    PREPARING --> CANCELLED: Hủy và hoàn tiền/tồn kho
    COMPLETED --> [*]
    CANCELLED --> [*]
```

## 5. Invoice

```mermaid
stateDiagram-v2
    [*] --> PENDING: Chờ thanh toán
    [*] --> PAID: Thanh toán ngay bằng số dư
    PENDING --> PAID: Nhân viên xác nhận
    PENDING --> CANCELLED: Hủy giao dịch
    PAID --> REFUNDED: Hoàn tiền
    PAID --> [*]
    CANCELLED --> [*]
    REFUNDED --> [*]
```
