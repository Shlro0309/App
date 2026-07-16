package com.cybergame.entity;

import com.cybergame.entity.converter.AccountStatusConverter;
import com.cybergame.entity.enums.AccountStatus;
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

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "nguoiDung", schema = "dbo")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maNguoiDung")
    private Integer id;

    @Column(name = "tenDangNhap", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "matKhau", nullable = false, length = 255)
    private String password;

    @Column(name = "hoTen", length = 100)
    private String fullName;

    @Column(name = "soDienThoai", length = 15)
    private String phoneNumber;

    @Column(name = "email", length = 100)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maQuyen", nullable = false)
    private Role role;

    @Convert(converter = AccountStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "ngayTao", nullable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "user")
    private Customer customer;

    @OneToOne(mappedBy = "user")
    private Employee employee;
}
