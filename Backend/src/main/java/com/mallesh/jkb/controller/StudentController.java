package com.mallesh.jkb.controller;

import com.mallesh.jkb.model.Student;
import com.mallesh.jkb.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Student> getAll() {
        return service.findAll();
    }

    @GetMapping("/{usn}")
    public ResponseEntity<Student> getByUsn(@PathVariable String usn) {
        return service.findByUsn(usn)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Student create(@RequestBody Student s) {
        return service.save(s);
    }

    @PutMapping("/{usn}")
    public ResponseEntity<Student> update(@PathVariable String usn, @RequestBody Student updated) {
        Student s = service.updateStudent(usn, updated);
        return (s != null) ? ResponseEntity.ok(s) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{usn}")
    public ResponseEntity<Void> delete(@PathVariable String usn) {
        service.deleteByUsn(usn);
        return ResponseEntity.noContent().build();
    }

    /**
     * Keep the previous DELETE endpoint but make it defensive:
     * - It will reject ambiguous requests (when any param is missing).
     * - Encourages use of POST /delete-group for explicit group deletes.
     */
    @DeleteMapping
    public ResponseEntity<String> deleteByFilters(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String subject) {

        // Defensive: don't allow ambiguous deletes via query params
        if (department == null || semester == null || section == null || subject == null) {
            return ResponseEntity.badRequest()
                    .body("All filters (department, semester, section, subject) are required. Use POST /api/students/delete-group with JSON body to delete a group.");
        }

        try {
            service.deleteByFilters(department, semester, section, subject);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Server error: " + ex.getMessage());
        }
    }

    /**
     * New explicit POST endpoint that accepts JSON body:
     * { "department": "...", "semester": "...", "section": "...", "subject": "..." }
     * This is the preferred safe path to delete a whole group.
     */
    @PostMapping("/delete-group")
    public ResponseEntity<?> deleteGroup(@RequestBody Map<String, String> body) {
        String department = body.get("department");
        String semester = body.get("semester");
        String section = body.get("section");
        String subject = body.get("subject");

        if (department == null || semester == null || section == null || subject == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "department, semester, section and subject are required in the request body"));
        }

        try {
            int deleted = service.deleteByFilters(department, semester, section, subject);
            return ResponseEntity.ok(Map.of("success", true, "deletedCount", deleted));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", iae.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("success", false, "error", "server error", "details", ex.getMessage()));
        }
    }

    @DeleteMapping("/delete-specific")
    public ResponseEntity<Void> deleteSpecific(
            @RequestParam String usn,
            @RequestParam String department,
            @RequestParam Integer semester,
            @RequestParam String section,
            @RequestParam String subject) {

        service.deleteSpecificRecord(usn, department, semester, section, subject);
        return ResponseEntity.noContent().build();
    }
}
