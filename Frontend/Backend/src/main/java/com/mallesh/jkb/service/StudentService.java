package com.mallesh.jkb.service;

import com.mallesh.jkb.model.Student;
import com.mallesh.jkb.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository repo;

    public StudentService(StudentRepository repo) {
        this.repo = repo;
    }

    public List<Student> findAll() {
        return repo.findAll();
    }

    public Optional<Student> findByUsn(String usn) {
        return repo.findByUsn(usn);
    }

    public List<Student> findBySubject(String subject) {
        return repo.findBySubject(subject);
    }

    public Student save(Student s) {
        return repo.save(s);
    }

    public int deleteByUsn(String usn) {
        return repo.deleteByUsn(usn);
    }

    public int deleteBySubject(String subject) {
        return repo.deleteBySubject(subject);
    }

    /**
     * Safely delete a group only when ALL fields are non-null and valid.
     * Throws IllegalArgumentException when inputs are missing / invalid.
     *
     * @param department non-null department
     * @param semesterStr semester as string (will be parsed to Integer)
     * @param section non-null section
     * @param subject non-null subject
     * @return number of deleted rows
     */
    @Transactional
    public int deleteByFilters(String department, String semesterStr, String section, String subject) {
        // Validate presence of all filters (prevent accidental global deletes)
        if (department == null || department.trim().isEmpty()
                || semesterStr == null || semesterStr.trim().isEmpty()
                || section == null || section.trim().isEmpty()
                || subject == null || subject.trim().isEmpty()) {
            throw new IllegalArgumentException("department, semester, section and subject are all required and must be non-empty");
        }

        Integer semester;
        try {
            semester = Integer.valueOf(semesterStr.trim());
        } catch (NumberFormatException nfe) {
            throw new IllegalArgumentException("semester must be a valid integer", nfe);
        }

        // Call the safe repository deleteGroup method
        return repo.deleteGroup(department.trim(), semester, section.trim(), subject.trim());
    }

    // Delete only one exact student record (USN + Dept + Sem + Sec + Subject)
    @Transactional
    public int deleteSpecificRecord(String usn, String department, Integer semester, String section, String subject) {
        return repo.deleteSpecificRecord(usn, department, semester, section, subject);
    }

    public Student updateStudent(String usn, Student updated) {
        return repo.findByUsn(usn).map(student -> {
            student.setName(updated.getName());
            student.setDepartment(updated.getDepartment());
            student.setSemester(updated.getSemester());
            student.setSection(updated.getSection());
            student.setSubject(updated.getSubject());
            return repo.save(student);
        }).orElse(null);
    }
}
