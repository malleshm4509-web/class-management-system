package com.mallesh.jkb.controller;

import com.mallesh.jkb.model.Attendance;
import com.mallesh.jkb.repository.AttendanceRepository;
import com.mallesh.jkb.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceRepository attendanceRepo;
    private final StudentRepository studentRepo;

    public AttendanceController(AttendanceRepository attendanceRepo, StudentRepository studentRepo) {
        this.attendanceRepo = attendanceRepo;
        this.studentRepo = studentRepo;
    }

    @GetMapping
    public List<Attendance> all() {
        return attendanceRepo.findAll();
    }

    @GetMapping("/by-subject/{subject}")
    public List<Attendance> bySubject(@PathVariable String subject) {
        return attendanceRepo.findBySubject(subject);
    }

    /**
     * Bulk save attendance rows
     * Accepts array of { usn, subject, attendDate, present }
     * Returns { saved, errors, savedCount, errorCount }
     */
    @PostMapping("/bulk")
    public ResponseEntity<?> bulk(@RequestBody List<Map<String, Object>> rows) {
        List<Attendance> toSave = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> r = rows.get(i);
            try {
                String usn = r.containsKey("usn") && r.get("usn") != null ? String.valueOf(r.get("usn")).trim() : null;
                String subject = r.containsKey("subject") && r.get("subject") != null ? String.valueOf(r.get("subject")) : null;
                String dateStr = r.containsKey("attendDate") && r.get("attendDate") != null ? String.valueOf(r.get("attendDate")) : null;
                Boolean present = r.containsKey("present") && r.get("present") != null
                        ? (r.get("present") instanceof Boolean ? (Boolean) r.get("present") : Boolean.parseBoolean(String.valueOf(r.get("present"))))
                        : Boolean.FALSE;

                if (usn == null || usn.isEmpty()) {
                    Map<String, Object> err = new HashMap<>();
                    err.put("rowIndex", i);
                    err.put("payload", r);
                    err.put("error", "Missing or empty usn");
                    errors.add(err);
                    continue;
                }

                // Optional: ensure USN exists in students. If you want to enforce, uncomment check block below:
                /*
                if (!studentRepo.existsById(usn) && !studentRepo.existsByUsn(usn)) {
                    Map<String,Object> err = new HashMap<>();
                    err.put("rowIndex", i);
                    err.put("payload", r);
                    err.put("error", "USN not found in students table: " + usn);
                    errors.add(err);
                    continue;
                }
                */

                Attendance a = new Attendance();
                a.setUsn(usn);
                a.setSubject(subject);
                if (dateStr != null && !dateStr.isEmpty()) {
                    try { a.setAttendDate(LocalDate.parse(dateStr)); } catch (Exception ex) { a.setAttendDate(null); }
                }
                a.setPresent(present);

                toSave.add(a);
            } catch (Exception ex) {
                Map<String, Object> err = new HashMap<>();
                err.put("rowIndex", i);
                err.put("payload", r);
                err.put("error", "Unhandled: " + ex.getMessage());
                errors.add(err);
            }
        }

        List<Attendance> saved = Collections.emptyList();
        if (!toSave.isEmpty()) saved = attendanceRepo.saveAll(toSave);

        Map<String, Object> resp = new HashMap<>();
        resp.put("saved", saved);
        resp.put("errors", errors);
        resp.put("savedCount", saved.size());
        resp.put("errorCount", errors.size());

        return ResponseEntity.ok(resp);
    }
}
