package com.itsm.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Runs once per request, before Spring Security's authorization checks.
 * If a valid "Authorization: Bearer <token>" header is present, the user is loaded and
 * marked as authenticated for this request. If the token is bad, the request simply
 * continues unauthenticated; protected endpoints then answer 401 with the reason below.
 *
 * Not a @Component on purpose: it is created in SecurityConfig so it is registered only
 * inside the security filter chain (not a second time as a plain servlet filter).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Request attribute read by GlobalExceptionHandler to explain a 401. */
    public static final String JWT_ERROR_ATTRIBUTE = "itsm.jwtError";

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final ItsmUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, ItsmUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            try {
                Long userId = jwtService.extractUserId(token);
                UserPrincipal principal = userDetailsService.loadUserById(userId);

                if (principal.isEnabled()) {
                    var authentication = UsernamePasswordAuthenticationToken.authenticated(
                            principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(authentication);
                    SecurityContextHolder.setContext(context);
                } else {
                    request.setAttribute(JWT_ERROR_ATTRIBUTE, "This account has been deactivated");
                }
            } catch (ExpiredJwtException e) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Your session has expired. Please log in again.");
            } catch (JwtException | IllegalArgumentException e) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Invalid authentication token");
            } catch (UsernameNotFoundException e) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "The user for this token no longer exists");
            }
        }

        filterChain.doFilter(request, response);
    }
}
