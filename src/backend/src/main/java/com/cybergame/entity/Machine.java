package com.cybergame.entity;

import com.cybergame.entity.converter.MachineStatusConverter;
import com.cybergame.entity.enums.MachineStatus;
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
@Table(name = "mayTram", schema = "dbo")
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maMay")
    private Integer id;

    @Column(name = "tenMay", nullable = false, length = 20)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "maKhuVuc", nullable = false)
    private Area area;

    @Column(name = "cpu", length = 100)
    private String cpu;

    @Column(name = "gpu", length = 100)
    private String gpu;

    @Column(name = "ram")
    private Integer ram;

    @Column(name = "fps")
    private Integer fps;

    @Column(name = "resolution", length = 20)
    private String resolution;

    @Column(name = "giaTheoGio", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyPrice = BigDecimal.ZERO;

    @Convert(converter = MachineStatusConverter.class)
    @Column(name = "trangThai", nullable = false, columnDefinition = "tinyint")
    private MachineStatus status = MachineStatus.AVAILABLE;

    @Column(name = "ngayThem", nullable = false)
    private LocalDateTime addedAt;

    @ManyToMany(mappedBy = "machines")
    private Set<Game> games = new LinkedHashSet<>();

    @ManyToMany(mappedBy = "machines")
    private Set<Reservation> reservations = new LinkedHashSet<>();

    @OneToMany(mappedBy = "machine")
    private Set<PlaySession> playSessions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "machine")
    private Set<MaintenanceHistory> maintenanceHistories = new LinkedHashSet<>();
}
