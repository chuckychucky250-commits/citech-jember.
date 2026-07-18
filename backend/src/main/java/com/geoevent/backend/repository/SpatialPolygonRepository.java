package com.geoevent.backend.repository;

import com.geoevent.backend.model.SpatialPolygon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpatialPolygonRepository extends JpaRepository<SpatialPolygon, Long> {
}
