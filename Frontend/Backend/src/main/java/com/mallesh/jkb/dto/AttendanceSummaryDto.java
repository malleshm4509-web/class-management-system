package com.mallesh.jkb.dto;

public class AttendanceSummaryDto {
    private Long total;
    private Long present;
    private Double percent; // 0-100

    public AttendanceSummaryDto() {}

    public AttendanceSummaryDto(Long total, Long present, Double percent) {
        this.total = total;
        this.present = present;
        this.percent = percent;
    }

    // getters & setters
    public Long getTotal() { return total; }
    public void setTotal(Long total) { this.total = total; }
    public Long getPresent() { return present; }
    public void setPresent(Long present) { this.present = present; }
    public Double getPercent() { return percent; }
    public void setPercent(Double percent) { this.percent = percent; }
}
