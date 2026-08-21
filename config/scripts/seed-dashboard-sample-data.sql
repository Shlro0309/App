USE [CyberGameManagement];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @now datetime = GETDATE();
    DECLARE @today datetime = CONVERT(date, @now);
    DECLARE @tomorrow datetime = DATEADD(day, 1, @today);
    DECLARE @password nvarchar(255) = N'$2a$10$Q0mBjkwIscPnNHndcgJkIumJu90e5QMxa0.nrk0RY9BfldySt4Dl2';

    DECLARE @adminRole int = (SELECT maQuyen FROM dbo.phanQuyen WHERE tenQuyen = N'ADMIN');
    DECLARE @employeeRole int = (SELECT maQuyen FROM dbo.phanQuyen WHERE tenQuyen = N'EMPLOYEE');
    DECLARE @customerRole int = (SELECT maQuyen FROM dbo.phanQuyen WHERE tenQuyen = N'CUSTOMER');

    IF @adminRole IS NULL
    BEGIN
        INSERT INTO dbo.phanQuyen (tenQuyen, moTa) VALUES (N'ADMIN', N'System administrator');
        SET @adminRole = SCOPE_IDENTITY();
    END;

    IF @employeeRole IS NULL
    BEGIN
        INSERT INTO dbo.phanQuyen (tenQuyen, moTa) VALUES (N'EMPLOYEE', N'Cyber Game employee');
        SET @employeeRole = SCOPE_IDENTITY();
    END;

    IF @customerRole IS NULL
    BEGIN
        INSERT INTO dbo.phanQuyen (tenQuyen, moTa) VALUES (N'CUSTOMER', N'Cyber Game customer');
        SET @customerRole = SCOPE_IDENTITY();
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.nguoiDung WHERE tenDangNhap = N'demo_admin')
    BEGIN
        INSERT INTO dbo.nguoiDung (tenDangNhap, matKhau, hoTen, soDienThoai, email, maQuyen, trangThai, ngayTao)
        VALUES (N'demo_admin', @password, N'Demo Admin', '0901000001', N'admin.demo@cybergame.local', @adminRole, 1, DATEADD(day, -20, @now));
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.nguoiDung WHERE tenDangNhap = N'demo_employee')
    BEGIN
        INSERT INTO dbo.nguoiDung (tenDangNhap, matKhau, hoTen, soDienThoai, email, maQuyen, trangThai, ngayTao)
        VALUES (N'demo_employee', @password, N'Demo Employee', '0901000002', N'employee.demo@cybergame.local', @employeeRole, 1, DATEADD(day, -18, @now));
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.nguoiDung WHERE tenDangNhap = N'demo_customer_01')
    BEGIN
        INSERT INTO dbo.nguoiDung (tenDangNhap, matKhau, hoTen, soDienThoai, email, maQuyen, trangThai, ngayTao)
        VALUES (N'demo_customer_01', @password, N'Nguyen Minh Quan', '0901000101', N'quan.demo@cybergame.local', @customerRole, 1, DATEADD(day, -15, @now));
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.nguoiDung WHERE tenDangNhap = N'demo_customer_02')
    BEGIN
        INSERT INTO dbo.nguoiDung (tenDangNhap, matKhau, hoTen, soDienThoai, email, maQuyen, trangThai, ngayTao)
        VALUES (N'demo_customer_02', @password, N'Tran Hoang Linh', '0901000102', N'linh.demo@cybergame.local', @customerRole, 1, DATEADD(day, -12, @now));
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.nguoiDung WHERE tenDangNhap = N'demo_customer_03')
    BEGIN
        INSERT INTO dbo.nguoiDung (tenDangNhap, matKhau, hoTen, soDienThoai, email, maQuyen, trangThai, ngayTao)
        VALUES (N'demo_customer_03', @password, N'Le Gia Huy', '0901000103', N'huy.demo@cybergame.local', @customerRole, 1, DATEADD(day, -9, @now));
    END;

    UPDATE dbo.nguoiDung
    SET matKhau = @password,
        trangThai = 1
    WHERE tenDangNhap IN (
        N'demo_admin',
        N'demo_employee',
        N'demo_customer_01',
        N'demo_customer_02',
        N'demo_customer_03'
    );

    DECLARE @employeeUser int = (SELECT maNguoiDung FROM dbo.nguoiDung WHERE tenDangNhap = N'demo_employee');
    IF NOT EXISTS (SELECT 1 FROM dbo.nhanVien WHERE maNguoiDung = @employeeUser)
    BEGIN
        INSERT INTO dbo.nhanVien (maNguoiDung, caLamViec, ngayVaoLam)
        VALUES (@employeeUser, N'Ca chiều', DATEADD(day, -18, CONVERT(date, @now)));
    END;

    INSERT INTO dbo.khachHang (maNguoiDung, soDu, trangThaiOnline, ngayDangKy)
    SELECT u.maNguoiDung, 250000, 1, DATEADD(day, -15, @now)
    FROM dbo.nguoiDung u
    WHERE u.tenDangNhap = N'demo_customer_01'
      AND NOT EXISTS (SELECT 1 FROM dbo.khachHang c WHERE c.maNguoiDung = u.maNguoiDung);

    INSERT INTO dbo.khachHang (maNguoiDung, soDu, trangThaiOnline, ngayDangKy)
    SELECT u.maNguoiDung, 180000, 1, DATEADD(day, -12, @now)
    FROM dbo.nguoiDung u
    WHERE u.tenDangNhap = N'demo_customer_02'
      AND NOT EXISTS (SELECT 1 FROM dbo.khachHang c WHERE c.maNguoiDung = u.maNguoiDung);

    INSERT INTO dbo.khachHang (maNguoiDung, soDu, trangThaiOnline, ngayDangKy)
    SELECT u.maNguoiDung, 90000, 0, DATEADD(day, -9, @now)
    FROM dbo.nguoiDung u
    WHERE u.tenDangNhap = N'demo_customer_03'
      AND NOT EXISTS (SELECT 1 FROM dbo.khachHang c WHERE c.maNguoiDung = u.maNguoiDung);

    IF NOT EXISTS (SELECT 1 FROM dbo.khuVuc WHERE tenKhuVuc = N'Khu Alpha')
        INSERT INTO dbo.khuVuc (tenKhuVuc, moTa) VALUES (N'Khu Alpha', N'Khu thi đấu cấu hình cao');
    IF NOT EXISTS (SELECT 1 FROM dbo.khuVuc WHERE tenKhuVuc = N'Khu Beta')
        INSERT INTO dbo.khuVuc (tenKhuVuc, moTa) VALUES (N'Khu Beta', N'Khu phổ thông cho nhóm bạn');
    IF NOT EXISTS (SELECT 1 FROM dbo.khuVuc WHERE tenKhuVuc = N'Khu Stream')
        INSERT INTO dbo.khuVuc (tenKhuVuc, moTa) VALUES (N'Khu Stream', N'Khu stream và training');

    DECLARE @alpha int = (SELECT maKhuVuc FROM dbo.khuVuc WHERE tenKhuVuc = N'Khu Alpha');
    DECLARE @beta int = (SELECT maKhuVuc FROM dbo.khuVuc WHERE tenKhuVuc = N'Khu Beta');
    DECLARE @stream int = (SELECT maKhuVuc FROM dbo.khuVuc WHERE tenKhuVuc = N'Khu Stream');

    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'ALPHA-01')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'ALPHA-01', @alpha, N'Intel Core i7-13700F', N'RTX 4070', 32, 240, '2560x1440', 35000, 0, DATEADD(day, -30, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'ALPHA-02')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'ALPHA-02', @alpha, N'Intel Core i7-13700F', N'RTX 4070', 32, 240, '2560x1440', 35000, 2, DATEADD(day, -30, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'ALPHA-03')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'ALPHA-03', @alpha, N'AMD Ryzen 7 7800X3D', N'RTX 4080', 32, 240, '2560x1440', 45000, 2, DATEADD(day, -28, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'BETA-01')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'BETA-01', @beta, N'Intel Core i5-12400F', N'RTX 3060', 16, 165, '1920x1080', 22000, 0, DATEADD(day, -25, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'BETA-02')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'BETA-02', @beta, N'Intel Core i5-12400F', N'RTX 3060', 16, 165, '1920x1080', 22000, 1, DATEADD(day, -25, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'BETA-03')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'BETA-03', @beta, N'Intel Core i5-12400F', N'RTX 3060', 16, 165, '1920x1080', 22000, 3, DATEADD(day, -23, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'STREAM-01')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'STREAM-01', @stream, N'AMD Ryzen 9 7900X', N'RTX 4070 Ti', 64, 240, '2560x1440', 50000, 2, DATEADD(day, -20, @now));
    IF NOT EXISTS (SELECT 1 FROM dbo.mayTram WHERE tenMay = N'STREAM-02')
        INSERT INTO dbo.mayTram (tenMay, maKhuVuc, cpu, gpu, ram, fps, resolution, giaTheoGio, trangThai, ngayThem)
        VALUES (N'STREAM-02', @stream, N'AMD Ryzen 9 7900X', N'RTX 4070 Ti', 64, 240, '2560x1440', 50000, 4, DATEADD(day, -20, @now));

    DECLARE @c1 int = (SELECT c.maKhachHang FROM dbo.khachHang c JOIN dbo.nguoiDung u ON u.maNguoiDung = c.maNguoiDung WHERE u.tenDangNhap = N'demo_customer_01');
    DECLARE @c2 int = (SELECT c.maKhachHang FROM dbo.khachHang c JOIN dbo.nguoiDung u ON u.maNguoiDung = c.maNguoiDung WHERE u.tenDangNhap = N'demo_customer_02');
    DECLARE @c3 int = (SELECT c.maKhachHang FROM dbo.khachHang c JOIN dbo.nguoiDung u ON u.maNguoiDung = c.maNguoiDung WHERE u.tenDangNhap = N'demo_customer_03');
    DECLARE @employee int = (SELECT e.maNhanVien FROM dbo.nhanVien e JOIN dbo.nguoiDung u ON u.maNguoiDung = e.maNguoiDung WHERE u.tenDangNhap = N'demo_employee');

    DECLARE @mAlpha02 int = (SELECT maMay FROM dbo.mayTram WHERE tenMay = N'ALPHA-02');
    DECLARE @mAlpha03 int = (SELECT maMay FROM dbo.mayTram WHERE tenMay = N'ALPHA-03');
    DECLARE @mStream01 int = (SELECT maMay FROM dbo.mayTram WHERE tenMay = N'STREAM-01');
    DECLARE @mBeta02 int = (SELECT maMay FROM dbo.mayTram WHERE tenMay = N'BETA-02');
    DECLARE @mBeta01 int = (SELECT maMay FROM dbo.mayTram WHERE tenMay = N'BETA-01');

    IF NOT EXISTS (SELECT 1 FROM dbo.dichVu WHERE tenDichVu = N'Sting dâu')
        INSERT INTO dbo.dichVu (tenDichVu, gia, loaiDichVu, hinhAnh, soLuongTon, trangThai) VALUES (N'Sting dâu', 15000, N'Nước uống', N'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=640&q=80', 40, 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.dichVu WHERE tenDichVu = N'Mì ly hải sản')
        INSERT INTO dbo.dichVu (tenDichVu, gia, loaiDichVu, hinhAnh, soLuongTon, trangThai) VALUES (N'Mì ly hải sản', 25000, N'Đồ ăn', N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=640&q=80', 18, 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.dichVu WHERE tenDichVu = N'Combo snack')
        INSERT INTO dbo.dichVu (tenDichVu, gia, loaiDichVu, hinhAnh, soLuongTon, trangThai) VALUES (N'Combo snack', 35000, N'Combo', N'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=640&q=80', 4, 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.dichVu WHERE tenDichVu = N'Cà phê lon')
        INSERT INTO dbo.dichVu (tenDichVu, gia, loaiDichVu, hinhAnh, soLuongTon, trangThai) VALUES (N'Cà phê lon', 18000, N'Nước uống', N'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=640&q=80', 25, 1);
    IF NOT EXISTS (SELECT 1 FROM dbo.dichVu WHERE tenDichVu = N'Trà chanh')
        INSERT INTO dbo.dichVu (tenDichVu, gia, loaiDichVu, hinhAnh, soLuongTon, trangThai) VALUES (N'Trà chanh', 12000, N'Nước uống', N'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=640&q=80', 0, 0);

    UPDATE dbo.dichVu
    SET hinhAnh = CASE tenDichVu
        WHEN N'Sting dâu' THEN N'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=640&q=80'
        WHEN N'Mì ly hải sản' THEN N'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=640&q=80'
        WHEN N'Combo snack' THEN N'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=640&q=80'
        WHEN N'Cà phê lon' THEN N'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=640&q=80'
        WHEN N'Trà chanh' THEN N'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=640&q=80'
        ELSE hinhAnh
    END
    WHERE tenDichVu IN (N'Sting dâu', N'Mì ly hải sản', N'Combo snack', N'Cà phê lon', N'Trà chanh');

    DECLARE @dc1 int;
    IF NOT EXISTS (SELECT 1 FROM dbo.datCho WHERE maKhachHang = @c3 AND thoiGianDat >= @today AND thoiGianDat < @tomorrow AND trangThai IN (0, 1))
    BEGIN
        INSERT INTO dbo.datCho (maKhachHang, thoiGianDat, thoiGianHetHan, tienCoc, trangThai)
        VALUES (@c3, DATEADD(hour, 1, @now), DATEADD(hour, 3, @now), 50000, 1);
        SET @dc1 = SCOPE_IDENTITY();
        INSERT INTO dbo.datCho_mayTram (maDatCho, maMay) VALUES (@dc1, @mBeta02);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.datCho WHERE maKhachHang = @c1 AND thoiGianDat >= @today AND thoiGianDat < @tomorrow AND trangThai = 0)
    BEGIN
        INSERT INTO dbo.datCho (maKhachHang, thoiGianDat, thoiGianHetHan, tienCoc, trangThai)
        VALUES (@c1, DATEADD(hour, 4, @now), DATEADD(hour, 6, @now), 30000, 0);
        SET @dc1 = SCOPE_IDENTITY();
        INSERT INTO dbo.datCho_mayTram (maDatCho, maMay) VALUES (@dc1, @mBeta01);
    END;

    DECLARE @active1 int = (SELECT TOP 1 maPhien FROM dbo.phienChoi WHERE maMay = @mAlpha02 AND trangThai = 0 ORDER BY maPhien DESC);
    IF @active1 IS NULL
    BEGIN
        INSERT INTO dbo.phienChoi (maKhachHang, maMay, thoiGianBatDau, thoiGianKetThuc, tongTienGio, trangThai)
        VALUES (@c1, @mAlpha02, DATEADD(minute, -95, @now), NULL, NULL, 0);
        SET @active1 = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.phienChoi SET maKhachHang = @c1, thoiGianBatDau = DATEADD(minute, -95, @now), thoiGianKetThuc = NULL, tongTienGio = NULL, trangThai = 0 WHERE maPhien = @active1;
    END;

    DECLARE @active2 int = (SELECT TOP 1 maPhien FROM dbo.phienChoi WHERE maMay = @mAlpha03 AND trangThai = 0 ORDER BY maPhien DESC);
    IF @active2 IS NULL
    BEGIN
        INSERT INTO dbo.phienChoi (maKhachHang, maMay, thoiGianBatDau, thoiGianKetThuc, tongTienGio, trangThai)
        VALUES (@c2, @mAlpha03, DATEADD(minute, -42, @now), NULL, NULL, 0);
        SET @active2 = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.phienChoi SET maKhachHang = @c2, thoiGianBatDau = DATEADD(minute, -42, @now), thoiGianKetThuc = NULL, tongTienGio = NULL, trangThai = 0 WHERE maPhien = @active2;
    END;

    DECLARE @completed1 int = (SELECT TOP 1 maPhien FROM dbo.phienChoi WHERE maKhachHang = @c3 AND maMay = @mStream01 AND trangThai = 1 ORDER BY maPhien DESC);
    IF @completed1 IS NULL
    BEGIN
        INSERT INTO dbo.phienChoi (maKhachHang, maMay, thoiGianBatDau, thoiGianKetThuc, tongTienGio, trangThai)
        VALUES (@c3, @mStream01, DATEADD(hour, -4, @now), DATEADD(hour, -2, @now), 100000, 1);
        SET @completed1 = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.phienChoi SET thoiGianBatDau = DATEADD(hour, -4, @now), thoiGianKetThuc = DATEADD(hour, -2, @now), tongTienGio = 100000, trangThai = 1 WHERE maPhien = @completed1;
    END;

    DECLARE @svSting int = (SELECT maDichVu FROM dbo.dichVu WHERE tenDichVu = N'Sting dâu');
    DECLARE @svMi int = (SELECT maDichVu FROM dbo.dichVu WHERE tenDichVu = N'Mì ly hải sản');
    DECLARE @svSnack int = (SELECT maDichVu FROM dbo.dichVu WHERE tenDichVu = N'Combo snack');
    DECLARE @svCafe int = (SELECT maDichVu FROM dbo.dichVu WHERE tenDichVu = N'Cà phê lon');

    DECLARE @orderActive int = (SELECT TOP 1 maDonHang FROM dbo.donHang WHERE maPhien = @active1 AND trangThai = 0 ORDER BY maDonHang DESC);
    IF @orderActive IS NULL
    BEGIN
        INSERT INTO dbo.donHang (maKhachHang, maPhien, maNhanVien, thoiGianDat, tongTien, trangThai)
        VALUES (@c1, @active1, @employee, DATEADD(minute, -30, @now), 30000, 0);
        SET @orderActive = SCOPE_IDENTITY();
        INSERT INTO dbo.chiTietDonHang (maDonHang, maDichVu, soLuong, donGia) VALUES (@orderActive, @svSting, 2, 15000);
    END;

    DECLARE @orderCompleted int = (SELECT TOP 1 maDonHang FROM dbo.donHang WHERE maPhien = @completed1 AND trangThai = 2 ORDER BY maDonHang DESC);
    IF @orderCompleted IS NULL
    BEGIN
        INSERT INTO dbo.donHang (maKhachHang, maPhien, maNhanVien, thoiGianDat, tongTien, trangThai)
        VALUES (@c3, @completed1, @employee, DATEADD(hour, -3, @now), 85000, 2);
        SET @orderCompleted = SCOPE_IDENTITY();
        INSERT INTO dbo.chiTietDonHang (maDonHang, maDichVu, soLuong, donGia) VALUES (@orderCompleted, @svMi, 2, 25000);
        INSERT INTO dbo.chiTietDonHang (maDonHang, maDichVu, soLuong, donGia) VALUES (@orderCompleted, @svSnack, 1, 35000);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.donHang WHERE maKhachHang = @c2 AND maPhien = @active2 AND trangThai = 1)
    BEGIN
        INSERT INTO dbo.donHang (maKhachHang, maPhien, maNhanVien, thoiGianDat, tongTien, trangThai)
        VALUES (@c2, @active2, @employee, DATEADD(minute, -15, @now), 18000, 1);
        DECLARE @orderPreparing int = SCOPE_IDENTITY();
        INSERT INTO dbo.chiTietDonHang (maDonHang, maDichVu, soLuong, donGia) VALUES (@orderPreparing, @svCafe, 1, 18000);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.hoaDon WHERE maPhien = @completed1 AND maDonHang = @orderCompleted AND trangThai = 1)
    BEGIN
        INSERT INTO dbo.hoaDon (maKhachHang, loaiGiaoDich, soTien, phuongThuc, maNhanVien, maPhien, maDonHang, trangThai, thoiGianGiaoDich)
        VALUES (@c3, N'COMBINED', 185000, N'CASH', @employee, @completed1, @orderCompleted, 1, DATEADD(hour, -1, @now));
    END
    ELSE
    BEGIN
        UPDATE dbo.hoaDon SET thoiGianGiaoDich = DATEADD(hour, -1, @now), soTien = 185000, phuongThuc = N'CASH'
        WHERE maPhien = @completed1 AND maDonHang = @orderCompleted AND trangThai = 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.hoaDon WHERE maKhachHang = @c1 AND loaiGiaoDich = N'FOOD_ORDER' AND trangThai = 0)
    BEGIN
        INSERT INTO dbo.hoaDon (maKhachHang, loaiGiaoDich, soTien, phuongThuc, maNhanVien, maPhien, maDonHang, trangThai, thoiGianGiaoDich)
        VALUES (@c1, N'FOOD_ORDER', 30000, N'E_WALLET', @employee, @active1, @orderActive, 0, DATEADD(minute, -10, @now));
    END;

    DECLARE @dayOffset int = 1;
    WHILE @dayOffset <= 6
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.hoaDon
            WHERE maKhachHang = @c1
              AND loaiGiaoDich = N'PLAY_SESSION'
              AND trangThai = 1
              AND CONVERT(date, thoiGianGiaoDich) = DATEADD(day, -@dayOffset, CONVERT(date, @now))
        )
        BEGIN
            INSERT INTO dbo.hoaDon (maKhachHang, loaiGiaoDich, soTien, phuongThuc, maNhanVien, maPhien, maDonHang, trangThai, thoiGianGiaoDich)
            VALUES (@c1, N'PLAY_SESSION', 60000 + (@dayOffset * 15000), N'CARD', @employee, NULL, NULL, 1, DATEADD(day, -@dayOffset, DATEADD(hour, -2, @now)));
        END;
        SET @dayOffset += 1;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;

SELECT 'sample data ready' AS result;

SELECT 'machines' AS metric, COUNT(*) AS total FROM dbo.mayTram
UNION ALL SELECT 'active sessions', COUNT(*) FROM dbo.phienChoi WHERE trangThai = 0
UNION ALL SELECT 'paid invoices', COUNT(*) FROM dbo.hoaDon WHERE trangThai = 1
UNION ALL SELECT 'today paid revenue', CAST(COALESCE(SUM(soTien), 0) AS int) FROM dbo.hoaDon WHERE trangThai = 1 AND thoiGianGiaoDich >= CONVERT(date, GETDATE()) AND thoiGianGiaoDich < DATEADD(day, 1, CONVERT(date, GETDATE()));
