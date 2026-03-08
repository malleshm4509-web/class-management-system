package com.mallesh.jkb.controller;

import com.mallesh.jkb.model.Mark;
import com.mallesh.jkb.service.MarkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@CrossOrigin(origins = "http://localhost:5173") // change origin if needed
public class MarkController {
    private final MarkService markService;
    public MarkController(MarkService markService) { this.markService = markService; }

    @GetMapping
    public List<Mark> all() { return markService.findAll(); }

    @GetMapping("/by-student/{usn}")
    public List<Mark> byStudent(@PathVariable String usn) { return markService.findByUsn(usn); }

    @GetMapping("/by-subject/{subject}")
    public List<Mark> bySubject(@PathVariable String subject) { return markService.findBySubject(subject); }

    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody Mark mark) {
        if (mark.getUsn() == null || mark.getUsn().isBlank()) {
            return ResponseEntity.badRequest().body("usn required");
        }
        try {
            if (mark.getId() != null) {
                var saved = markService.save(mark);
                return ResponseEntity.ok(saved);
            } else {
                var saved = markService.upsertByUsnSubjectTest(mark);
                return ResponseEntity.ok(saved);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("error: " + e.getMessage());
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> bulk(@RequestBody List<Mark> marks) {
        if (marks == null || marks.isEmpty()) return ResponseEntity.badRequest().body("empty payload");
        try {
            var saved = marks.stream().map(markService::upsertByUsnSubjectTest).toList();
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (markService.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        markService.delete(id);
        return ResponseEntity.ok("Deleted");
    }
}
