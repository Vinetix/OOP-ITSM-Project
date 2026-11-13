package com.itsm.incident.sla;

/** Shown on every incident so users see at a glance whether the SLA is in danger. */
public enum SlaStatus {
    ON_TRACK,   // less than 75% of the time used
    AT_RISK,    // 75% or more of the time used, not yet breached
    BREACHED,   // a deadline has been missed
    MET         // resolved within the resolution target
}
