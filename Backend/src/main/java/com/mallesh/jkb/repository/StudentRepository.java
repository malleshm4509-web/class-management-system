package com.mallesh.jkb.repository;

import com.mallesh.jkb.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUsn(String usn);

    List<Student> findBySubject(String subject);

    @Transactional
    @Modifying
    int deleteByUsn(String usn);

    @Transactional
    @Modifying
    int deleteBySubject(String subject);

    // ---------- SAFE exact-match group delete (REPLACES the dangerous "IS NULL" variant) ----------
    // Deletes rows ONLY when all 4 fields match exactly.
    @Modifying
    @Transactional
    @Query("DELETE FROM Student s WHERE " +
            "s.department = :department AND " +
            "s.semester = :semester AND " +
            "s.section = :section AND " +
            "s.subject = :subject")
    int deleteGroup(String department, Integer semester, String section, String subject);

    // Delete ONE specific record only (USN + dept + sem + sec + subject)
    @Transactional
    @Modifying
    @Query("DELETE FROM Student s WHERE " +
            "s.usn = :usn AND " +
            "s.department = :department AND " +
            "s.semester = :semester AND " +
            "s.section = :section AND " +
            "s.subject = :subject")
    int deleteSpecificRecord(String usn, String department, Integer semester, String section, String subject);
}
