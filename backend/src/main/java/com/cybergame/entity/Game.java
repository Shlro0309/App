package com.cybergame.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "troChoi", schema = "dbo")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maTroChoi")
    private Integer id;

    @Column(name = "tenTroChoi", nullable = false, length = 100)
    private String name;

    @Column(name = "theLoai", length = 50)
    private String genre;

    @Column(name = "cpuToiThieu", length = 100)
    private String minimumCpu;

    @Column(name = "gpuToiThieu", length = 100)
    private String minimumGpu;

    @Column(name = "ramToiThieu")
    private Integer minimumRam;

    @Column(name = "fpsDeXuat")
    private Integer recommendedFps;

    @Column(name = "resolutionDeXuat", length = 20)
    private String recommendedResolution;

    @Column(name = "hinhAnh", length = 255)
    private String imageUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "troChoi_mayTram",
            schema = "dbo",
            joinColumns = @JoinColumn(name = "maTroChoi"),
            inverseJoinColumns = @JoinColumn(name = "maMay")
    )
    private Set<Machine> machines = new LinkedHashSet<>();
}
