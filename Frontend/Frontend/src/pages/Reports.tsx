// src/pages/Reports.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Search, X } from "lucide-react";
import { useSharedStudents } from "@/hooks/useSharedStudents";

const LS_TOTALS = "app_attendance_totals_v1";
const LS_MARKS = "marks_data";
const LS_STUDENTS = "app_students_v1";

type StudentRecord = {
  id?: string;
  name?: string;
  usn?: string;
  email?: string;
  phone?: string;
  department?: string;
  semester?: number | string;
  section?: string;
  subject?: string;
  subjects?: string[];
};

type MarkRecord = {
  id?: number | string;
  usn?: string;
  studentId?: string;
  subject?: string;
  test?: string;
  marks?: number;
  maxMarks?: number;
  name?: string;
  studentName?: string;
  email?: string;
  semester?: number | string;
  section?: string;
};

type AttendanceRow = {
  id?: number | string;
  usn: string;
  subject: string;
  date?: string;
  present: boolean;
  name?: string;
  email?: string;
  semester?: number | string;
  section?: string;
};

const C = {
  pageBg: "#F3F7FB",
  appBg: "#F7FBFF",
  cardBg: "#FFFFFF",
  heading: "#1F2B46",
  subtext: "#6B7280",
  inputBorder: "#E6EEF8",
  inputBg: "#FFFFFF",
  primary: "#5B46FF",
  primaryHover: "#4230E6",
  icon: "#475569",
  divider: "#E6EEF8",
};

export default function Reports(): JSX.Element {
  const { currentStudents } = useSharedStudents();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [allMarks, setAllMarks] = useState<MarkRecord[]>([]);
  const [studentMarks, setStudentMarks] = useState<MarkRecord[]>([]);
  const [attendanceTotals, setAttendanceTotals] = useState<Record<string, any>>({});

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Try endpoints helper
  async function tryEndpoints(endpoints: string[]) {
    for (const ep of endpoints) {
      try {
        const res = await api.get(ep);
        if (res && res.data != null) return res.data;
      } catch {
        // ignore
      }
    }
    return null;
  }

  // Normalizers
  function normalizeStudentsPayload(payload: any): StudentRecord[] {
    if (!payload) return [];
    if (Array.isArray(payload)) {
      return payload.map((s: any) => ({
        id: s.id ?? s._id ?? s.usn ?? undefined,
        name: s.name ?? s.studentName ?? "",
        usn: (s.usn ?? s.USN ?? "").toString(),
        email: s.email ?? undefined,
        phone: s.phone ?? undefined,
        department: s.department ?? s.dept ?? undefined,
        semester: s.semester ?? s.sem ?? undefined,
        section: s.section ?? undefined,
      }));
    }
    if (payload.data && Array.isArray(payload.data)) return normalizeStudentsPayload(payload.data);
    if (typeof payload === "object") {
      const out: StudentRecord[] = [];
      Object.keys(payload).forEach((k) => {
        const arr = payload[k];
        if (Array.isArray(arr)) {
          arr.forEach((s: any, idx: number) => {
            out.push({
              id: s.id ?? s._id ?? s.usn ?? `${k}#${idx}`,
              name: s.name ?? s.studentName ?? "",
              usn: (s.usn ?? "").toString(),
              email: s.email,
              phone: s.phone,
              department: s.department,
              semester: s.semester,
              section: s.section,
            });
          });
        }
      });
      if (out.length) return out;
    }
    return [];
  }

  function normalizeMarksPayload(payload: any): MarkRecord[] {
    if (!payload) return [];
    if (Array.isArray(payload)) {
      return payload.map((r: any) => ({
        id: r.id ?? r._id ?? r.markId ?? undefined,
        usn: (r.usn ?? r.USN ?? r.studentUsn ?? "").toString(),
        studentId: r.studentId ?? undefined,
        subject: r.subject ?? r.sub ?? r.subjectName ?? "",
        test: r.test ?? r.exam ?? r.name ?? "",
        marks: Number(r.marks ?? r.marks_value ?? r.obtained ?? 0),
        maxMarks: Number(r.maxMarks ?? r.max_marks ?? r.max ?? 0),
        name: r.name ?? r.studentName ?? undefined,
        studentName: r.studentName ?? undefined,
        email: r.email ?? undefined,
        semester: r.semester ?? undefined,
        section: r.section ?? undefined,
      }));
    }
    if (payload.data && Array.isArray(payload.data)) return normalizeMarksPayload(payload.data);
    return [];
  }

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      // students
      const studentsData = await tryEndpoints(["/students", "/students/all", "/students/list"]);
      if (mounted && studentsData) {
        setStudents(normalizeStudentsPayload(studentsData));
      } else if (Array.isArray(currentStudents) && currentStudents.length > 0) {
        setStudents(normalizeStudentsPayload(currentStudents));
      } else {
        try {
          const raw = localStorage.getItem(LS_STUDENTS);
          if (raw) setStudents(normalizeStudentsPayload(JSON.parse(raw)));
          else setStudents([]);
        } catch {
          setStudents([]);
        }
      }

      // marks
      const marksData = await tryEndpoints(["/marks", "/marks/all", "/marks/list"]);
      if (mounted && marksData) setAllMarks(normalizeMarksPayload(marksData));
      else {
        try {
          const raw = localStorage.getItem(LS_MARKS);
          if (raw) setAllMarks(normalizeMarksPayload(JSON.parse(raw)));
          else setAllMarks([]);
        } catch {
          setAllMarks([]);
        }
      }

      // attendance
      const attendanceData = await tryEndpoints(["/attendance/totals", "/attendance/all", "/attendance"]);
      if (mounted && attendanceData) {
        if (Array.isArray(attendanceData)) {
          // convert array rows -> totals mapping
          const totals: Record<string, any> = {};
          attendanceData.forEach((row: any) => {
            const subj = row.subject || "Unknown";
            const key = `${row.department || ""}::${row.semester || ""}::${row.section || ""}::${subj}`;
            totals[key] = totals[key] || { classes: 0, totals: {} };
            totals[key].classes += 1;
            const usn = (row.usn ?? row.USN ?? row.studentUsn ?? "").toString();
            totals[key].totals[usn] = (totals[key].totals[usn] || 0) + (row.present ? 1 : 0);
          });
          setAttendanceTotals(totals);
        } else if (typeof attendanceData === "object") {
          setAttendanceTotals(attendanceData);
        } else {
          setAttendanceTotals({});
        }
      } else {
        try {
          const raw = localStorage.getItem(LS_TOTALS);
          if (raw) setAttendanceTotals(JSON.parse(raw));
          else setAttendanceTotals({});
        } catch {
          setAttendanceTotals({});
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudents]);

  // when selecting a student, fetch per-student marks + attendance fallback
  useEffect(() => {
    const fetchForStudent = async () => {
      if (!selectedStudentId) {
        setStudentMarks([]);
        return;
      }

      // try resolve USN from selectedStudentId
      let targetUsn = selectedStudentId;
      const s = students.find((x) => String(x.id) === String(selectedStudentId) || String(x.usn) === String(selectedStudentId));
      if (s?.usn) targetUsn = s.usn;
      else {
        const m = allMarks.find((mm) => String(mm.studentId) === String(selectedStudentId) || String(mm.id) === String(selectedStudentId));
        if (m?.usn) targetUsn = m.usn;
      }

      try {
        const res = await api.get(`/marks/by-student/${encodeURIComponent(targetUsn)}`);
        const payload = Array.isArray(res?.data) ? res.data : res?.data?.data ?? res?.data ?? [];
        setStudentMarks(normalizeMarksPayload(payload));
      } catch {
        setStudentMarks([]);
      }

      try {
        const ares = await api.get(`/attendance/by-student/${encodeURIComponent(targetUsn)}`);
        const rows = Array.isArray(ares?.data) ? ares.data : ares?.data?.data ?? [];
        if (Array.isArray(rows)) {
          const bySubject: Record<string, any> = {};
          (rows as AttendanceRow[]).forEach((r) => {
            const subj = r.subject || "Unknown";
            bySubject[subj] = bySubject[subj] || { classes: 0, attended: 0 };
            bySubject[subj].classes += 1;
            if (r.present) bySubject[subj].attended += 1;
          });
          // merge into attendanceTotals under a special key so we retain global totals too
          setAttendanceTotals((prev) => ({ ...(prev || {}), __byStudentFallback__: bySubject }));
        }
      } catch {
        // ignore
      }
    };

    fetchForStudent();
  }, [selectedStudentId, students, allMarks]);

  // Build candidate list (students + marks + attendance)
  const candidateList = useMemo(() => {
    const map = new Map<string, StudentRecord>();

    (students || []).forEach((s) => {
      const usn = (s.usn || "").toString().trim();
      if (!usn) return;
      if (!map.has(usn)) map.set(usn, { id: s.id ?? usn, usn, name: s.name ?? "", email: s.email, department: s.department, semester: s.semester, section: s.section });
      else {
        const cur = map.get(usn)!;
        cur.name = cur.name || s.name || "";
        cur.email = cur.email || s.email;
        cur.department = cur.department || s.department;
      }
    });

    (allMarks || []).forEach((m) => {
      const usn = (m.usn || "").toString().trim();
      if (!usn) return;
      if (!map.has(usn)) map.set(usn, { id: m.studentId ?? usn, usn, name: m.studentName ?? m.name ?? "", email: m.email, semester: m.semester, section: m.section });
      else {
        const cur = map.get(usn)!;
        cur.name = cur.name || m.studentName || m.name || "";
        cur.email = cur.email || m.email;
        cur.semester = cur.semester || m.semester;
        cur.section = cur.section || m.section;
      }
    });

    // IMPORTANT: include any USN found in attendanceTotals regardless of dept/sem/section.
    try {
      Object.keys(attendanceTotals || {}).forEach((k) => {
        if (k === "__byStudentFallback__") return;
        const entry = attendanceTotals[k];
        if (!entry || typeof entry !== "object") return;
        const totals = entry.totals || entry.totalsByUsn || entry.totalsMap || {};
        if (totals && typeof totals === "object") {
          Object.keys(totals).forEach((usnRaw) => {
            const usn = (usnRaw || "").toString().trim();
            if (!usn) return;
            if (!map.has(usn)) {
              // do minimal inference for display; do NOT filter out entries later
              const parts = String(k).split("::");
              map.set(usn, { id: usn, usn, name: "", email: undefined, department: parts[0] || undefined, semester: parts[1] || undefined, section: parts[2] || undefined });
            }
          });
        }
      });
    } catch {
      // ignore
    }

    return Array.from(map.values()).sort((a, b) => (a.usn || "").localeCompare(b.usn || ""));
  }, [students, allMarks, attendanceTotals]);

  // suggestions based on query
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const scored = (candidateList || [])
      .map((s) => {
        const usn = (s.usn || "").toString().toLowerCase();
        const name = (s.name || "").toString().toLowerCase();
        let score = 100;
        if (usn.startsWith(q)) score = 0;
        else if (name.startsWith(q)) score = 1;
        else if (usn.includes(q)) score = 10;
        else if (name.includes(q)) score = 11;
        else score = 999;
        return { s, score, usn, name };
      })
      .filter((x) => x.score !== 999)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return (a.usn || a.name).localeCompare(b.usn || b.name);
      })
      .map((x) => x.s);

    setSuggestions(scored.slice(0, 18));
  }, [query, candidateList]);

  const chooseSuggestion = (s: StudentRecord) => {
    setSelectedStudentId((s.id && String(s.id)) || (s.usn && String(s.usn)) || "");
    setQuery(s.usn || "");
    setSuggestions([]);
  };

  // selectedStudent lookup (robust)
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    // try students list
    let found = students.find((s) => String(s.id) === String(selectedStudentId) || String(s.usn) === String(selectedStudentId));
    if (found) return found;
    // try marks
    const byMark = allMarks.find((m) => String(m.studentId) === String(selectedStudentId) || String(m.usn) === String(selectedStudentId));
    if (byMark) return { id: byMark.studentId ?? byMark.id, usn: byMark.usn ?? String(selectedStudentId), name: byMark.studentName ?? byMark.name ?? "", email: byMark.email, semester: byMark.semester, section: byMark.section } as StudentRecord;
    // candidate fallback
    const cand = candidateList.find((c) => String(c.id) === String(selectedStudentId) || String(c.usn) === String(selectedStudentId));
    return cand || null;
  }, [selectedStudentId, students, allMarks, candidateList]);

  // marks for selected (global + fetched)
  const marksForSelected = useMemo(() => {
    const usnKey = (selectedStudent?.usn || selectedStudentId || "").toString();
    const fromAll = (allMarks || []).filter((m) => (m.usn || "").toString() === usnKey);
    const extras = (studentMarks || []).filter((m) => (m.usn || "").toString() === usnKey && !fromAll.some((a) => a.test === m.test && a.subject === m.subject));
    return [...fromAll, ...extras];
  }, [allMarks, studentMarks, selectedStudent, selectedStudentId]);

  // attendanceBySubject: include any subject where totals include student's USN (no dept/sem/section filtering)
  const attendanceBySubject = useMemo(() => {
    const result: Record<string, { totalClasses: number; attended: number; percent: string }> = {};
    const usnKey = (selectedStudent?.usn || selectedStudentId || "").toString();
    if (!usnKey) return result;

    // first, per-student fallback (if fetch returned rows)
    if (attendanceTotals && (attendanceTotals as any).__byStudentFallback__) {
      const by = (attendanceTotals as any).__byStudentFallback__;
      Object.keys(by).forEach((subj) => {
        const entry = by[subj];
        const classes = Number(entry.classes || 0);
        const attended = Number(entry.attended || 0);
        result[subj] = { totalClasses: classes, attended, percent: classes ? ((attended / classes) * 100).toFixed(1) : "0.0" };
      });
    }

    // then scan global totals for any subject where totals map contains the usnKey
    try {
      Object.keys(attendanceTotals || {}).forEach((k) => {
        if (k === "__byStudentFallback__") return;
        const entry = attendanceTotals[k];
        if (!entry || typeof entry !== "object") return;
        const totals = entry.totals || entry.totalsByUsn || entry.totalsMap || {};
        const classes = Number(entry.classes || entry.totalClasses || 0);
        // subject extraction fallback: try last piece if format dept::sem::sec::subject
        const pieces = String(k).split("::");
        const subj = pieces[3] ?? pieces[pieces.length - 1] ?? "Unknown";
        if (!subj) return;
        if (totals && typeof totals === "object" && totals[usnKey] != null) {
          const attended = Number(totals[usnKey] || 0);
          // merge with existing — prefer higher classes count
          const existing = result[subj];
          if (!existing || classes > existing.totalClasses) {
            result[subj] = { totalClasses: classes, attended, percent: classes ? ((attended / classes) * 100).toFixed(1) : "0.0" };
          } else {
            // if same subject exists (maybe from fallback) merge counts
            const mergedClasses = Math.max(existing.totalClasses, classes);
            const mergedAttended = Math.max(existing.attended, attended);
            result[subj] = { totalClasses: mergedClasses, attended: mergedAttended, percent: mergedClasses ? ((mergedAttended / mergedClasses) * 100).toFixed(1) : "0.0" };
          }
        }
      });
    } catch {
      // ignore parsing errors
    }
    return result;
  }, [attendanceTotals, selectedStudent, selectedStudentId]);

  // subjectsForStudent: collect subjects from marksForSelected AND from attendanceBySubject
  const subjectsForStudent = useMemo(() => {
    const usnKey = (selectedStudent?.usn || selectedStudentId || "").toString();
    if (!usnKey) return [];
    const set = new Set<string>();
    (marksForSelected || []).forEach((m) => {
      if (!m) return;
      if ((m.usn || "").toString() === usnKey && m.subject) set.add((m.subject || "").toString());
    });
    Object.keys(attendanceBySubject || {}).forEach((s) => {
      if (s) set.add(s);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [marksForSelected, attendanceBySubject, selectedStudent, selectedStudentId]);

  // build table rows combining attendance & marks per subject
  const tableRows = useMemo(() => {
    const usnKey = (selectedStudent?.usn || selectedStudentId || "").toString();
    if (!usnKey) return [];
    return subjectsForStudent
      .map((subj) => {
        const attendance = attendanceBySubject[subj] || { totalClasses: 0, attended: 0, percent: "0.0" };
        const tests = (marksForSelected || []).filter((m) => (m.subject || "") === subj).map((m) => ({ test: m.test, marks: m.marks, max: m.maxMarks }));
        return { subject: subj, attendance, tests };
      })
      .filter((r) => {
        const attNonZero = (r.attendance?.attended || 0) > 0 || (r.attendance?.totalClasses || 0) > 0;
        const hasTests = Array.isArray(r.tests) && r.tests.length > 0;
        return attNonZero || hasTests;
      });
  }, [subjectsForStudent, marksForSelected, attendanceBySubject, selectedStudent, selectedStudentId]);

  const consolidatedTests = useMemo(() => {
    const set = new Set<string>();
    (marksForSelected || []).forEach((m) => {
      if (m && m.test) set.add(String(m.test));
    });
    return Array.from(set).sort();
  }, [marksForSelected]);

  function getStudentField(field: "name" | "usn" | "email" | "semester" | "section") {
    const sel: any = selectedStudent || {};
    if (sel[field] || sel[field] === 0) return String(sel[field]);
    try {
      const m = (marksForSelected || []).find((mk) => mk && mk.usn && String(mk.usn) === String(selectedStudent?.usn || selectedStudentId));
      if (m) {
        if (field === "name") return String(m.studentName || m.name || "—");
        if (field === "email") return String(m.email || "—");
        if (field === "semester") return String(m.semester ?? "—");
        if (field === "section") return String(m.section ?? "—");
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LS_STUDENTS);
      if (raw) {
        const grouped = JSON.parse(raw) as Record<string, any[]>;
        for (const k of Object.keys(grouped || {})) {
          const arr = grouped[k] || [];
          for (const s of arr) {
            if (s && (s.usn === selectedStudent?.usn || s.id === selectedStudent?.id || s.usn === selectedStudentId || s.id === selectedStudentId)) {
              if (s[field]) return String(s[field]);
              if (field === "name" && (s.name || s.studentName)) return String(s.name || s.studentName);
            }
          }
        }
      }
    } catch {}
    return "—";
  }

  const escapeHtml = (str: any) => {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  // Download / print HTML
  const downloadPDF = () => {
    if (!selectedStudent && !selectedStudentId) return;

    const styles = `
      <style>
        body { font-family: Inter, Arial, Helvetica, sans-serif; color:#0f172a; margin:28px; }
        .org-main { font-weight:800; font-size:20px; margin-bottom:6px; }
        .org-sub { font-size:14px; color:#475569; }
        .dept-line { text-align:center; margin-top:10px; font-weight:600; color:#0f172a; }
        .student-block { margin: 18px 0; display:block; gap:8px; }
        .info-row { margin:6px 0; }
        .label { font-size:12px; color:#64748b; display:inline-block; width:160px; text-transform:lowercase; }
        .value { font-weight:600; font-size:14px; display:inline-block; color:#0f172a; }
        table { width:100%; border-collapse: collapse; margin-top:10px; font-size:13px; }
        th, td { border:1px solid #e6e9ee; padding:8px 10px; text-align:left; vertical-align:middle; }
        thead th { background:#f8fafc; font-weight:700; color:#0f172a; }
        .subject-col { font-weight:700; width:220px; }
        .footer { margin-top:18px; font-size:12px; color:#475569; }
        .footer-row { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .sig-line { width: 220px; border-top: 1px solid #000; text-align: center; padding-top: 6px; font-size: 12px; color: #475569; display: inline-block; }
      </style>
    `;

    const headerHtml = `
      <div style="text-align:center;">
        <div class="org-main">ATME College of Engineering</div>
        <div class="org-sub">Student Report — Attendance &amp; Marks</div>
        <div class="dept-line">Department of CSE</div>
        <hr style="margin-top:8px; border:0; border-top:2px solid #000; width:100%; margin-left:0; margin-right:0;" />
      </div>
    `;

    const studentMeta = `
      <div class="student-block">
        <div class="info-row"><span class="label">name :</span><span class="value">${escapeHtml(getStudentField("name"))}</span></div>
        <div class="info-row"><span class="label">usn :</span><span class="value">${escapeHtml(getStudentField("usn"))}</span></div>
        <div class="info-row"><span class="label">semester / section :</span><span class="value">${escapeHtml(String(getStudentField("semester")))} • ${escapeHtml(getStudentField("section"))}</span></div>
        <div class="info-row"><span class="label">email :</span><span class="value">${escapeHtml(getStudentField("email"))}</span></div>
      </div>
    `;

    const tableHeaderTests = consolidatedTests.map((t) => `<th>${escapeHtml(t)}</th>`).join("");
    const rowsHtml = tableRows
      .map((r) => {
        const testsHtml = consolidatedTests
          .map((t) => {
            const found = (r.tests || []).find((x) => x.test === t);
            return `<td>${found ? `${escapeHtml(String(found.marks ?? ""))}/${escapeHtml(String(found.max ?? ""))}` : ""}</td>`;
          })
          .join("");
        return `<tr>
            <td class="subject-col">${escapeHtml(r.subject)}</td>
            <td>${escapeHtml(String(r.attendance.attended || 0))}/${escapeHtml(String(r.attendance.totalClasses || 0))}</td>
            <td>${escapeHtml(String(r.attendance.percent || "0.0"))}%</td>
            ${testsHtml}
          </tr>`;
      })
      .join("");

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th class="subject-col">Subject</th>
            <th>Attended</th>
            <th>%</th>
            ${tableHeaderTests}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="${3 + consolidatedTests.length}" style="padding:12px;text-align:center;color:#64748b">No attendance or marks available</td></tr>`}
        </tbody>
      </table>
    `;

    const footerHtml = `
      <div style="margin-top:22px;">
        <div style="height:28px;"></div> <!-- spacer after table -->
        <div class="footer">
          <div class="footer-row">
            <div>Generated on: ${new Date().toLocaleString()}</div>
            <div style="display:flex; gap:40px; align-items:flex-end;">
              <div class="sig-line">Exam Coordinator</div>
              <div class="sig-line">Class Teacher</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const html = `<!doctype html><html><head><meta charset="utf-8"/>${styles}</head><body>${headerHtml}${studentMeta}${tableHtml}${footerHtml}</body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    try {
      w.print();
    } catch {}
  };

  const NAV_HEIGHT = 64;

  return (
    <div style={{ background: C.pageBg, minHeight: `calc(100vh - ${NAV_HEIGHT}px)`, paddingTop: 20, paddingBottom: 32, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "20px", boxSizing: "border-box" }}>
        <Card style={{ background: C.cardBg, boxShadow: "none", borderRadius: 10, width: "100%", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 10px 24px", borderBottom: `1px solid ${C.divider}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.heading }}>Student Report</div>
            <div style={{ fontSize: 13, color: C.subtext, marginTop: 6 }}>Generate printable reports — attendance & marks</div>
          </div>

          <div style={{ padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderBottom: `1px solid ${C.divider}`, justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 600px", maxWidth: "calc(100% - 160px)", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.inputBg, borderRadius: 10, border: `1px solid ${C.inputBorder}` }}>
                <Search color={C.icon} />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedStudentId("");
                  }}
                  placeholder="Search by USN or name — e.g., 1RV17C5001"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent", color: C.heading }}
                />
                {query ? (
                  <button
                    onClick={() => {
                      setQuery("");
                      setSuggestions([]);
                      setSelectedStudentId("");
                    }}
                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6 }}
                    aria-label="Clear search"
                  >
                    <X color={C.icon} />
                  </button>
                ) : null}
              </div>

              {suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: C.cardBg, border: `1px solid ${C.inputBorder}`, borderRadius: 8, zIndex: 60, maxHeight: 320, overflow: "auto", boxShadow: "0 6px 18px rgba(20,30,60,0.06)" }}>
                  {suggestions.map((s) => (
                    <div
                      key={(s.id || s.usn || Math.random()).toString()}
                      onClick={() => chooseSuggestion(s)}
                      style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.divider}` }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: C.heading }}>{s.usn}</div>
                        <div style={{ color: C.subtext, fontSize: 13 }}>{s.name}</div>
                      </div>
                      <div style={{ color: C.subtext, fontSize: 13 }}>{s.department || ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: "0 0 auto" }}>
              <Button
                onClick={downloadPDF}
                style={{
                  background: C.primary,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "none",
                  cursor: selectedStudent || selectedStudentId ? "pointer" : "not-allowed",
                  opacity: selectedStudent || selectedStudentId ? 1 : 0.6,
                  whiteSpace: "nowrap",
                }}
                disabled={!selectedStudent && !selectedStudentId}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = C.primaryHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = C.primary;
                }}
              >
                <Download size={16} />
                Download PDF
              </Button>
            </div>
          </div>

          <CardContent style={{ padding: 24, background: C.cardBg }}>
            {(!selectedStudent && !selectedStudentId) ? (
              <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <FileText size={64} color={C.icon} />
                <h2 style={{ margin: 0, color: C.heading, fontSize: 20, fontWeight: 700 }}>No Student Selected</h2>
                <p style={{ margin: 0, color: C.subtext }}>Search by USN or name to view subject-wise attendance and marks</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 18, padding: 14, borderRadius: 8, background: C.appBg, border: `1px solid ${C.divider}`, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 120, color: C.subtext, fontSize: 13 }}>Name</div>
                    <div style={{ fontWeight: 700, color: C.heading }}>{getStudentField("name")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 120, color: C.subtext, fontSize: 13 }}>USN</div>
                    <div style={{ fontWeight: 700, color: C.heading }}>{getStudentField("usn")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 120, color: C.subtext, fontSize: 13 }}>Semester</div>
                    <div style={{ fontWeight: 700, color: C.heading }}>{getStudentField("semester")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 120, color: C.subtext, fontSize: 13 }}>Section</div>
                    <div style={{ fontWeight: 700, color: C.heading }}>{getStudentField("section")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 120, color: C.subtext, fontSize: 13 }}>Email</div>
                    <div style={{ fontWeight: 700, color: C.heading }}>{getStudentField("email")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 120, color: C.subtext, fontSize: 13 }}>Department</div>
                    <div style={{ fontWeight: 700, color: C.heading }}>{(selectedStudent && selectedStudent.department) || "—"}</div>
                  </div>
                </div>

                <div style={{ overflowX: "auto", borderTop: `1px solid ${C.divider}`, paddingTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "10px 12px", color: C.heading }}>Subject</th>
                        <th style={{ textAlign: "left", padding: "10px 12px", color: C.heading }}>Attended</th>
                        <th style={{ textAlign: "left", padding: "10px 12px", color: C.heading }}>%</th>
                        {consolidatedTests.map((t) => (
                          <th key={t} style={{ textAlign: "left", padding: "10px 12px", color: C.heading }}>
                            {t}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.length === 0 ? (
                        <tr>
                          <td colSpan={3 + consolidatedTests.length} style={{ padding: 24, color: C.subtext, textAlign: "center" }}>
                            No attendance or marks available for this student.
                          </td>
                        </tr>
                      ) : (
                        tableRows.map((r) => (
                          <tr key={r.subject}>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: C.heading }}>{r.subject}</td>
                            <td style={{ padding: "10px 12px", color: C.heading }}>
                              {r.attendance.attended}/{r.attendance.totalClasses}
                            </td>
                            <td style={{ padding: "10px 12px", color: C.heading }}>{r.attendance.percent}%</td>
                            {consolidatedTests.map((t) => {
                              const found = (r.tests || []).find((x) => x.test === t);
                              return (
                                <td key={t} style={{ padding: "10px 12px", color: C.heading }}>
                                  {found ? `${found.marks ?? ""}/${found.max ?? ""}` : ""}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
