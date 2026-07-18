package com.geoevent.backend.controller;

import com.geoevent.backend.model.CommunityEvidence;
import com.geoevent.backend.model.Event;
import com.geoevent.backend.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {

    private final EventService eventService;

    @Autowired
    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        List<Event> events = eventService.getAllEvents();
        return new ResponseEntity<>(events, HttpStatus.OK);
    }

    @PostMapping("/evidence")
    public ResponseEntity<CommunityEvidence> submitEvidence(@RequestBody CommunityEvidence evidence) {
        CommunityEvidence savedEvidence = eventService.submitEvidence(evidence);
        return new ResponseEntity<>(savedEvidence, HttpStatus.CREATED);
    }
}
