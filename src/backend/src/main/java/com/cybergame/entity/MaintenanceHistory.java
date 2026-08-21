package com.cybergame.entity;

import com.cybergame.entity.converter.MaintenanceStatusConverter;
import com.cybergame.entity.enums.MaintenanceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
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
@Table(name = "lichSuBaoTri", schema = "dbo")
public class MaintenanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maLichSuBaoTri")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maMay", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNhanVien")
    private Employee employee;

    @Column(name = "lyDo", length = 200)
    private String reason;

    @Lob
    @Column(name = "moTaChiTiet", columnDefinition = "nvarchar(max)")
    private String detailDescription;

    @Column(name = "thoiGianBatDau", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "thoiGianKetThuc")
    private LocalDateTime endedAt;

    @Convert(converter = MaintenanceStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private MaintenanceStatus status = MaintenanceStatus.IN_PROGRESS;

    @Column(name = "chiPhiSuaChua", precision = 10, scale = 2)
    private BigDecimal repairCost;
}
