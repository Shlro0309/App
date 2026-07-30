package com.cybergame.config;

import com.cybergame.entity.Customer;
import com.cybergame.entity.Employee;
import com.cybergame.entity.Role;
import com.cybergame.entity.User;
import com.cybergame.entity.enums.AccountStatus;
import com.cybergame.entity.enums.OnlineStatus;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.EmployeeRepository;
import com.cybergame.repository.RoleRepository;
import com.cybergame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class DemoAccountDataInitializer implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "password123";

    private static final List<DemoAccount> DEMO_ACCOUNTS = List.of(
            new DemoAccount("admin_demo", "Admin Demo", "admin.demo.smoke@cybergame.local", "0902000001", "ADMIN", null),
            new DemoAccount("employee_demo", "Employee Demo", "employee.demo.smoke@cybergame.local", "0902000002", "EMPLOYEE", null),
            new DemoAccount("customer_demo", "Customer Demo", "customer.demo.smoke@cybergame.local", "0902000003", "CUSTOMER", BigDecimal.valueOf(120000)),
            new DemoAccount("demo_user", "Demo User", "demo.user.smoke@cybergame.local", "0902000004", "CUSTOMER", BigDecimal.valueOf(120000)),
            new DemoAccount("zero_customer", "Zero Customer", "zero.customer.smoke@cybergame.local", "0902000005", "CUSTOMER", BigDecimal.ZERO)
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        DEMO_ACCOUNTS.forEach(this::upsertDemoAccount);
    }

    private void upsertDemoAccount(DemoAccount demoAccount) {
        Role role = getOrCreateRole(demoAccount.role());
        User user = userRepository.findByUsername(demoAccount.username())
                .orElseGet(User::new);

        boolean isNewUser = user.getId() == null;
        user.setUsername(demoAccount.username());
        user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        user.setFullName(demoAccount.fullName());
        user.setPhoneNumber(demoAccount.phoneNumber());
        user.setEmail(demoAccount.email());
        user.setRole(role);
        user.setStatus(AccountStatus.ACTIVE);
        if (isNewUser) {
            user.setCreatedAt(LocalDateTime.now());
        }

        User savedUser = userRepository.save(user);
        ensureRoleProfile(savedUser, demoAccount);
    }

    private Role getOrCreateRole(String roleName) {
        String normalizedRoleName = roleName.trim().toUpperCase(Locale.ROOT);
        return roleRepository.findByNameIgnoreCase(normalizedRoleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(normalizedRoleName);
                    role.setDescription("Cyber Game " + normalizedRoleName.toLowerCase(Locale.ROOT));
                    return roleRepository.save(role);
                });
    }

    private void ensureRoleProfile(User user, DemoAccount demoAccount) {
        if ("CUSTOMER".equals(demoAccount.role())) {
            Customer customer = customerRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        Customer newCustomer = new Customer();
                        newCustomer.setUser(user);
                        newCustomer.setRegisteredAt(LocalDateTime.now());
                        newCustomer.setOnlineStatus(OnlineStatus.OFFLINE);
                        return newCustomer;
                    });
            customer.setBalance(demoAccount.balance() == null ? BigDecimal.ZERO : demoAccount.balance());
            customerRepository.save(customer);
        }

        if ("EMPLOYEE".equals(demoAccount.role()) && employeeRepository.findByUserId(user.getId()).isEmpty()) {
            Employee employee = new Employee();
            employee.setUser(user);
            employee.setShift("Demo");
            employee.setStartedAt(LocalDate.now());
            employeeRepository.save(employee);
        }
    }

    private record DemoAccount(
            String username,
            String fullName,
            String email,
            String phoneNumber,
            String role,
            BigDecimal balance
    ) {
    }
}
