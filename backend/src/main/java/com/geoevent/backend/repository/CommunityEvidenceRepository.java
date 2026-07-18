package com.geoevent.backend.repository;

import com.geoevent.backend.model.CommunityEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityEvidenceRepository extends JpaRepository<CommunityEvidence, Long> {
}
