package com.itsm.incident;

import com.itsm.incident.state.IncidentAction;
import com.itsm.security.UserPrincipal;
import com.itsm.user.Role;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

/**
 * WHO may do something to an incident (the State decides WHEN it is allowed).
 * One class answers both questions the app needs: "is this request allowed?" (enforcement)
 * and "which buttons should the UI show?" (availableActions).
 */
@Component
public class IncidentAccessPolicy {

    public boolean canView(Incident incident, UserPrincipal user) {
        return isAdmin(user) || incident.isReportedBy(user.getId()) || incident.isAssignedTo(user.getId());
    }

    public boolean canPerform(IncidentAction action, Incident incident, UserPrincipal user) {
        return switch (action) {
            case CLASSIFY -> false; // only the system classifies
            case ASSIGN -> isAdmin(user);
            case ACKNOWLEDGE, START, REQUEST_INFO, RESOLVE -> incident.isAssignedTo(user.getId());
            case PROVIDE_INFO, VERIFY, REOPEN -> incident.isReportedBy(user.getId());
            case CLOSE -> isAdmin(user) || incident.isAssignedTo(user.getId());
        };
    }

    public boolean canEditDetails(Incident incident, UserPrincipal user) {
        return isAdmin(user) || incident.isReportedBy(user.getId());
    }

    public boolean canAddNote(Incident incident, UserPrincipal user) {
        return canView(incident, user);
    }

    /** Actions this user can perform right now = allowed by the state AND permitted for this user. */
    public Set<IncidentAction> availableActions(Incident incident, UserPrincipal user) {
        Set<IncidentAction> result = EnumSet.noneOf(IncidentAction.class);
        for (IncidentAction action : incident.state().allowedActions()) {
            if (canPerform(action, incident, user)) {
                result.add(action);
            }
        }
        return result;
    }

    private boolean isAdmin(UserPrincipal user) {
        return user.getRole() == Role.ADMIN;
    }
}
