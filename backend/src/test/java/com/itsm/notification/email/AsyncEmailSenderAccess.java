package com.itsm.notification.email;

/** Test helper: exposes the package-private rate-limit check to tests in other packages. */
public final class AsyncEmailSenderAccess {

    private AsyncEmailSenderAccess() {
    }

    public static boolean isRateLimited(Throwable error) {
        return AsyncEmailSender.isRateLimited(error);
    }
}
