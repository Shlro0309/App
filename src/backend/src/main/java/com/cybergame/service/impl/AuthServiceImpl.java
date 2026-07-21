package com.cybergame.service.impl;

import com.cybergame.config.SecurityProperties;
import com.cybergame.dto.request.ChangePasswordRequest;
import com.cybergame.dto.request.LoginRequest;
import com.cybergame.dto.request.RefreshTokenRequest;
import com.cybergame.dto.request.RegisterRequest;
import com.cybergame.dto.response.AuthResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.TokenResponse;
import com.cybergame.dto.response.UserSummaryResponse;
import com.cybergame.entity.Customer;
import com.cybergame.entity.Employee;
import com.cybergame.entity.Role;
import com.cybergame.entity.User;
import com.cybergame.entity.enums.AccountStatus;
import com.cybergame.entity.enums.OnlineStatus;
import com.cybergame.exception.BusinessException;
import com.cybergame.exception.ResourceNotFoundException;
import com.cybergame.repository.CustomerRepository;
import com.cybergame.repository.EmployeeRepository;
import com.cybergame.repository.RoleRepository;
import com.cybergame.repository.UserRepository;
import com.cybergame.security.CurrentUser;
import com.cybergame.security.JwtService;
import com.cybergame.security.TokenType;
import com.cybergame.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String BEARER_TOKEN_TYPE = "Bearer";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final SecurityProperties securityProperties;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Username already exists");
        }

        Role customerRole = roleRepository.findByNameIgnoreCase(CUSTOMER_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException("Customer role is not configured"));

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(normalizeBlank(request.fullName()));
        user.setPhoneNumber(normalizeBlank(request.phoneNumber()));
        user.setEmail(normalizeBlank(request.email()));
        user.setRole(customerRole);
        user.setStatus(AccountStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(savedUser);
        customer.setBalance(BigDecimal.ZERO);
        customer.setOnlineStatus(OnlineStatus.OFFLINE);
        customer.setRegisteredAt(LocalDateTime.now());
        Customer savedCustomer = customerRepository.save(customer);
        savedUser.setCustomer(savedCustomer);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
        return buildAuthResponse(savedUser, userDetails);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = getUserByUsername(userDetails.getUsername());
        return buildAuthResponse(user, userDetails);
    }

    @Override
    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshTokenRequest request) {
        try {
            String username = jwtService.extractUsername(request.refreshToken());
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtService.isTokenValid(request.refreshToken(), userDetails, TokenType.REFRESH)) {
                throw new BusinessException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired");
            }

            return new TokenResponse(
                    jwtService.generateAccessToken(userDetails),
                    BEARER_TOKEN_TYPE,
                    securityProperties.accessTokenExpirationMinutes()
            );
        } catch (RuntimeException exception) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired");
        }
    }

    @Override
    @Transactional
    public MessageResponse changePassword(CurrentUser currentUser, ChangePasswordRequest request) {
        User user = getUserByUsername(currentUser.getUsername());
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return new MessageResponse("Password changed successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(CurrentUser currentUser) {
        return toUserSummary(getUserByUsername(currentUser.getUsername()));
    }

    private AuthResponse buildAuthResponse(User user, UserDetails userDetails) {
        return new AuthResponse(
                jwtService.generateAccessToken(userDetails),
                jwtService.generateRefreshToken(userDetails),
                BEARER_TOKEN_TYPE,
                securityProperties.accessTokenExpirationMinutes(),
                toUserSummary(user)
        );
    }

    private UserSummaryResponse toUserSummary(User user) {
        Customer customer = customerRepository.findByUserId(user.getId()).orElse(null);
        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);

        return new UserSummaryResponse(
                user.getId(),
                customer == null ? null : customer.getId(),
                employee == null ? null : employee.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole().getName().toUpperCase(Locale.ROOT),
                user.getStatus().name(),
                customer == null ? null : customer.getBalance()
        );
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
