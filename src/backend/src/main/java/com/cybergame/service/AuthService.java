package com.cybergame.service;

import com.cybergame.dto.request.ChangePasswordRequest;
import com.cybergame.dto.request.LoginRequest;
import com.cybergame.dto.request.RefreshTokenRequest;
import com.cybergame.dto.request.RegisterRequest;
import com.cybergame.dto.response.AuthResponse;
import com.cybergame.dto.response.MessageResponse;
import com.cybergame.dto.response.TokenResponse;
import com.cybergame.dto.response.UserSummaryResponse;
import com.cybergame.security.CurrentUser;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    TokenResponse refresh(RefreshTokenRequest request);

    MessageResponse changePassword(CurrentUser currentUser, ChangePasswordRequest request);

    UserSummaryResponse getCurrentUser(CurrentUser currentUser);
}
