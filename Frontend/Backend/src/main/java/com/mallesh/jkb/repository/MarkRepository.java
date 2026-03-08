package com.mallesh.jkb.repository;

import com.mallesh.jkb.model.Mark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarkRepository extends JpaRepository<Mark, Long> {
    List<Mark> findByUsn(String usn);
    List<Mark> findBySubject(String subject);
    Optional<Mark> findByUsnAndSubjectAndTest(String usn, String subject, String test);
}
