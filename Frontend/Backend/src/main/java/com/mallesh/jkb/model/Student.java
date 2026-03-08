package com.mallesh.jkb.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Index;

/**
 * Student entity: uses an auto-generated numeric id as primary key.
 * usn remains a business identifier (not the JPA @Id) so one student can have
 * multiple rows (e.g., one row per subject) if needed.
 */
@Entity
@Table(name = "students", indexes = {
        @Index(name = "idx_students_usn", columnList = "usn")
})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;   // auto-generated primary key

    @Column(nullable = false)
    private String usn;   // business identifier (not the PK)

    private String name;
    private String email;
    private String phone;
    private String department;

    /**
     * Use Integer so repository methods can compare numerically.
     */
    private Integer semester;

    private String section;
    private String subject;

    public Student() {}

    // --- getters & setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
}
