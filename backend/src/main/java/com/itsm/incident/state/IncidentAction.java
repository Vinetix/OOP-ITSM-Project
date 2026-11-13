package com.itsm.incident.state;

/** Everything that can be done to an incident. Each state decides which of these it allows. */
public enum IncidentAction {
    CLASSIFY,       // system: category + priority + SLA
    ASSIGN,         // admin (or automatic assignment): also used for re-assignment
    ACKNOWLEDGE,    // technician confirms they have it (stops the response SLA clock)
    START,          // technician starts investigating
    REQUEST_INFO,   // technician asks the reporter a question
    PROVIDE_INFO,   // reporter answers
    RESOLVE,        // technician provides the resolution
    VERIFY,         // reporter confirms the fix works (with optional feedback)
    REOPEN,         // reporter says the fix doesn't work
    CLOSE           // final closure
}
