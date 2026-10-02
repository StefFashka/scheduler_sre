package ru.uchebnyradar.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.uchebnyradar.common.BadRequestException;
import ru.uchebnyradar.common.ResourceNotFoundException;
import ru.uchebnyradar.security.CustomUserDetails;

import java.util.Collections;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SessionService sessionService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository,
                       SessionService sessionService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.sessionService = sessionService;
    }

    @Transactional
    public AuthUserResponse register(RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (userRepository.existsByName(request.getName())) {
            throw new BadRequestException("Username is already taken: " + request.getName());
        }

        UserEntity user = new UserEntity(request.getName(), passwordEncoder.encode(request.getPassword()));
        UserEntity savedUser = userRepository.save(user);
        log.info("Registered new user with id: {}", savedUser.getId());

        // Automatically authenticate user after registration
        CustomUserDetails userDetails = CustomUserDetails.fromEntity(savedUser);
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return new AuthUserResponse(savedUser.getId(), savedUser.getName(), savedUser.getCreatedAt());
    }

    public AuthUserResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getName(), request.getPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        // Session ID rotation to protect against session fixation attacks
        sessionService.rotateSessionId(httpRequest);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        log.info("User {} successfully logged in", userDetails.getUsername());

        UserEntity user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new AuthUserResponse(user.getId(), user.getName(), user.getCreatedAt());
    }

    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            log.info("Logging out user: {}", auth.getName());
        }
        SecurityContextHolder.clearContext();
        sessionService.invalidateSession(httpRequest);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(CustomUserDetails userDetails) {
        UserEntity user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userDetails.getId()));
        return new AuthUserResponse(user.getId(), user.getName(), user.getCreatedAt());
    }
}
