package com.mallesh.jkb.service;

import com.mallesh.jkb.model.Attendance;
import com.mallesh.jkb.model.Mark;
import com.mallesh.jkb.model.Student;
import com.mallesh.jkb.repository.AttendanceRepository;
import com.mallesh.jkb.repository.MarkRepository;
import com.mallesh.jkb.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Service to build student reports combining Student, Mark and Attendance data.
 *
 * Note: This implementation is defensive:
 *  - Converts Iterable -> List where needed (works if repositories extend CrudRepository).
 *  - Uses Student.getUsn() (your Student entity uses `usn` as the ID).
 *  - If your Attendance/Mark entities use different getter names, adapt small parts below.
 */
@Service
public class ReportService {

    private final StudentRepository studentRepository;
    private final MarkRepository markRepository;
    private final AttendanceRepository attendanceRepository;

    public ReportService(StudentRepository studentRepository,
                         MarkRepository markRepository,
                         AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.markRepository = markRepository;
        this.attendanceRepository = attendanceRepository;
    }

    /**
     * DTO for the combined report for a single student.
     */
    public static class StudentReport {
        public Student student;                 // profile
        public List<Mark> marks = new ArrayList<>();            // all mark rows for student
        public List<Attendance> attendanceRows = new ArrayList<>(); // raw attendance rows
        public int totalSessions = 0;
        public int presentCount = 0;
        public double attendancePercent = 0.0;

        public StudentReport(Student student) {
            this.student = student;
        }
    }

    /**
     * Build a report for a single student by USN.
     * Returns Optional.empty() if student not found.
     */
    public Optional<StudentReport> getStudentFullReport(String usn) {
        if (usn == null || usn.isBlank()) return Optional.empty();

        Optional<Student> sOpt = studentRepository.findByUsn(usn);
        if (sOpt.isEmpty()) return Optional.empty();

        Student student = sOpt.get();
        StudentReport report = new StudentReport(student);

        // Load marks for this student (by usn)
        List<Mark> marks = safeList(markRepository.findByUsn(usn));
        report.marks = marks;

        // Load attendance for this student (by usn)
        List<Attendance> attendanceRows = safeList(attendanceRepository.findByUsn(usn));
        report.attendanceRows = attendanceRows;

        // Compute attendance totals:
        int total = attendanceRows.size();
        int present = 0;
        for (Attendance a : attendanceRows) {
            // Try commonly used getter names for presence
            Boolean isPresent = null;
            try {
                // If method is named getPresent()
                isPresent = (Boolean) Attendance.class.getMethod("getPresent").invoke(a);
            } catch (Exception ignored) {}

            if (isPresent == null) {
                try {
                    // If method is named isPresent()
                    isPresent = (Boolean) Attendance.class.getMethod("isPresent").invoke(a);
                } catch (Exception ignored) {}
            }

            // If reflection failed, attempt direct field access via known property (fallback)
            if (isPresent == null) {
                // try boolean present field (not ideal, but defensive)
                try {
                    java.lang.reflect.Field f = Attendance.class.getDeclaredField("present");
                    f.setAccessible(true);
                    Object val = f.get(a);
                    if (val instanceof Boolean) isPresent = (Boolean) val;
                } catch (Exception ignored) {}
            }

            if (Boolean.TRUE.equals(isPresent)) present++;
        }

        report.totalSessions = total;
        report.presentCount = present;
        report.attendancePercent = (total == 0) ? 0.0 : (present * 100.0 / total);

        return Optional.of(report);
    }

    /**
     * Build reports for all students.
     */
    public List<StudentReport> getAllStudentReports() {
        List<Student> students = safeList(studentRepository.findAll());

        return students.stream()
                .map(s -> getStudentFullReport(s.getUsn()).orElseGet(() -> {
                    // fallback empty report if something unexpected happens
                    StudentReport r = new StudentReport(s);
                    r.marks = Collections.emptyList();
                    r.attendanceRows = Collections.emptyList();
                    r.totalSessions = 0;
                    r.presentCount = 0;
                    r.attendancePercent = 0.0;
                    return r;
                }))
                .collect(Collectors.toList());
    }

    /**
     * Utility to convert Iterable<T> to List<T> safely.
     */
    private static <T> List<T> safeList(Iterable<T> iterable) {
        if (iterable == null) return Collections.emptyList();
        if (iterable instanceof Collection) {
            return new ArrayList<>((Collection<T>) iterable);
        }
        List<T> list = new ArrayList<>();
        iterable.forEach(list::add);
        return list;
    }

    // --- optional convenience queries ---

    /**
     * Get reports for all students in a subject
     */
    public List<StudentReport> getReportsBySubject(String subject) {
        if (subject == null || subject.isBlank()) return Collections.emptyList();

        // get students for the subject (if repository has findBySubject)
        List<Student> students;
        try {
            students = safeList(studentRepository.findBySubject(subject));
        } catch (Exception e) {
            // fallback: compute from all students filtered by subject field
            students = safeList(studentRepository.findAll()).stream()
                    .filter(s -> subject.equals(s.getSubject()))
                    .collect(Collectors.toList());
        }

        return students.stream()
                .map(s -> getStudentFullReport(s.getUsn()).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Example: aggregate marks for a student by test name (returns Map<testName, List<Mark>>)
     */
    public Map<String, List<Mark>> groupMarksByTestForStudent(String usn) {
        List<Mark> marks = safeList(markRepository.findByUsn(usn));
        return marks.stream().collect(Collectors.groupingBy(m -> {
            // try to use getTest() fallback
            try {
                return (String) Mark.class.getMethod("getTest").invoke(m);
            } catch (Exception e) {
                try {
                    java.lang.reflect.Field f = Mark.class.getDeclaredField("test");
                    f.setAccessible(true);
                    Object val = f.get(m);
                    return val == null ? "unknown" : String.valueOf(val);
                } catch (Exception ex) {
                    return "unknown";
                }
            }
        }));
    }
}
