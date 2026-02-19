package com.mallesh.jkb.dto;

import java.util.List;

public class StudentReportDto {
    private String usn;
    private String name;
    private String department;
    private String semester;
    private String section;

    private List<MarkDto> marks;
    private Double averageMarks; // average of marks obtained (null if none)
    private AttendanceSummaryDto attendance;

    public StudentReportDto() {}

    // getters & setters
    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public List<MarkDto> getMarks() { return marks; }
    public void setMarks(List<MarkDto> marks) { this.marks = marks; }
    public Double getAverageMarks() { return averageMarks; }
    public void setAverageMarks(Double averageMarks) { this.averageMarks = averageMarks; }
    public AttendanceSummaryDto getAttendance() { return attendance; }
    public void setAttendance(AttendanceSummaryDto attendance) { this.attendance = attendance; }
}
