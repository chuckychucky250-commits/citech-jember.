package com.geoevent.backend.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Geometry;

@Entity
@Table(name = "spatial_polygons")
public class SpatialPolygon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timeline_id", nullable = false)
    private Timeline timeline;

    @Column(length = 50)
    private String renderType; // e.g., area, network, route, point

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "geometry(Geometry, 4326)", nullable = false)
    private Geometry areaPolygon;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Timeline getTimeline() {
        return timeline;
    }

    public void setTimeline(Timeline timeline) {
        this.timeline = timeline;
    }

    public String getRenderType() {
        return renderType;
    }

    public void setRenderType(String renderType) {
        this.renderType = renderType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Geometry getAreaPolygon() {
        return areaPolygon;
    }

    public void setAreaPolygon(Geometry areaPolygon) {
        this.areaPolygon = areaPolygon;
    }
}
