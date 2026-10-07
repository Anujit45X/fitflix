package com.fitplix;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fitplix.dto.ProfileRequest;
import com.fitplix.entity.*;
import com.fitplix.repository.*;
import com.fitplix.service.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class ProfileServiceTest {
  @Test
  void mifflinTargetHasKnownIndependentResult() {
    var repo = mock(ProfileRepository.class);
    var events = mock(EventService.class);
    var exp = mock(ExperimentService.class);
    UUID id = UUID.randomUUID();
    when(repo.findById(id)).thenReturn(Optional.empty());
    var service = new ProfileService(repo, events, exp);
    var p =
        service.save(
            id,
            new ProfileRequest(
                25, "MALE", 175, 75, 70, "MODERATE", "LOSE", "ANY", 2500, "Asia/Kolkata"));
    assertEquals(2372, p.calorieTarget);
    assertEquals(120, p.proteinTarget);
    verify(events).record(id, "ONBOARDING_COMPLETED");
    verify(exp).assign(id);
  }

  @Test
  void wrongGoalDirectionRejected() {
    var service =
        new ProfileService(
            mock(ProfileRepository.class), mock(EventService.class), mock(ExperimentService.class));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            service.save(
                UUID.randomUUID(),
                new ProfileRequest(
                    25, "MALE", 175, 75, 80, "MODERATE", "LOSE", "ANY", 2500, "UTC")));
  }
}
