package com.cybergame.config;

import com.cybergame.entity.Role;
import com.cybergame.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class RoleDataInitializer implements ApplicationRunner {

    private static final Map<String, String> DEFAULT_ROLES = Map.of(
            "ADMIN", "System administrator",
            "EMPLOYEE", "Cyber Game employee",
            "CUSTOMER", "Cyber Game customer"
    );

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        DEFAULT_ROLES.forEach((name, description) ->
                roleRepository.findByNameIgnoreCase(name).orElseGet(() -> {
                    Role role = new Role();
                    role.setName(name);
                    role.setDescription(description);
                    return roleRepository.save(role);
                })
        );
    }
}
