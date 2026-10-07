package com.fitplix.service;

import com.fitplix.entity.AnalyticsEvent;
import com.fitplix.repository.EventRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class EventService {
  private final EventRepository events;

  public EventService(EventRepository events) {
    this.events = events;
  }

  public void record(UUID user, String name) {
    AnalyticsEvent e = new AnalyticsEvent();
    e.userId = user;
    e.eventName = name;
    events.save(e);
  }
}
