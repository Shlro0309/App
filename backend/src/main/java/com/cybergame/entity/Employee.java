package com.cybergame.entity;

import jakarta.persistence.Column;
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

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "nhanVien", schema = "dbo")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maNhanVien")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maNguoiDung", nullable = false, unique = true)
    private User user;

    @Column(name = "caLamViec", length = 50)
    private String shift;

    @Column(name = "ngayVaoLam")
    private LocalDate startedAt;

    @OneToMany(mappedBy = "employee")
    private Set<MaintenanceHistory> maintenanceHistories = new LinkedHashSet<>();

    @OneToMany(mappedBy = "employee")
    private Set<CustomerOrder> orders = new LinkedHashSet<>();

    @OneToMany(mappedBy = "employee")
    private Set<Invoice> invoices = new LinkedHashSet<>();
}
