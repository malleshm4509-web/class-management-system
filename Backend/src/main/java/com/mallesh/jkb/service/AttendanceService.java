package com.mallesh.jkb.service;

import com.mallesh.jkb.model.Attendance;
import com.mallesh.jkb.repository.AttendanceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository repo;

    public AttendanceService(AttendanceRepository repo) {
        this.repo = repo;
    }

    public List<Attendance> findAll() {
        return repo.findAll();
    }

    public List<Attendance> findBySubject(String subject) {
        return repo.findBySubject(subject);
    }

    public List<Attendance> saveAll(List<Attendance> rows) {
        return repo.saveAll(rows);
    }
}
