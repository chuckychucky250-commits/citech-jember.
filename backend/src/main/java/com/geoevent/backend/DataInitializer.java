package com.geoevent.backend;

import com.geoevent.backend.model.Event;
import com.geoevent.backend.repository.EventRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    @Bean
    public CommandLineRunner loadData(EventRepository eventRepository) {
        return args -> {
            if (eventRepository.count() == 0) {
                // Gunakan SRID 4326 (WGS 84) agar cocok dengan columnDefinition di Event.java
                GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);
                
                Event event1 = new Event();
                event1.setTitle("Banjir Bandang Desa Panti");
                event1.setShortDescription("Banjir bandang besar yang melanda area sekitar Pegunungan Argopuro.");
                event1.setCategory("Bencana Alam");
                event1.setEventYear("2006");
                // Koordinat format: Longitude, Latitude
                event1.setMainLocation(factory.createPoint(new Coordinate(113.585, -8.140)));
                eventRepository.save(event1);

                Event event2 = new Event();
                event2.setTitle("Tragedi Sosial Jember");
                event2.setShortDescription("Pergerakan massa dan insiden sosial yang tercatat dalam sejarah modern Jember.");
                event2.setCategory("Tragedi Sosial");
                event2.setEventYear("1998");
                event2.setMainLocation(factory.createPoint(new Coordinate(113.650, -8.180)));
                eventRepository.save(event2);

                System.out.println("=========================================================");
                System.out.println("✅ Mock Data untuk Event berhasil dimasukkan ke H2 Database!");
                System.out.println("=========================================================");
            }
        };
    }
}
