package com.cybergame.controller;

import com.cybergame.dto.request.ChangePasswordRequest;
import com.cybergame.dto.request.LoginRequest;
import com.cybergame.dto.request.RefreshTokenRequest;
import com.cybergame.dto.request.RegisterRequest;
import com.cybergame.dto.response.AuthResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.TokenResponse;
import com.cybergame.dto.response.UserSummaryResponse;
import com.cybergame.security.CurrentUser;
import com.cybergame.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/change-password")
    public MessageResponse changePassword(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return authService.changePassword(currentUser, request);
    }

    @PostMapping("/logout")
    public MessageResponse logout() {
        return new MessageResponse("Đăng xuất thành công");
    }

    @GetMapping("/me")
    public UserSummaryResponse me(@AuthenticationPrincipal CurrentUser currentUser) {
        return authService.getCurrentUser(currentUser);
    }
}
