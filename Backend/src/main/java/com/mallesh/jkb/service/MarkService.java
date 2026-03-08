package com.mallesh.jkb.service;

import com.mallesh.jkb.model.Mark;
import com.mallesh.jkb.repository.MarkRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MarkService {
    private final MarkRepository repo;
    public MarkService(MarkRepository repo) { this.repo = repo; }

    public List<Mark> findAll() { return repo.findAll(); }
    public Optional<Mark> findById(Long id) { return repo.findById(id); }
    public List<Mark> findByUsn(String usn) { return repo.findByUsn(usn); }
    public List<Mark> findBySubject(String subject) { return repo.findBySubject(subject); }
    public Mark save(Mark m) { return repo.save(m); }
    public void delete(Long id) { repo.deleteById(id); }

    // upsert by usn+subject+test
    public Mark upsertByUsnSubjectTest(Mark input) {
        if (input.getUsn() == null || input.getSubject() == null) {
            throw new IllegalArgumentException("usn and subject required");
        }
        var existing = repo.findByUsnAndSubjectAndTest(input.getUsn(), input.getSubject(), input.getTest());
        if (existing.isPresent()) {
            Mark m = existing.get();
            m.setMarks(input.getMarks());
            m.setMaxMarks(input.getMaxMarks());
            return repo.save(m);
        } else {
            return repo.save(input);
        }
    }
}
