package com.cybergame.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
@Table(name = "hoiVien", schema = "dbo")
public class Membership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maHoiVien")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maKhachHang", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "hangThanhVien", nullable = false, length = 20)
    private String tier;

    @Column(name = "diemTichLuy", nullable = false)
    private Integer accumulatedPoints = 0;

    @Column(name = "ngayNangHang")
    private LocalDateTime upgradedAt;

    @Column(name = "phanTramGiamGia", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;
}
