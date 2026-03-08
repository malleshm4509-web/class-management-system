package com.mallesh.jkb.dto;

public class StudentDto {
    private Long id;
    private String name;
    private String usn;
    private String email;
    private String phone;
    private String department;
    private String semester;
    private String section;
    private String subject;

    public StudentDto() {}

    // getters & setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
}
