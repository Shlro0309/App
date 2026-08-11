# Use Case Diagram tổng quan

Sơ đồ tập trung vào nghiệp vụ đặc trưng của Cyber Game. Actor **Khách hàng** bao gồm cả giai đoạn trước và sau đăng nhập.

```mermaid
flowchart LR
    customer["Khách hàng"]
    employee["Nhân viên"]
    admin["Quản trị viên"]
    automation["Hệ thống"]

    subgraph CGM["Cyber Game Management"]
        direction TB

        subgraph CUSTOMER_UC["Nghiệp vụ khách hàng"]
            account(["Truy cập tài khoản"])
            machineView(["Xem tình trạng máy"])
            reserve(["Đặt máy trước"])
            checkin(["Check-in tại máy trạm"])
            play(["Sử dụng phiên chơi"])
            order(["Gọi dịch vụ"])
            customerPayment(["Nạp tiền và thanh toán"])
        end

        subgraph EMPLOYEE_UC["Nghiệp vụ vận hành"]
            dashboard(["Theo dõi hoạt động phòng máy"])
            machineOps(["Vận hành máy trạm"])
            customerOps(["Quản lý khách hàng"])
            reservationOps(["Xử lý đặt máy"])
            sessionOps(["Quản lý phiên chơi"])
            serviceOps(["Quản lý dịch vụ và đơn hàng"])
            paymentOps(["Xử lý thanh toán"])
        end

        subgraph ADMIN_UC["Nghiệp vụ quản trị"]
            roleOps(["Quản lý tài khoản và phân quyền"])
            configOps(["Cấu hình máy và khu vực"])
            reports(["Xem báo cáo"])
        end

        subgraph SYSTEM_UC["Nghiệp vụ tự động"]
            deposit(["Quản lý tiền cọc"])
            expire(["Hết hạn đặt máy"])
            charge(["Tính phí phiên chơi"])
            stock(["Quản lý tồn kho"])
            realtime(["Đồng bộ realtime"])
        end

        validateMachine(["Kiểm tra máy"])
        validateBalance(["Kiểm tra số dư"])
        authenticate(["Xác thực khách hàng"])
        validateReservation(["Kiểm tra reservation"])
        createSession(["Mở phiên chơi"])
        createOrder(["Tạo đơn và hóa đơn"])
    end

    customer --- account
    customer --- machineView
    customer --- reserve
    customer --- checkin
    customer --- play
    customer --- order
    customer --- customerPayment

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

    automation --- deposit
    automation --- expire
    automation --- charge
    automation --- stock
    automation --- realtime

    reserve -.->|"<<include>>"| validateMachine
    reserve -.->|"<<include>>"| validateBalance
    reserve -.->|"<<include>>"| deposit
    checkin -.->|"<<include>>"| authenticate
    checkin -.->|"<<include>>"| validateReservation
    checkin -.->|"<<include>>"| createSession
    play -.->|"<<include>>"| charge
    order -.->|"<<include>>"| stock
    order -.->|"<<include>>"| createOrder
```

## Phạm vi chức năng theo tác nhân

| Nhóm | Chức năng tiêu biểu |
| --- | --- |
| Khách hàng | Truy cập tài khoản, xem máy, đặt máy, check-in, chơi, gọi dịch vụ, nạp tiền và thanh toán |
| Nhân viên | Dashboard, vận hành máy, quản lý khách hàng, reservation, phiên chơi, dịch vụ và thanh toán |
| Quản trị viên | Kế thừa Nhân viên, thêm phân quyền, cấu hình máy/khu vực và báo cáo |
| Hệ thống | Tiền cọc, hết hạn reservation, tính phí, tồn kho và realtime |
