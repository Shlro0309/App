package com.cybergame.entity;

import com.cybergame.entity.converter.OnlineStatusConverter;
import com.cybergame.entity.enums.OnlineStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
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
@Table(name = "khachHang", schema = "dbo")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maKhachHang")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maNguoiDung", nullable = false, unique = true)
    private User user;

    @Column(name = "soDu", nullable = false, precision = 12, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Convert(converter = OnlineStatusConverter.class)
    @Column(name = "trangThaiOnline", nullable = false, columnDefinition = "tinyint")
    private OnlineStatus onlineStatus = OnlineStatus.OFFLINE;

    @Column(name = "ngayDangKy", nullable = false)
    private LocalDateTime registeredAt;

    @OneToOne(mappedBy = "customer")
    private Membership membership;

    @OneToMany(mappedBy = "customer")
    private Set<Reservation> reservations = new LinkedHashSet<>();

    @OneToMany(mappedBy = "customer")
    private Set<PlaySession> playSessions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "customer")
    private Set<CustomerOrder> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "customer")
    private Set<Invoice> invoices = new LinkedHashSet<>();
}
