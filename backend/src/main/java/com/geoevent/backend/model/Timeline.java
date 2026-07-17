package com.geoevent.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "timelines")
public class Timeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private LocalDateTime dateTime;

    @Column(nullable = false)
    private String milestoneTitle;

    @Column(columnDefinition = "TEXT")
    private String narrative;

    private String stat1Label;
    private String stat1Value;
    private String stat2Label;
    private String stat2Value;

    @OneToMany(mappedBy = "timeline", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SpatialPolygon> spatialPolygons;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public String getMilestoneTitle() {
        return milestoneTitle;
    }

    public void setMilestoneTitle(String milestoneTitle) {
        this.milestoneTitle = milestoneTitle;
    }

    public String getNarrative() {
        return narrative;
    }

    public void setNarrative(String narrative) {
        this.narrative = narrative;
    }

    public String getStat1Label() {
        return stat1Label;
    }

    public void setStat1Label(String stat1Label) {
        this.stat1Label = stat1Label;
    }

    public String getStat1Value() {
        return stat1Value;
    }

    public void setStat1Value(String stat1Value) {
        this.stat1Value = stat1Value;
    }

    public String getStat2Label() {
        return stat2Label;
    }

    public void setStat2Label(String stat2Label) {
        this.stat2Label = stat2Label;
    }

    public String getStat2Value() {
        return stat2Value;
    }

    public void setStat2Value(String stat2Value) {
        this.stat2Value = stat2Value;
    }

    public List<SpatialPolygon> getSpatialPolygons() {
        return spatialPolygons;
    }

    public void setSpatialPolygons(List<SpatialPolygon> spatialPolygons) {
        this.spatialPolygons = spatialPolygons;
    }
}
