package com.itsm.audit;

import com.itsm.incident.state.IncidentAction;

/**
 * What happened to an incident. The lifecycle actions mirror IncidentAction; the others come from
 * non-lifecycle events. Phase 6 adds the SLA and escalation actions.
 */
public enum AuditAction {
    REPORTED,
    CLASSIFY,
    ASSIGN,
    ACKNOWLEDGE,
    START,
    REQUEST_INFO,
    PROVIDE_INFO,
    RESOLVE,
    VERIFY,
    REOPEN,
    CLOSE,
    PRIORITY_CHANGED,
    DETAILS_UPDATED,
    NOTE_ADDED;

    /** Explicit mapping: adding a lifecycle action without an audit action is a compile error. */
    public static AuditAction of(IncidentAction action) {
        return switch (action) {
            case CLASSIFY -> CLASSIFY;
            case ASSIGN -> ASSIGN;
            case ACKNOWLEDGE -> ACKNOWLEDGE;
            case START -> START;
            case REQUEST_INFO -> REQUEST_INFO;
            case PROVIDE_INFO -> PROVIDE_INFO;
            case RESOLVE -> RESOLVE;
            case VERIFY -> VERIFY;
            case REOPEN -> REOPEN;
            case CLOSE -> CLOSE;
        };
    }
}
