package com.cybergame.security;

import com.cybergame.entity.User;
import com.cybergame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        String roleName = user.getRole().getName().toUpperCase(Locale.ROOT);
        String authority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;

        return CurrentUser.from(user, List.of(new SimpleGrantedAuthority(authority)));
    }
}
