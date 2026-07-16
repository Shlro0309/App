package com.cybergame.security;

import com.cybergame.entity.User;
import com.cybergame.entity.enums.AccountStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public record CurrentUser(
        Integer id,
        String username,
        String password,
        boolean active,
        Collection<? extends GrantedAuthority> authorities
) implements UserDetails {

    public static CurrentUser from(User user, Collection<? extends GrantedAuthority> authorities) {
        return new CurrentUser(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getStatus() == AccountStatus.ACTIVE,
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
