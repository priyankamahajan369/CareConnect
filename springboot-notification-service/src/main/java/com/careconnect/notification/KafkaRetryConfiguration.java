package com.careconnect.notification;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.*;
import org.springframework.kafka.config.*;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.*;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaRetryConfiguration {
  @Bean
  NewTopic appointmentEvents() {
    return new NewTopic("appointment.events", 3, (short) 1);
  }

  @Bean
  NewTopic appointmentDlt() {
    return new NewTopic("appointment.events.DLT", 3, (short) 1);
  }

  @Bean
  DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, String> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);
    recoverer.setFailIfSendResultIsError(true);
    return new DefaultErrorHandler(recoverer, new FixedBackOff(1000, 3));
  }
}
