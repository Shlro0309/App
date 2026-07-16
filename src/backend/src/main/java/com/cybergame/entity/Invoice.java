package com.cybergame.entity;

import com.cybergame.entity.converter.InvoiceStatusConverter;
import com.cybergame.entity.enums.InvoiceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hoaDon", schema = "dbo")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maHoaDon")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maKhachHang", nullable = false)
    private Customer customer;

    @Column(name = "loaiGiaoDich", nullable = false, length = 30)
    private String transactionType;

    @Column(name = "soTien", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "phuongThuc", length = 30)
    private String paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNhanVien")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhien")
    private PlaySession playSession;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maDonHang")
    private CustomerOrder order;

    @Convert(converter = InvoiceStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @Column(name = "thoiGianGiaoDich", nullable = false)
    private LocalDateTime transactionAt;
}
