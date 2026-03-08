package com.mallesh.jkb.repository;

import com.mallesh.jkb.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByUsn(String usn);
    List<Attendance> findBySubject(String subject);
    List<Attendance> findByAttendDate(LocalDate attendDate);
}
