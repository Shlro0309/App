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
@Table(name = "phanQuyen", schema = "dbo")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maQuyen")
    private Integer id;

    @Column(name = "tenQuyen", nullable = false, length = 50)
    private String name;

    @Column(name = "moTa", length = 255)
    private String description;

    @OneToMany(mappedBy = "role")
    private Set<User> users = new LinkedHashSet<>();
}
