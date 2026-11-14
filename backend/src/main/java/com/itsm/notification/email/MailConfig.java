package com.itsm.notification.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Chooses the email gateway at startup. Spring Boot creates a JavaMailSender only when
 * spring.mail.host is set (e.g. Mailtrap in application-local.properties); otherwise emails are
 * simulated in the console. No code change is needed to switch.
 */
@Slf4j
@Configuration
@EnableAsync
public class MailConfig {

    @Bean
    public EmailGateway emailGateway(ObjectProvider<JavaMailSender> mailSender,
                                     @Value("${app.mail.from:I-ITSM Service Desk <no-reply@itsm.local>}") String from) {
        JavaMailSender sender = mailSender.getIfAvailable();
        EmailGateway gateway = sender == null ? new LoggingEmailGateway() : new JavaMailEmailGateway(sender, from);
        log.info("Email notifications: {}", gateway.mode());
        return gateway;
    }
}
