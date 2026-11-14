package com.itsm.notification.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/** Adapter: makes Spring's JavaMailSender fit our EmailGateway interface. Used when SMTP is configured. */
public class JavaMailEmailGateway implements EmailGateway {

    private final JavaMailSender mailSender;
    private final String from;

    public JavaMailEmailGateway(JavaMailSender mailSender, String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public String mode() {
        return "SMTP";
    }

    @Override
    public void send(EmailMessage message) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo(message.to());
        mail.setSubject(message.subject());
        mail.setText(message.text());
        mailSender.send(mail);
    }
}
