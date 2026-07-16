package com.cybergame.entity;

import com.cybergame.entity.converter.ServiceStatusConverter;
import com.cybergame.entity.enums.ServiceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dichVu", schema = "dbo")
public class ServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maDichVu")
    private Integer id;

    @Column(name = "tenDichVu", nullable = false, length = 100)
    private String name;

    @Column(name = "gia", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "loaiDichVu", length = 50)
    private String serviceType;

    @Column(name = "hinhAnh", length = 255)
    private String imageUrl;

    @Column(name = "soLuongTon", nullable = false)
    private Integer stockQuantity = 0;

    @Convert(converter = ServiceStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private ServiceStatus status = ServiceStatus.ACTIVE;

    @OneToMany(mappedBy = "serviceItem")
    private Set<OrderDetail> orderDetails = new LinkedHashSet<>();
}
