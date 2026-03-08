package com.mallesh.jkb.dto;

public class StudentSummaryDto {
    private String usn;
    private String name;
    private Double averageMarks;
    private Double attendancePercent;

    public StudentSummaryDto() {}

    public StudentSummaryDto(String usn, String name, Double averageMarks, Double attendancePercent) {
        this.usn = usn;
        this.name = name;
        this.averageMarks = averageMarks;
        this.attendancePercent = attendancePercent;
    }

    // getters & setters
    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getAverageMarks() { return averageMarks; }
    public void setAverageMarks(Double averageMarks) { this.averageMarks = averageMarks; }
    public Double getAttendancePercent() { return attendancePercent; }
    public void setAttendancePercent(Double attendancePercent) { this.attendancePercent = attendancePercent; }
}
