package com.cybergame.entity;

import com.cybergame.entity.converter.PlaySessionStatusConverter;
import com.cybergame.entity.enums.PlaySessionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
@Table(name = "phienChoi", schema = "dbo")
public class PlaySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maPhien")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maKhachHang", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maMay", nullable = false)
    private Machine machine;

    @Column(name = "thoiGianBatDau", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "thoiGianKetThuc")
    private LocalDateTime endedAt;

    @Column(name = "tongTienGio", precision = 10, scale = 2)
    private BigDecimal totalHourlyAmount;

    @Convert(converter = PlaySessionStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private PlaySessionStatus status = PlaySessionStatus.ACTIVE;

    @OneToMany(mappedBy = "playSession")
    private Set<CustomerOrder> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "playSession")
    private Set<Invoice> invoices = new LinkedHashSet<>();
}
