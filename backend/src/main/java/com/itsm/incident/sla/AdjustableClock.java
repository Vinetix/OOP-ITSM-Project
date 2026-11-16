package com.itsm.incident.sla;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.function.Supplier;

/**
 * The application clock. Normally it is simply the system clock (UTC).
 *
 * For demo data only, a piece of code can run "as if it were" another moment: runAt() pins the time
 * for the CURRENT THREAD only (a ThreadLocal), so the background SLA monitor and web requests on other
 * threads always see the real time. Used by the historical demo data seeder to create incidents spread
 * over the last 14 days through the real services.
 */
public class AdjustableClock extends Clock {

    private final Clock base;
    private final ThreadLocal<Instant> pinned = new ThreadLocal<>();

    public AdjustableClock(Clock base) {
        this.base = base;
    }

    @Override
    public Instant instant() {
        Instant at = pinned.get();
        return at != null ? at : base.instant();
    }

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        throw new UnsupportedOperationException("The application clock is always UTC");
    }

    /** The real time, even while a moment is pinned on this thread. */
    public Instant realInstant() {
        return base.instant();
    }

    public <T> T callAt(Instant at, Supplier<T> action) {
        Instant previous = pinned.get();
        pinned.set(at);
        try {
            return action.get();
        } finally {
            if (previous == null) {
                pinned.remove();
            } else {
                pinned.set(previous);
            }
        }
    }

    public void runAt(Instant at, Runnable action) {
        callAt(at, () -> {
            action.run();
            return null;
        });
    }
}
