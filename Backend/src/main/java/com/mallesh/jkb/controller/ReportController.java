package com.mallesh.jkb.controller;

import com.mallesh.jkb.service.ReportService;
import com.mallesh.jkb.service.ReportService.StudentReport;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*") // change in production
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Get full report for a single student by USN.
     * Example: GET /api/reports/student/4AD23CS002
     */
    @GetMapping("/student/{usn}")
    public ResponseEntity<?> getStudentReport(@PathVariable String usn) {
        return reportService.getStudentFullReport(usn)
                .map(r -> ResponseEntity.ok(r))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get reports for all students.
     * Example: GET /api/reports
     */
    @GetMapping
    public ResponseEntity<List<StudentReport>> getAllReports() {
        List<StudentReport> list = reportService.getAllStudentReports();
        return ResponseEntity.ok(list);
    }

    /**
     * Get reports for students by subject.
     * Example: GET /api/reports/by-subject/Mathematics
     */
    @GetMapping("/by-subject/{subject}")
    public ResponseEntity<List<StudentReport>> getReportsBySubject(@PathVariable String subject) {
        List<StudentReport> list = reportService.getReportsBySubject(subject);
        return ResponseEntity.ok(list);
    }
}
