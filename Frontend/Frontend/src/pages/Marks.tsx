// src/pages/Marks.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Save, X, Trash2, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Student = {
  id?: string;
  name?: string;
  usn: string;
  department?: string;
  semester?: number | string;
  section?: string;
  subject?: string;
};

type MarkRow = {
  id?: number | string;
  usn: string;
  subject: string;
  test?: string;
  marks: number | string | null; // number when numeric, "absent" string when absent
  maxMarks: number;
  absent?: boolean;
};

const LS_STUDENTS = "app_students_v1";
const LS_FILTERS = "app_filters_v1";
const LS_DEPARTMENTS = "app_departments_v1";
const LS_SEMESTERS = "app_semesters_v1";
const LS_SECTIONS = "app_sections_v1";
const LS_SUBJECTS = "app_subjects_v1";
const LS_TESTS = "app_tests_v1";

const safeGet = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

function parseGroupedStudents(raw: string | null): Record<string, Student[]> {
  try {
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { "_": parsed };
    if (typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
}

export default function Marks(): JSX.Element {
  const [studentsByKey, setStudentsByKey] = useState<Record<string, Student[]>>(() =>
    parseGroupedStudents(localStorage.getItem(LS_STUDENTS))
  );

  const [filters, setFilters] = useState(() =>
    safeGet(LS_FILTERS, { dept: "", sem: "" as number | "", sec: "", sub: "" })
  );

  const activeKey = (f = filters) => {
    const d = f.dept || "_";
    const s = f.sem === "" ? "_" : String(f.sem);
    const sec = f.sec || "_";
    const sub = f.sub || "_";
    return `${d}::${s}::${sec}::${sub}`;
  };

  const currentStudents = useMemo(() => {
    const k = activeKey();
    const arr = studentsByKey && typeof studentsByKey === "object" ? studentsByKey[k] : undefined;
    return Array.isArray(arr) ? arr : [];
  }, [studentsByKey, filters]);

  const [departments, setDepartments] = useState<string[]>(() => safeGet(LS_DEPARTMENTS, []));
  const [semesters, setSemesters] = useState<number[]>(() => safeGet(LS_SEMESTERS, []));
  const [sections, setSections] = useState<string[]>(() => safeGet(LS_SECTIONS, []));
  const [subjects, setSubjects] = useState<string[]>(() => safeGet(LS_SUBJECTS, []));

  const [tests, setTests] = useState<string[]>(() => safeGet(LS_TESTS, ["IA1", "IA2", "Quiz", "Assignment"]));
  const [test, setTest] = useState<string>("");
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [serverMarks, setServerMarks] = useState<MarkRow[]>([]);
  const [marksByUsn, setMarksByUsn] = useState<Record<string, string>>({});
  const [refreshFlag, setRefreshFlag] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TESTS, JSON.stringify(tests));
    } catch {}
  }, [tests]);

  useEffect(() => {
    const storageHandler = (e: StorageEvent) => {
      try {
        if (e.key === LS_STUDENTS) setStudentsByKey(parseGroupedStudents(e.newValue));
        if (e.key === LS_FILTERS) setFilters(e.newValue ? JSON.parse(e.newValue) : { dept: "", sem: "", sec: "", sub: "" });
        if (e.key === LS_DEPARTMENTS) setDepartments(safeGet(LS_DEPARTMENTS, []));
        if (e.key === LS_SEMESTERS) setSemesters(safeGet(LS_SEMESTERS, []));
        if (e.key === LS_SECTIONS) setSections(safeGet(LS_SECTIONS, []));
        if (e.key === LS_SUBJECTS) setSubjects(safeGet(LS_SUBJECTS, []));
        if (e.key === LS_TESTS) {
          try { setTests(safeGet(LS_TESTS, [])); } catch {}
        }
      } catch {}
    };

    const customHandler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        if (!ce?.detail) return;
        const { type, payload } = ce.detail as { type?: string; payload?: any };
        if (type === "filters") setFilters(payload ?? { dept: "", sem: "", sec: "", sub: "" });
        if (type === "students") setStudentsByKey(parseGroupedStudents(JSON.stringify(payload ?? {})));
        if (type === "lists") {
          const p = payload || {};
          if (p.departments) setDepartments(p.departments);
          if (p.semesters) setSemesters(p.semesters);
          if (p.sections) setSections(p.sections);
          if (p.subjects) setSubjects(p.subjects);
        }
      } catch {}
    };

    try {
      setStudentsByKey(parseGroupedStudents(localStorage.getItem(LS_STUDENTS)));
      setDepartments(safeGet(LS_DEPARTMENTS, []));
      setSemesters(safeGet(LS_SEMESTERS, []));
      setSections(safeGet(LS_SECTIONS, []));
      setSubjects(safeGet(LS_SUBJECTS, []));
      setTests(safeGet(LS_TESTS, tests));
    } catch {}

    window.addEventListener("storage", storageHandler);
    window.addEventListener("app:shared", customHandler as EventListener);
    return () => {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("app:shared", customHandler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS, JSON.stringify(filters));
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent("app:shared", { detail: { type: "filters", payload: filters } }));
    } catch {}
  }, [filters]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_DEPARTMENTS, JSON.stringify(departments));
      localStorage.setItem(LS_SEMESTERS, JSON.stringify(semesters));
      localStorage.setItem(LS_SECTIONS, JSON.stringify(sections));
      localStorage.setItem(LS_SUBJECTS, JSON.stringify(subjects));
    } catch {}
    try {
      window.dispatchEvent(
        new CustomEvent("app:shared", {
          detail: {
            type: "lists",
            payload: { departments, semesters, sections, subjects },
          },
        })
      );
    } catch {}
  }, [departments, semesters, sections, subjects]);

  // ---- Load marks for selected subject ----
  useEffect(() => {
    const subj = filters.sub;
    if (!subj) {
      setServerMarks([]);
      setMarksByUsn({});
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/marks/by-subject/${encodeURIComponent(subj)}`);
        const data = Array.isArray(res.data) ? res.data : [];

        const normalized: MarkRow[] = data.map((r: any) => ({
          id: r.id ?? r.markId ?? undefined,
          usn: String(r.usn ?? r.USN ?? ""),
          subject: r.subject ?? subj,
          test: String(r.test ?? r.testName ?? ""),
          marks: r.marks === null || r.marks === undefined ? null : (r.marks === "absent" ? "absent" : Number(r.marks)),
          maxMarks: Number(((r.maxMarks ?? r.max_marks ?? r.max_marks_value ?? 0) as number) || 0),
          absent: r.marks === "absent" || !!r.absent,
        }));

        if (!mounted) return;
        setServerMarks(normalized);

        if (test) {
          const forTest = normalized.filter((m) => String(m.test) === String(test));
          const map: Record<string, string> = {};
          forTest.forEach((m) => {
            if (m.usn) {
              map[m.usn] = m.marks == null ? "" : (m.marks === "absent" ? "" : String(m.marks));
            }
          });
          setMarksByUsn(map);
          if (forTest.length > 0 && forTest[0].maxMarks) setMaxMarks(forTest[0].maxMarks);
        } else {
          setMarksByUsn({});
        }
      } catch (err: any) {
        toast({ title: "Load failed", description: err?.message || "Could not load marks", variant: "destructive" });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [filters.sub, refreshFlag, test]);

  useEffect(() => {
    if (!test) {
      setMarksByUsn({});
      return;
    }
    const forTest = serverMarks.filter((m) => String(m.test) === String(test));
    const map: Record<string, string> = {};
    forTest.forEach((m) => {
      if (m.usn) {
        map[m.usn] = m.marks == null ? "" : (m.marks === "absent" ? "" : String(m.marks));
      }
    });
    setMarksByUsn(map);
    if (forTest.length > 0 && forTest[0].maxMarks) setMaxMarks(forTest[0].maxMarks);
  }, [test, serverMarks]);

  // When user types into a marks cell we keep raw string in marksByUsn.
  // Empty string => considered ABSENT when saving.
  const onMarkChange = (usn: string, v: string) => {
    setMarksByUsn((p) => ({ ...p, [usn]: v }));
  };

  // Helper: normalize a single raw string into payload mark + absent flag
  const normalizeRawToPayload = (raw: any): { marks: number | "absent"; absent: boolean } => {
    if (raw === null || raw === undefined) return { marks: "absent", absent: true };
    const s = String(raw).trim();
    if (s === "") return { marks: "absent", absent: true }; // EMPTY -> ABSENT
    // Remove any non-number characters (allow decimal & minus)
    const cleaned = s.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    if (s.toLowerCase() === "absent") return { marks: "absent", absent: true };
    if (!isNaN(parsed)) return { marks: parsed, absent: false };
    // Fallback: if non-numeric text entered, treat as 0 (but not absent)
    return { marks: 0, absent: false };
  };

  // save marks (bulk)
  const saveMarksBulk = async () => {
    if (!filters.sub) {
      toast({ title: "Select subject", description: "Please select a subject before saving marks.", variant: "warning" });
      return;
    }
    if (!test) {
      toast({ title: "Select test", description: "Please select a test/assessment before saving marks.", variant: "warning" });
      return;
    }

    const payload: MarkRow[] = currentStudents.map((s) => {
      const raw = marksByUsn[s.usn];
      const norm = normalizeRawToPayload(raw);

      return {
        usn: s.usn,
        subject: filters.sub || "",
        test: test,
        marks: norm.marks === "absent" ? "absent" : Number(norm.marks),
        maxMarks: maxMarks || 0,
        absent: norm.absent,
      };
    });

    if (payload.length === 0) {
      toast({ title: "No students", description: "Nothing to save", variant: "warning" });
      return;
    }

    try {
      const res = await api.post("/marks/bulk", payload);
      const savedRows: any[] = Array.isArray(res?.data) && res.data.length > 0 ? res.data : payload;

      const normalized: MarkRow[] = savedRows.map((r: any) => ({
        id: r.id ?? r.markId ?? undefined,
        usn: String(r.usn ?? r.USN ?? r.usn),
        subject: r.subject ?? filters.sub,
        test: String(r.test ?? test),
        marks: r.marks === null || r.marks === undefined ? null : (r.marks === "absent" ? "absent" : Number(r.marks)),
        maxMarks: Number(((r.maxMarks ?? r.max_marks ?? maxMarks) as number) || 0),
        absent: r.marks === "absent" || !!r.absent,
      }));

      setServerMarks((prev) => {
        const filtered = prev.filter((r) => !(String(r.subject) === String(filters.sub) && String(r.test) === String(test)));
        return [...filtered, ...normalized];
      });

      const map: Record<string, string> = {};
      normalized.forEach((r) => {
        if (r.usn) {
          map[r.usn] = r.marks == null || r.marks === "absent" ? "" : String(r.marks);
        }
      });
      setMarksByUsn((prev) => ({ ...prev, ...map }));

      setRefreshFlag((f) => f + 1);
      toast({ title: "Saved", description: `Saved ${normalized.length} rows for ${filters.sub} — ${test}` });
    } catch (err: any) {
      console.error("Save failed:", err);
      toast({ title: "Save failed", description: err?.message || "Could not save marks", variant: "destructive" });
    }
  };

  const saveDisabled = !filters.sub || !test;

  const handleDeptChange = (v: string) => {
    setFilters((p: any) => ({ ...p, dept: v }));
  };
  const handleSemChange = (v: string) => setFilters((p: any) => ({ ...p, sem: v === "" ? "" : Number(v) }));
  const handleSectionChange = (v: string) => setFilters((p: any) => ({ ...p, sec: v }));
  const handleSubjectChange = (v: string) => setFilters((p: any) => ({ ...p, sub: v }));

  const [showAddTest, setShowAddTest] = useState(false);
  const [newTest, setNewTest] = useState("");
  const [showManageTests, setShowManageTests] = useState(false);
  const [manageNewTest, setManageNewTest] = useState("");

  const addTest = () => {
    const t = newTest.trim();
    if (!t) return;
    if (!tests.includes(t)) setTests((p) => [...p, t]);
    setTest(t);
    setNewTest("");
    setShowAddTest(false);
  };

  const addManagedTest = () => {
    const t = manageNewTest.trim();
    if (!t) return;
    if (tests.includes(t)) {
      toast({ title: "Exists", description: `${t} already exists` });
      return;
    }
    setTests((p) => [...p, t]);
    setManageNewTest("");
  };

  const deleteManagedTest = (t: string) => {
    if (!confirm(`Delete test "${t}"?`)) return;
    setTests((p) => p.filter((x) => x !== t));
    if (test === t) setTest("");
  };

  const FilterCard: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
    <div className="bg-[#FBFCFF] border border-[#E8EEFF] rounded-2xl p-3 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#3F51B5] font-semibold">{title}</div>
          {hint && <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  const SelectTriggerStyled: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
    <SelectTrigger
      {...(props as any)}
      className="flex items-center justify-between px-3 py-2 rounded-xl border-[#E3E8FF] h-11 w-full"
      style={{
        backgroundColor: "#ffffff",
        color: "#24324a",
        boxShadow: "0 2px 10px rgba(20,30,60,0.04)",
      }}
    >
      <SelectValue placeholder="Choose" />
      <ChevronDown className="ml-2" />
    </SelectTrigger>
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f6f9fc", color: "#24324a" }}>
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <Card className="shadow-sm" style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #edf2f7" }}>
          <CardHeader style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #edf2f7", padding: "18px 22px", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-2xl font-semibold" style={{ color: "#1f2a44", margin: 0 }}>
                Marks
              </CardTitle>

              <div className="flex items-center gap-3">
                <Button
                  className="flex items-center justify-center rounded-md px-4 py-2 shadow-sm"
                  onClick={saveMarksBulk}
                  disabled={saveDisabled}
                  style={{
                    backgroundColor: saveDisabled ? "#aab8ff" : "#3752ff",
                    borderColor: saveDisabled ? "#aab8ff" : "#3752ff",
                    color: "#ffffff",
                  }}
                >
                  <Save className="h-4 w-4 mr-2" /> Save Marks
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="mt-4" style={{ padding: 22 }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <FilterCard title="Department" hint="Select the department">
                <Select value={filters.dept} onValueChange={handleDeptChange}>
                  <SelectTriggerStyled>
                    <SelectValue placeholder="Select department" />
                  </SelectTriggerStyled>
                  <SelectContent className="mt-2" style={{ borderRadius: 10 }}>
                    <div className="p-2">
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FilterCard>

              <FilterCard title="Semester" hint="Choose semester">
                <Select value={filters.sem === "" ? "" : String(filters.sem)} onValueChange={handleSemChange}>
                  <SelectTriggerStyled>
                    <SelectValue placeholder="Select semester" />
                  </SelectTriggerStyled>
                  <SelectContent className="mt-2" style={{ borderRadius: 10 }}>
                    <div className="p-2">
                      {semesters.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FilterCard>

              <FilterCard title="Section" hint="Group / section">
                <Select value={filters.sec} onValueChange={handleSectionChange}>
                  <SelectTriggerStyled>
                    <SelectValue placeholder="Select section" />
                  </SelectTriggerStyled>
                  <SelectContent className="mt-2" style={{ borderRadius: 10 }}>
                    <div className="p-2">
                      {sections.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FilterCard>

              <FilterCard title="Subject" hint="Subject for marks">
                <Select value={filters.sub} onValueChange={handleSubjectChange}>
                  <SelectTriggerStyled>
                    <SelectValue placeholder="Select subject" />
                  </SelectTriggerStyled>
                  <SelectContent className="mt-2" style={{ borderRadius: 10 }}>
                    <div className="p-2">
                      {subjects.map((sb) => (
                        <SelectItem key={sb} value={sb}>{sb}</SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </FilterCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="font-medium" style={{ color: "#33415a" }}>Test / Assessment</Label>
                <div className="flex gap-3 items-center mt-2">
                  <Select value={test} onValueChange={(v) => setTest(v)}>
                    <SelectTriggerStyled>
                      <SelectValue placeholder="Select test" />
                    </SelectTriggerStyled>
                    <SelectContent style={{ borderRadius: 10 }}>
                      <div className="p-2">
                        {tests.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => setShowManageTests(true)}
                    className="rounded-md"
                    style={{ backgroundColor: "#3752ff", borderColor: "#3752ff", color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    Manage
                  </Button>
                </div>
              </div>

              <div>
                <Label className="font-medium" style={{ color: "#33415a" }}>Maximum Marks</Label>
                <Input
                  type="number"
                  value={String(maxMarks)}
                  onChange={(e) => setMaxMarks(Number(e.target.value || 0))}
                  className="mt-2"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", color: "#24324a" }}
                />
              </div>

              <div className="flex items-end" />
            </div>

            <div className="rounded-lg overflow-hidden shadow-sm" style={{ borderRadius: 10, border: "1px solid #edf2f7", backgroundColor: "#ffffff" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#fbfdff" }}>
                  <TableRow>
                    <TableHead className="font-semibold" style={{ color: "#24324a" }}>USN</TableHead>
                    <TableHead className="font-semibold" style={{ color: "#24324a" }}>Name</TableHead>
                    <TableHead className="font-semibold" style={{ color: "#24324a" }}>Marks</TableHead>
                    <TableHead className="text-right font-semibold" style={{ color: "#24324a" }}>Percent</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center p-6" style={{ color: "#6b7280" }}>
                        No students — select Department / Semester / Section / Subject.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentStudents.map((s) => {
                      const raw = marksByUsn.hasOwnProperty(s.usn) ? (marksByUsn[s.usn] ?? "") : "";
                      const norm = normalizeRawToPayload(raw);
                      const displayMarks = norm.marks === "absent" ? "-" : String(norm.marks);
                      const percent = norm.marks === "absent" || raw === "" ? "-" : `${((Number(norm.marks) / (maxMarks || 1)) * 100).toFixed(1)}%`;

                      return (
                        <TableRow key={s.usn} className="hover:bg-white" style={{ borderBottom: "1px solid #f1f5fb" }}>
                          <TableCell style={{ color: "#24324a", width: 140 }}>{s.usn}</TableCell>
                          <TableCell style={{ color: "#24324a" }}>{s.name}</TableCell>
                          <TableCell className="flex items-center gap-3">
                            <Input
                              value={raw}
                              onChange={(e) => onMarkChange(s.usn, e.target.value)}
                              type="text"
                              className="w-28"
                              placeholder={test ? "Enter marks (empty = absent)" : "Select test first"}
                              style={{ backgroundColor: "#ffffff", border: "1px solid #e6eef8", borderRadius: 8, padding: "8px 10px", color: "#24324a" }}
                            />
                          </TableCell>
                          <TableCell className="text-right" style={{ color: "#6b7280" }}>{percent}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddTest} onOpenChange={setShowAddTest}>
        <DialogContent style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10 }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#24324a" }}>Add Test</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4" style={{ padding: "0 20px 20px 20px" }}>
            <Label className="font-medium" style={{ color: "#33415a" }}>Test name</Label>
            <Input
              value={newTest}
              onChange={(e) => setNewTest(e.target.value)}
              placeholder="IA3, Quiz1..."
              style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", color: "#24324a" }}
            />
            <Button onClick={addTest} className="w-full" style={{ backgroundColor: "#3752ff", borderColor: "#3752ff", color: "#ffffff" }}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageTests} onOpenChange={setShowManageTests}>
        <DialogContent style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10 }}>
          <DialogHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <DialogTitle style={{ color: "#24324a" }}>Manage Tests</DialogTitle>
              <button onClick={() => setShowManageTests(false)} className="rounded-md p-1 hover:bg-slate-100" aria-label="Close">
                <X />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4" style={{ padding: "0 16px 16px 16px" }}>
            <div className="flex gap-2">
              <Input
                value={manageNewTest}
                onChange={(e) => setManageNewTest(e.target.value)}
                placeholder="New test name (e.g., IA3)"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", color: "#24324a" }}
              />
              <Button onClick={addManagedTest} style={{ backgroundColor: "#10b981", color: "#ffffff" }}>Add</Button>
            </div>

            <div className="max-h-56 overflow-auto space-y-2">
              {tests.length === 0 && <div className="text-sm text-slate-500 p-3">No tests configured</div>}
              {tests.map((t) => (
                <div key={t} className="flex items-center justify-between bg-white border rounded px-3 py-2 shadow-sm">
                  <div className="text-sm text-slate-800">{t}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => { setTest(t); toast({ title: "Selected", description: `${t} selected` }); }}
                      className="hover:bg-slate-100"
                    >
                      Select
                    </Button>
                    <Button variant="destructive" onClick={() => deleteManagedTest(t)} className="hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </main>
  );
}
