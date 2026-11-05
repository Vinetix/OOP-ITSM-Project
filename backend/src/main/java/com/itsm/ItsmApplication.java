package com.itsm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan // picks up config/AppProperties
public class ItsmApplication {

    public static void main(String[] args) {
        SpringApplication.run(ItsmApplication.class, args);
    }
}
