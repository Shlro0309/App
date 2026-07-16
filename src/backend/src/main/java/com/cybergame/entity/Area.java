package com.cybergame.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
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
@Table(name = "khuVuc", schema = "dbo")
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maKhuVuc")
    private Integer id;

    @Column(name = "tenKhuVuc", nullable = false, length = 50)
    private String name;

    @Column(name = "moTa", length = 255)
    private String description;

    @OneToMany(mappedBy = "area")
    private Set<Machine> machines = new LinkedHashSet<>();
}
