package com.itsm.security;

import com.itsm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Loads users for Spring Security: by email at login, by id on each JWT request. */
@Service
@RequiredArgsConstructor
public class ItsmUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserPrincipal loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailIgnoreCase(email.trim())
                .map(UserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("No user with email " + email));
    }

    @Transactional(readOnly = true)
    public UserPrincipal loadUserById(Long id) throws UsernameNotFoundException {
        return userRepository.findById(id)
                .map(UserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("No user with id " + id));
    }
}
