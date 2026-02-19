package com.mallesh.jkb.dto;

import java.util.List;

public class SubjectReportDto {
    private String subject;
    private Double averageMarks;
    private Long totalMarksCount;
    private List<MarkDto> topScorers;

    public SubjectReportDto() {}

    // getters & setters
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public Double getAverageMarks() { return averageMarks; }
    public void setAverageMarks(Double averageMarks) { this.averageMarks = averageMarks; }
    public Long getTotalMarksCount() { return totalMarksCount; }
    public void setTotalMarksCount(Long totalMarksCount) { this.totalMarksCount = totalMarksCount; }
    public List<MarkDto> getTopScorers() { return topScorers; }
    public void setTopScorers(List<MarkDto> topScorers) { this.topScorers = topScorers; }
}
