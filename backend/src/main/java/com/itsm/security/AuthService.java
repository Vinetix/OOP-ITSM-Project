package com.itsm.security;

import com.itsm.security.dto.AuthResponse;
import com.itsm.security.dto.LoginRequest;
import com.itsm.security.dto.RegisterRequest;
import com.itsm.user.UserService;
import com.itsm.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    /** Wrong password -> BadCredentialsException; deactivated -> DisabledException (both become 401). */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.email().trim(), request.password()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return tokenFor(userService.getById(principal.getId()));
    }

    /** Self-registration always creates an EMPLOYEE; other roles are created by an admin. */
    public AuthResponse register(RegisterRequest request) {
        UserResponse created = userService.create(request.toCreateUserRequest());
        return tokenFor(created);
    }

    private AuthResponse tokenFor(UserResponse user) {
        JwtService.IssuedToken token = jwtService.issue(user.id(), user.email(), user.role());
        return new AuthResponse(token.token(), "Bearer", token.expiresAt(), user);
    }
}
