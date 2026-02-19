package com.mallesh.jkb.dto;

import com.mallesh.jkb.model.Student;
import com.mallesh.jkb.model.Mark;
import com.mallesh.jkb.model.Attendance;
import java.util.List;
import java.util.Objects;

public class ReportResponse {

    private Student student;
    private List<Mark> marks;
    private List<Attendance> attendance;

    public ReportResponse() {}

    public ReportResponse(Student student, List<Mark> marks, List<Attendance> attendance) {
        this.student = student;
        this.marks = marks;
        this.attendance = attendance;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public List<Mark> getMarks() {
        return marks;
    }

    public void setMarks(List<Mark> marks) {
        this.marks = marks;
    }

    public List<Attendance> getAttendance() {
        return attendance;
    }

    public void setAttendance(List<Attendance> attendance) {
        this.attendance = attendance;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        ReportResponse that = (ReportResponse) o;
        return Objects.equals(student, that.student) &&
                Objects.equals(marks, that.marks) &&
                Objects.equals(attendance, that.attendance);
    }

    @Override
    public int hashCode() {
        return Objects.hash(student, marks, attendance);
    }

    @Override
    public String toString() {
        return "ReportResponse{" +
                "student=" + student +
                ", marks=" + marks +
                ", attendance=" + attendance +
                '}';
    }
}
