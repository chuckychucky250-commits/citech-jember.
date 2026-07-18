package com.geoevent.backend.service;

import com.geoevent.backend.model.CommunityEvidence;
import com.geoevent.backend.model.Event;
import com.geoevent.backend.repository.CommunityEvidenceRepository;
import com.geoevent.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final CommunityEvidenceRepository communityEvidenceRepository;

    @Autowired
    public EventService(EventRepository eventRepository, CommunityEvidenceRepository communityEvidenceRepository) {
        this.eventRepository = eventRepository;
        this.communityEvidenceRepository = communityEvidenceRepository;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public CommunityEvidence submitEvidence(CommunityEvidence evidence) {
        // Set default status to PENDING for new submissions
        if (evidence.getStatus() == null) {
            evidence.setStatus(CommunityEvidence.EvidenceStatus.PENDING);
        }
        if (evidence.getSubmittedAt() == null) {
            evidence.setSubmittedAt(LocalDateTime.now());
        }
        
        // Save the community evidence
        return communityEvidenceRepository.save(evidence);
    }
}
