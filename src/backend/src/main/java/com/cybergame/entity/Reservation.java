package com.cybergame.entity;

import com.cybergame.entity.converter.ReservationStatusConverter;
import com.cybergame.entity.enums.ReservationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "datCho", schema = "dbo")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maDatCho")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maKhachHang", nullable = false)
    private Customer customer;

    @Column(name = "thoiGianDat", nullable = false)
    private LocalDateTime reservedAt;

    @Column(name = "thoiGianHetHan", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "tienCoc", nullable = false, precision = 10, scale = 2)
    private BigDecimal deposit = BigDecimal.ZERO;

    @Convert(converter = ReservationStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private ReservationStatus status = ReservationStatus.PENDING;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "datCho_mayTram",
            schema = "dbo",
            joinColumns = @JoinColumn(name = "maDatCho"),
            inverseJoinColumns = @JoinColumn(name = "maMay")
    )
    private Set<Machine> machines = new LinkedHashSet<>();
}
