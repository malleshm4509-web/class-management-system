package com.mallesh.jkb.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "marks")
public class Mark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String usn;
    private String subject;
    private String test;

    // column name matches DB
    @Column(name = "marks")
    private Double marks = 0.0;

    @Column(name = "max_marks")
    private Double maxMarks = 0.0;

    // getters / setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getTest() { return test; }
    public void setTest(String test) { this.test = test; }

    @JsonProperty("marks")
    public Double getMarks() { return marks; }
    @JsonProperty("marks")
    public void setMarks(Double marks) { this.marks = marks; }

    @JsonProperty("maxMarks")
    public Double getMaxMarks() { return maxMarks; }
    @JsonProperty("maxMarks")
    public void setMaxMarks(Double maxMarks) { this.maxMarks = maxMarks; }
}
