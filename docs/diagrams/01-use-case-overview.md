# Use Case Diagram

Actor **Khách hàng** bao gồm cả giai đoạn trước và sau đăng nhập. Sơ đồ đầu tiên là bản rút gọn nên dùng trên slide; các sơ đồ phía dưới dùng khi cần trình bày chi tiết.

## 1. Use Case tổng quan — dùng cho slide chính

```mermaid
flowchart LR
    subgraph PEOPLE["Người dùng"]
        direction TB
        customer["Khách hàng"]
        employee["Nhân viên"]
        admin["Quản trị viên"]
    end

    subgraph CGM["CYBER GAME MANAGEMENT"]
        direction TB

        subgraph CUSTOMER_ROW["Trải nghiệm khách hàng"]
            direction LR
            useMachine(["Đặt và sử dụng máy"])
            orderService(["Gọi dịch vụ"])
            customerPayment(["Nạp tiền và thanh toán"])
        end

        subgraph OPERATION_ROW["Vận hành phòng máy"]
            direction LR
            roomOps(["Vận hành máy và phiên chơi"])
            customerOps(["Quản lý khách hàng và đặt máy"])
            serviceOps(["Xử lý dịch vụ và thanh toán"])
        end

        subgraph ADMIN_ROW["Quản trị"]
            direction LR
            systemConfig(["Quản trị hệ thống"])
            reports(["Báo cáo và thống kê"])
        end

        subgraph AUTO_ROW["Tự động hóa"]
            direction LR
            automationOps(["Cọc · hết hạn · tính phí · tồn kho"])
            realtime(["Đồng bộ realtime"])
        end
    end

    systemActor["Hệ thống"]

    customer --- useMachine
    customer --- orderService
    customer --- customerPayment

    employee --- roomOps
    employee --- customerOps
    employee --- serviceOps

    admin -. "kế thừa" .-> employee
    admin --- systemConfig
    admin --- reports

    systemActor --- automationOps
    systemActor --- realtime

    classDef actor fill:#0f172a,color:#ffffff,stroke:#38bdf8,stroke-width:2px
    classDef customerCase fill:#ecfeff,stroke:#0891b2,color:#164e63
    classDef operationCase fill:#eff6ff,stroke:#2563eb,color:#1e3a8a
    classDef adminCase fill:#faf5ff,stroke:#9333ea,color:#581c87
    classDef systemCase fill:#f0fdf4,stroke:#16a34a,color:#14532d

    class customer,employee,admin,systemActor actor
    class useMachine,orderService,customerPayment customerCase
    class roomOps,customerOps,serviceOps operationCase
    class systemConfig,reports adminCase
    class automationOps,realtime systemCase
```

Sơ đồ chính chỉ có 10 use case cấp cao. Các thao tác đăng nhập, kiểm tra số dư, tạo hóa đơn và cập nhật trạng thái được đặt bên trong luồng nghiệp vụ thay vì vẽ thành use case độc lập.

## 2. Chi tiết Khách hàng

```mermaid
flowchart TB
    customer["Khách hàng"]

    subgraph CUSTOMER_UC["Chức năng khách hàng"]
        direction LR
        account(["Truy cập tài khoản"])
        viewMachine(["Xem tình trạng máy"])
        reserve(["Đặt máy trước"])
        checkin(["Check-in tại máy trạm"])
        play(["Sử dụng phiên chơi"])
        order(["Gọi dịch vụ"])
        payment(["Nạp tiền và thanh toán"])
    end

    subgraph INCLUDED["Chức năng được bao gồm"]
        direction LR
        checkMachine(["Kiểm tra máy"])
        checkBalance(["Kiểm tra số dư"])
        deposit(["Xử lý tiền cọc"])
        verifyReservation(["Kiểm tra reservation"])
        openSession(["Mở phiên chơi"])
        createInvoice(["Tạo đơn và hóa đơn"])
    end

    customer --- account
    customer --- viewMachine
    customer --- reserve
    customer --- checkin
    customer --- play
    customer --- order
    customer --- payment

    reserve -.->|"<<include>>"| checkMachine
    reserve -.->|"<<include>>"| checkBalance
    reserve -.->|"<<include>>"| deposit
    checkin -.->|"<<include>>"| verifyReservation
    checkin -.->|"<<include>>"| openSession
    order -.->|"<<include>>"| createInvoice
```

## 3. Chi tiết Nhân viên và Quản trị viên

```mermaid
flowchart LR
    employee["Nhân viên"]

    subgraph EMPLOYEE_UC["Vận hành hằng ngày"]
        direction TB
        dashboard(["Theo dõi hoạt động phòng máy"])
        machineOps(["Vận hành máy trạm"])
        customerOps(["Quản lý khách hàng"])
        reservationOps(["Xử lý đặt máy"])
        sessionOps(["Quản lý phiên chơi"])
        serviceOps(["Quản lý dịch vụ và đơn hàng"])
        paymentOps(["Xử lý thanh toán"])
    end

    admin["Quản trị viên"]

    subgraph ADMIN_UC["Quyền quản trị bổ sung"]
        direction TB
        roleOps(["Quản lý tài khoản và phân quyền"])
        configOps(["Cấu hình máy và khu vực"])
        reports(["Xem báo cáo"])
    end

    employee --- dashboard
    employee --- machineOps
    employee --- customerOps
    employee --- reservationOps
    employee --- sessionOps
    employee --- serviceOps
    employee --- paymentOps

    admin -. "kế thừa" .-> employee
    admin --- roleOps
    admin --- configOps
    admin --- reports
```

## 4. Chi tiết Hệ thống

```mermaid
flowchart TB
    systemActor["Hệ thống"]

    subgraph SYSTEM_UC["Tác vụ tự động"]
        direction LR
        deposit(["Quản lý tiền cọc"])
        expire(["Hết hạn đặt máy"])
        charge(["Tính phí phiên chơi"])
        stock(["Quản lý tồn kho"])
        realtime(["Đồng bộ realtime"])
    end

    systemActor --- deposit
    systemActor --- expire
    systemActor --- charge
    systemActor --- stock
    systemActor --- realtime
```

## Phạm vi chức năng theo tác nhân

| Tác nhân | Chức năng tiêu biểu |
| --- | --- |
| Khách hàng | Đặt và sử dụng máy, gọi dịch vụ, nạp tiền và thanh toán |
| Nhân viên | Vận hành máy/phiên chơi, quản lý khách hàng/đặt máy, xử lý dịch vụ/thanh toán |
| Quản trị viên | Kế thừa Nhân viên, quản trị hệ thống và xem báo cáo |
| Hệ thống | Xử lý cọc, hết hạn reservation, tính phí, tồn kho và realtime |
