package com.mallesh.jkb.model;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Aggregated report DTO for a single student.
 * Not a JPA entity — just a data transfer object returned by ReportService.
 */
public class Report {

    private String usn;
    private String name;
    private String email;
    private String department;
    private String semester;
    private String section;
    private String subject; // active subject for which report is generated (optional)

    // raw lists
    private List<Mark> marks;               // all marks rows for this student (optionally filtered by subject)
    private List<Attendance> attendance;   // all attendance rows for this student (optionally filtered by subject)

    // summary metrics
    private long totalSessions;
    private long presentCount;
    private double attendancePercentage;

    // computed summary for marks: test -> obtained / max
    // e.g. {"PA1": 18.0, "PA2": 19.5}
    private Map<String, Double> marksObtainedByTest;
    private double totalMarksObtained;
    private double totalMaxMarks;

    // optional: date of report generation
    private LocalDate generatedAt;

    public Report() {}

    // getters / setters

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public List<Mark> getMarks() { return marks; }
    public void setMarks(List<Mark> marks) { this.marks = marks; }

    public List<Attendance> getAttendance() { return attendance; }
    public void setAttendance(List<Attendance> attendance) { this.attendance = attendance; }

    public long getTotalSessions() { return totalSessions; }
    public void setTotalSessions(long totalSessions) { this.totalSessions = totalSessions; }

    public long getPresentCount() { return presentCount; }
    public void setPresentCount(long presentCount) { this.presentCount = presentCount; }

    public double getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(double attendancePercentage) { this.attendancePercentage = attendancePercentage; }

    public Map<String, Double> getMarksObtainedByTest() { return marksObtainedByTest; }
    public void setMarksObtainedByTest(Map<String, Double> marksObtainedByTest) { this.marksObtainedByTest = marksObtainedByTest; }

    public double getTotalMarksObtained() { return totalMarksObtained; }
    public void setTotalMarksObtained(double totalMarksObtained) { this.totalMarksObtained = totalMarksObtained; }

    public double getTotalMaxMarks() { return totalMaxMarks; }
    public void setTotalMaxMarks(double totalMaxMarks) { this.totalMaxMarks = totalMaxMarks; }

    public LocalDate getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDate generatedAt) { this.generatedAt = generatedAt; }
}
