package com.mallesh.jkb.dto;

public class DeleteGroupRequest {
    private String department;
    private String semester;
    private String section;
    private String subject;
    private Boolean scoped; // optional guard if you want to require explicit scoped confirmation

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public Boolean getScoped() { return scoped; }
    public void setScoped(Boolean scoped) { this.scoped = scoped; }
}
