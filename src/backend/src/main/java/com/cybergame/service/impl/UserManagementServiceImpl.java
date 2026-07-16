package com.cybergame.service.impl;

import com.cybergame.dto.request.UserCreateRequest;
import com.cybergame.dto.request.UserRoleUpdateRequest;
import com.cybergame.dto.request.UserStatusUpdateRequest;
import com.cybergame.dto.request.UserUpdateRequest;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.RoleResponse;
import com.cybergame.dto.response.UserResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.Employee;
import com.cybergame.entity.Role;
import com.cybergame.entity.User;
import com.cybergame.entity.enums.AccountStatus;
import com.cybergame.entity.enums.OnlineStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.mapper.UserMapper;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.EmployeeRepository;
import com.cybergame.repository.RoleRepository;
import com.cybergame.repository.UserRepository;
import com.cybergame.repository.UserSpecifications;
import com.cybergame.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String EMPLOYEE_ROLE = "EMPLOYEE";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String keyword, String role, AccountStatus status, Pageable pageable) {
        Specification<User> specification = Specification
                .where(UserSpecifications.hasKeyword(keyword))
                .and(UserSpecifications.hasRole(role))
                .and(UserSpecifications.hasStatus(status));

        return userRepository.findAll(specification, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUser(Integer id) {
        return userMapper.toResponse(getUserById(id));
    }

    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        String username = request.username().trim();
        validateUniqueUsername(username);
        validateUniqueEmail(null, request.email());

        Role role = getRole(request.role());

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(normalizeBlank(request.fullName()));
        user.setPhoneNumber(normalizeBlank(request.phoneNumber()));
        user.setEmail(normalizeBlank(request.email()));
        user.setRole(role);
        user.setStatus(AccountStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        if (isCustomerRole(role)) {
            createCustomerProfile(savedUser);
        }
        if (isEmployeeRole(role)) {
            createEmployeeProfile(savedUser);
        }

        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Integer id, UserUpdateRequest request) {
        User user = getUserById(id);
        validateUniqueEmail(user.getId(), request.email());

        user.setFullName(normalizeBlank(request.fullName()));
        user.setPhoneNumber(normalizeBlank(request.phoneNumber()));
        user.setEmail(normalizeBlank(request.email()));

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateStatus(Integer id, UserStatusUpdateRequest request) {
        User user = getUserById(id);
        user.setStatus(request.status());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateRole(Integer id, UserRoleUpdateRequest request) {
        User user = getUserById(id);
        Role role = getRole(request.role());

        if (isCustomerRole(role) && user.getCustomer() == null) {
            createCustomerProfile(user);
        }
        if (isEmployeeRole(role) && user.getEmployee() == null) {
            createEmployeeProfile(user);
        }

        user.setRole(role);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public MessageResponse deleteUser(Integer id) {
        User user = getUserById(id);
        user.setStatus(AccountStatus.LOCKED);
        userRepository.save(user);
        return new MessageResponse("User account has been locked");
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getRoles() {
        return roleRepository.findAll()
                .stream()
                .map(userMapper::toRoleResponse)
                .toList();
    }

    private User getUserById(Integer id) {
        return userRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Role getRole(String roleName) {
        return roleRepository.findByNameIgnoreCase(roleName.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
    }

    private void validateUniqueUsername(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Username already exists");
        }
    }

    private void validateUniqueEmail(Integer currentUserId, String email) {
        String normalizedEmail = normalizeBlank(email);
        if (normalizedEmail == null) {
            return;
        }

        boolean exists = userRepository.existsByEmail(normalizedEmail);
        if (exists && (currentUserId == null || !normalizedEmail.equalsIgnoreCase(getUserById(currentUserId).getEmail()))) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already exists");
        }
    }

    private Customer createCustomerProfile(User user) {
        Customer customer = new Customer();
        customer.setUser(user);
        customer.setBalance(BigDecimal.ZERO);
        customer.setOnlineStatus(OnlineStatus.OFFLINE);
        customer.setRegisteredAt(LocalDateTime.now());
        Customer savedCustomer = customerRepository.save(customer);
        user.setCustomer(savedCustomer);
        return savedCustomer;
    }

    private Employee createEmployeeProfile(User user) {
        Employee employee = new Employee();
        employee.setUser(user);
        Employee savedEmployee = employeeRepository.save(employee);
        user.setEmployee(savedEmployee);
        return savedEmployee;
    }

    private boolean isCustomerRole(Role role) {
        return CUSTOMER_ROLE.equalsIgnoreCase(role.getName());
    }

    private boolean isEmployeeRole(Role role) {
        return EMPLOYEE_ROLE.equalsIgnoreCase(role.getName());
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
