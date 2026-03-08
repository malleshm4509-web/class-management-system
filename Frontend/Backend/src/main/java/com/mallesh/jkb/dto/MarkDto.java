package com.mallesh.jkb.dto;

import java.time.LocalDate;

public class MarkDto {
    private Long id;
    private String usn;
    private String subject;
    private Double marksObtained;
    private Double maxMarks;
    private LocalDate examDate;

    public MarkDto() {}

    public MarkDto(Long id, String usn, String subject, Double marksObtained, Double maxMarks, LocalDate examDate) {
        this.id = id;
        this.usn = usn;
        this.subject = subject;
        this.marksObtained = marksObtained;
        this.maxMarks = maxMarks;
        this.examDate = examDate;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public Double getMarksObtained() { return marksObtained; }
    public void setMarksObtained(Double marksObtained) { this.marksObtained = marksObtained; }
    public Double getMaxMarks() { return maxMarks; }
    public void setMaxMarks(Double maxMarks) { this.maxMarks = maxMarks; }
    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }
}
