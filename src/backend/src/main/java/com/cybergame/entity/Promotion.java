package com.cybergame.entity;

import com.cybergame.entity.converter.PromotionStatusConverter;
import com.cybergame.entity.enums.PromotionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "khuyenMai", schema = "dbo")
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maKhuyenMai")
    private Integer id;

    @Column(name = "tenKhuyenMai", nullable = false, length = 150)
    private String name;

    @Column(name = "loaiKhuyenMai", nullable = false, length = 30)
    private String promotionType;

    @Column(name = "giaTri", nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "hangThanhVienApDung", length = 20)
    private String appliedMembershipTier;

    @Column(name = "ngayBatDau", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ngayKetThuc", nullable = false)
    private LocalDateTime endedAt;

    @Column(name = "soLuongToiDa")
    private Integer maxQuantity;

    @Column(name = "dieuKienApDung", length = 255)
    private String conditionDescription;

    @Convert(converter = PromotionStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private PromotionStatus status = PromotionStatus.ACTIVE;
}
