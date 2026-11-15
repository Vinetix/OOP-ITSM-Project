package com.itsm.incident.sla;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled methods (the SLA monitor). */
@Configuration
@EnableScheduling
public class SlaMonitorConfig {
}
