package ru.uchebnyradar.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    public void rotateSessionId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            request.changeSessionId();
        }
    }

    public void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
