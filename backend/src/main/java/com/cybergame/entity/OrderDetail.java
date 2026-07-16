package com.cybergame.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "chiTietDonHang", schema = "dbo")
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maChiTiet")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maDonHang", nullable = false)
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maDichVu", nullable = false)
    private ServiceItem serviceItem;

    @Column(name = "soLuong", nullable = false)
    private Integer quantity = 1;

    @Column(name = "donGia", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "thanhTien", insertable = false, updatable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;
}
