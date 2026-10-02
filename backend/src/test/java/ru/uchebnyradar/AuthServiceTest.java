package ru.uchebnyradar;

import ru.uchebnyradar.auth.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import ru.uchebnyradar.common.BadRequestException;
import ru.uchebnyradar.security.CustomUserDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private SecurityContextRepository securityContextRepository;

    @Mock
    private SessionService sessionService;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private HttpServletResponse httpResponse;

    @InjectMocks
    private AuthService authService;

    private UserEntity user;

    @BeforeEach
    void setUp() {
        user = new UserEntity("alex", "hashed_pwd");
        user.setId(1L);
    }

    @Test
    void register_success() {
        RegisterRequest request = new RegisterRequest("alex", "password123");
        when(userRepository.existsByName("alex")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed_pwd");
        when(userRepository.save(any(UserEntity.class))).thenReturn(user);

        AuthUserResponse response = authService.register(request, httpRequest, httpResponse);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("alex", response.getName());
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    void register_duplicateUsername_throwsException() {
        RegisterRequest request = new RegisterRequest("alex", "password123");
        when(userRepository.existsByName("alex")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request, httpRequest, httpResponse));
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void login_success() {
        LoginRequest request = new LoginRequest("alex", "password123");
        CustomUserDetails userDetails = CustomUserDetails.fromEntity(user);
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        AuthUserResponse response = authService.login(request, httpRequest, httpResponse);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("alex", response.getName());
        verify(sessionService).rotateSessionId(httpRequest);
    }

    @Test
    void logout_success() {
        authService.logout(httpRequest, httpResponse);
        verify(sessionService).invalidateSession(httpRequest);
    }
}
