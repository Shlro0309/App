package com.cybergame.service.impl;

import com.cybergame.dto.request.UserBalanceUpdateRequest;
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
import com.cybergame.security.CurrentUser;
import com.cybergame.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
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
    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_EMPLOYEE = "ROLE_EMPLOYEE";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(CurrentUser currentUser, String keyword, String role, AccountStatus status, Pageable pageable) {
        String effectiveRole = canManageAllUsers(currentUser) ? role : CUSTOMER_ROLE;
        Specification<User> specification = Specification
                .where(UserSpecifications.hasKeyword(keyword))
                .and(UserSpecifications.hasRole(effectiveRole))
                .and(UserSpecifications.hasStatus(status));

        return userRepository.findAll(specification, pageable)
                .map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUser(CurrentUser currentUser, Integer id) {
        User user = getUserById(id);
        validateCanAccessUser(currentUser, user);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CurrentUser currentUser, UserCreateRequest request) {
        String username = request.username().trim();
        validateUniqueUsername(username);
        validateUniqueEmail(null, request.email());

        Role role = getRole(request.role());
        validateCanUseRole(currentUser, role);

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
    public UserResponse updateUser(CurrentUser currentUser, Integer id, UserUpdateRequest request) {
        User user = getUserById(id);
        validateCanAccessUser(currentUser, user);
        validateUniqueEmail(user.getId(), request.email());

        user.setFullName(normalizeBlank(request.fullName()));
        user.setPhoneNumber(normalizeBlank(request.phoneNumber()));
        user.setEmail(normalizeBlank(request.email()));

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateStatus(CurrentUser currentUser, Integer id, UserStatusUpdateRequest request) {
        User user = getUserById(id);
        validateCanAccessUser(currentUser, user);
        user.setStatus(request.status());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateRole(CurrentUser currentUser, Integer id, UserRoleUpdateRequest request) {
        validateCanManageRoles(currentUser);
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
    public UserResponse updateBalance(CurrentUser currentUser, Integer id, UserBalanceUpdateRequest request) {
        User user = getUserById(id);
        validateCanAccessUser(currentUser, user);
        if (user.getCustomer() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "Only customer account balance can be updated");
        }

        user.getCustomer().setBalance(request.balance());
        customerRepository.save(user.getCustomer());
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public MessageResponse deleteUser(CurrentUser currentUser, Integer id) {
        User user = getUserById(id);
        validateCanAccessUser(currentUser, user);
        user.setStatus(AccountStatus.LOCKED);
        userRepository.save(user);
        return new MessageResponse("User account has been locked");
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getRoles(CurrentUser currentUser) {
        return roleRepository.findAll()
                .stream()
                .filter(role -> canManageAllUsers(currentUser) || isCustomerRole(role))
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

    private void validateCanAccessUser(CurrentUser currentUser, User user) {
        if (canManageAllUsers(currentUser)) {
            return;
        }
        if (canManageCustomerUsers(currentUser) && user.getRole() != null && CUSTOMER_ROLE.equalsIgnoreCase(user.getRole().getName())) {
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "Employee can only manage customer accounts");
    }

    private void validateCanUseRole(CurrentUser currentUser, Role role) {
        if (canManageAllUsers(currentUser)) {
            return;
        }
        if (canManageCustomerUsers(currentUser) && isCustomerRole(role)) {
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "Employee can only create customer accounts");
    }

    private void validateCanManageRoles(CurrentUser currentUser) {
        if (!canManageAllUsers(currentUser)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only admin can update account role");
        }
    }

    private boolean canManageAllUsers(CurrentUser currentUser) {
        return hasAuthority(currentUser, ROLE_ADMIN);
    }

    private boolean canManageCustomerUsers(CurrentUser currentUser) {
        return hasAuthority(currentUser, ROLE_EMPLOYEE);
    }

    private boolean hasAuthority(CurrentUser currentUser, String authorityName) {
        return currentUser.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authorityName::equals);
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
