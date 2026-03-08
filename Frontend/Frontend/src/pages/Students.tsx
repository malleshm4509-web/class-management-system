// src/pages/Students.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Edit, Trash2, FileUp, MinusCircle, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type Student = {
  usn: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  semester?: number | string;
  section?: string;
  subject?: string;
  id?: string;
};

const LS_STUDENTS = "app_students_v1";
const LS_DEPARTMENTS = "app_departments_v1";
const LS_SEMESTERS = "app_semesters_v1";
const LS_SECTIONS = "app_sections_v1";
const LS_SUBJECTS = "app_subjects_v1";
const LS_TOMBSTONES = "app_deleted_usns_v1";

const LS_FILTERS = "app_filters_v1";
const LS_SELECTED_DEPT = "app_selected_department_v1";
const LS_SELECTED_SEM = "app_selected_semester_v1";
const LS_SELECTED_SECTION = "app_selected_section_v1";
const LS_SELECTED_SUBJECT = "app_selected_subject_v1";

const colors = {
  pageBg: "#F6FBFE",
  cardInnerBg: "#EAF6FB",
  cardOuterBg: "#F3FAFD",
  brandDark: "#173A52",
  addBlue: "#0b84ff",
  addBlueDark: "#0a6fe6",
  inputBorder: "#e7f3f8",
  danger: "#ea6a6e",
  modalShadow: "0 8px 28px rgba(11,132,255,0.08)",
};

// --- ManageModal (compact) ---
function ManageModal({
  open,
  onOpenChange,
  title,
  placeholder,
  items,
  onAdd,
  onDelete,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  placeholder: string;
  items: (string | number)[];
  onAdd: (val: string) => void;
  onDelete: (val: string | number) => void;
  onUpdate?: (oldVal: string | number, newVal: string) => void;
}) {
  const [value, setValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    setValue("");
    setEditingIndex(null);
    setEditingValue("");
  }, [open, title]);

  const addClicked = () => {
    const v = value.trim();
    if (!v) {
      toast({ title: "Enter value", description: "Type value then click Add" });
      return;
    }
    onAdd(v);
    setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
      <DialogContent className="max-w-md p-0" style={{ background: "transparent", boxShadow: "none", border: "none" }}>
        <div style={{ width: 480, maxWidth: "94vw", borderRadius: 12, padding: 18, background: "white", boxShadow: colors.modalShadow, margin: "10vh auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
            <button onClick={() => onOpenChange(false)} style={{ padding: 6, borderRadius: 6 }} aria-label="Close"><X /></button>
          </div>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${colors.inputBorder}`, padding: "0 10px" }} />
              <Button onClick={addClicked} className="px-3 py-1">Add</Button>
            </div>
            <div style={{ maxHeight: 280, overflow: "auto" }}>
              {items.map((it, idx) => (
                <div key={String(it)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px", borderBottom: "1px solid #f3f5f7" }}>
                  <div>{String(it)}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onDelete(it)} style={{ padding: "6px 8px", borderRadius: 6, border: "none", background: colors.danger, color: "white" }}>Delete</button>
                    {onUpdate && <button onClick={() => { const newVal = prompt("New value", String(it)); if (newVal) onUpdate(it, newVal); }} style={{ padding: "6px 8px", borderRadius: 6 }}>Edit</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- SmallModal used for add/edit ---
function SmallModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0" style={{ background: "transparent", boxShadow: "none", border: "none" }}>
        <div style={{ width: 480, maxWidth: "94vw", borderRadius: 12, padding: 18, background: "white", boxShadow: colors.modalShadow, margin: "10vh auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
            <button onClick={onClose} style={{ padding: 6, borderRadius: 6 }} aria-label="Close"><X /></button>
          </div>
          <div>{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Students page ---
const Students = () => {
  const [studentsByKey, setStudentsByKey] = useState<Record<string, Student[]>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_STUDENTS) || "{}"); } catch { return {}; }
  });

  // tombstones per group key: { "<dept>::<sem>::<sec>::<sub>": ["USN1","USN2"] }
  const [deletedUsnsMap, setDeletedUsnsMap] = useState<Record<string, Set<string>>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_TOMBSTONES) || "{}");
      const out: Record<string, Set<string>> = {};
      for (const [k, arr] of Object.entries(raw)) {
        if (Array.isArray(arr)) out[k] = new Set(arr as string[]);
      }
      return out;
    } catch {
      return {};
    }
  });

  const [departmentsList, setDepartmentsList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_DEPARTMENTS) || "[]"); } catch { return []; }
  });
  const [semestersList, setSemestersList] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_SEMESTERS) || "[]"); } catch { return []; }
  });
  const [sectionsList, setSectionsList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_SECTIONS) || "[]"); } catch { return []; }
  });
  const [subjectsList, setSubjectsList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_SUBJECTS) || "[]"); } catch { return []; }
  });

  // Try to hydrate initial selected values from the centralized LS_FILTERS first (keeps sync with Marks)
  const initialFilters = (() => {
    try {
      const raw = localStorage.getItem(LS_FILTERS);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          dept: p.dept ?? "",
          sem: p.sem ?? "",
          sec: p.sec ?? "",
          sub: p.sub ?? "",
        };
      }
    } catch {}
    return null;
  })();

  // load selected values (prioritize centralized filters; fallback to per-key legacy keys or first of lists)
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    try {
      if (initialFilters?.dept) return initialFilters.dept;
      return localStorage.getItem(LS_SELECTED_DEPT) ?? (departmentsList[0] ?? "");
    } catch { return departmentsList[0] ?? ""; }
  });
  const [selectedSem, setSelectedSem] = useState<number | "">(() => {
    try {
      if (initialFilters?.sem !== undefined && initialFilters?.sem !== "") return Number(initialFilters.sem);
      const v = localStorage.getItem(LS_SELECTED_SEM);
      return v === null || v === "" ? (semestersList[0] ?? "") : Number(v);
    } catch { return semestersList[0] ?? ""; }
  });
  const [selectedSection, setSelectedSection] = useState<string>(() => {
    try {
      if (initialFilters?.sec) return initialFilters.sec;
      return localStorage.getItem(LS_SELECTED_SECTION) ?? (sectionsList[0] ?? "");
    } catch { return sectionsList[0] ?? ""; }
  });
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    try {
      if (initialFilters?.sub) return initialFilters.sub;
      return localStorage.getItem(LS_SELECTED_SUBJECT) ?? (subjectsList[0] ?? "");
    } catch { return subjectsList[0] ?? ""; }
  });

  useEffect(() => { if (departmentsList.length === 0) setSelectedDept(""); else if (!departmentsList.includes(selectedDept)) setSelectedDept(departmentsList[0] ?? ""); }, [departmentsList.join("|")]);
  useEffect(() => { if (semestersList.length === 0) setSelectedSem(""); else if (!semestersList.map(String).includes(String(selectedSem))) setSelectedSem(semestersList[0] ?? ""); }, [semestersList.join("|")]);
  useEffect(() => { if (sectionsList.length === 0) setSelectedSection(""); else if (!sectionsList.includes(selectedSection)) setSelectedSection(sectionsList[0] ?? ""); }, [sectionsList.join("|")]);
  useEffect(() => { if (subjectsList.length === 0) setSelectedSubject(""); else if (!subjectsList.includes(selectedSubject)) setSelectedSubject(subjectsList[0] ?? ""); }, [subjectsList.join("|")]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUsn, setEditingUsn] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", usn: "", email: "", phone: "" });
  const [editFormData, setEditFormData] = useState<any>({});
  const [openManage, setOpenManage] = useState<null | "departments" | "semesters" | "sections" | "subjects">(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeKey = () => {
    const d = selectedDept || "_";
    const s = selectedSem === "" ? "_" : String(selectedSem);
    const sec = selectedSection || "_";
    const sub = selectedSubject || "_";
    return `${d}::${s}::${sec}::${sub}`;
  };

  // persist students and tombstones and notify other parts (keep existing events)
  useEffect(() => {
    try { localStorage.setItem(LS_STUDENTS, JSON.stringify(studentsByKey)); } catch {}
    try {
      const serializable: Record<string, string[]> = {};
      for (const [k, s] of Object.entries(deletedUsnsMap)) {
        serializable[k] = Array.from(s);
      }
      localStorage.setItem(LS_TOMBSTONES, JSON.stringify(serializable));
    } catch {}
    try { window.dispatchEvent(new CustomEvent("students:updated", { detail: { ts: Date.now() } })); } catch {}
  }, [studentsByKey, deletedUsnsMap]);

  // persist managed lists and broadcast both legacy 'managed:updated' AND centralized 'app:shared' lists
  useEffect(() => {
    try { localStorage.setItem(LS_DEPARTMENTS, JSON.stringify(departmentsList)); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "departments" } })); } catch {}
    try { window.dispatchEvent(new CustomEvent("app:shared", { detail: { type: "lists", payload: { departments: departmentsList } } })); } catch {}
  }, [departmentsList]);

  useEffect(() => {
    try { localStorage.setItem(LS_SEMESTERS, JSON.stringify(semestersList)); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "semesters" } })); } catch {}
    try { window.dispatchEvent(new CustomEvent("app:shared", { detail: { type: "lists", payload: { semesters: semestersList } } })); } catch {}
  }, [semestersList]);

  useEffect(() => {
    try { localStorage.setItem(LS_SECTIONS, JSON.stringify(sectionsList)); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "sections" } })); } catch {}
    try { window.dispatchEvent(new CustomEvent("app:shared", { detail: { type: "lists", payload: { sections: sectionsList } } })); } catch {}
  }, [sectionsList]);

  useEffect(() => {
    try { localStorage.setItem(LS_SUBJECTS, JSON.stringify(subjectsList)); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "subjects" } })); } catch {}
    try { window.dispatchEvent(new CustomEvent("app:shared", { detail: { type: "lists", payload: { subjects: subjectsList } } })); } catch {}
  }, [subjectsList]);

  useEffect(() => {
    try { localStorage.setItem(LS_SELECTED_DEPT, selectedDept ?? ""); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "selected", which: "department" } })); } catch {}
  }, [selectedDept]);

  useEffect(() => {
    try { localStorage.setItem(LS_SELECTED_SEM, selectedSem === "" ? "" : String(selectedSem)); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "selected", which: "semester" } })); } catch {}
  }, [selectedSem]);

  useEffect(() => {
    try { localStorage.setItem(LS_SELECTED_SECTION, selectedSection ?? ""); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "selected", which: "section" } })); } catch {}
  }, [selectedSection]);

  useEffect(() => {
    try { localStorage.setItem(LS_SELECTED_SUBJECT, selectedSubject ?? ""); } catch {}
    try { window.dispatchEvent(new CustomEvent("managed:updated", { detail: { kind: "selected", which: "subject" } })); } catch {}
  }, [selectedSubject]);

  // **NEW**: create centralized filters object and persist + broadcast via app:shared so Marks (and others) stay in sync
  useEffect(() => {
    const filters = { dept: selectedDept ?? "", sem: selectedSem ?? "", sec: selectedSection ?? "", sub: selectedSubject ?? "" };
    try { localStorage.setItem(LS_FILTERS, JSON.stringify(filters)); } catch {}
    try { window.dispatchEvent(new CustomEvent("app:shared", { detail: { type: "filters", payload: filters } })); } catch {}
  }, [selectedDept, selectedSem, selectedSection, selectedSubject]);

  // ensure a freshly-selected group that has never been used shows empty (don't leak other group's data)
  useEffect(() => {
    const k = activeKey();
    setStudentsByKey(prev => {
      // if group already exists keep as-is; else create an empty array for that key
      if (Object.prototype.hasOwnProperty.call(prev, k)) return prev;
      return { ...prev, [k]: [] };
    });
  }, [selectedDept, selectedSem, selectedSection, selectedSubject]);

  // Listen for storage events (other tabs/windows) and managed:updated events (legacy same-window),
  // and also listen for app:shared to integrate with Marks' sync approach.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      try {
        if (!e.key) return;
        if (e.key === LS_DEPARTMENTS) setDepartmentsList(JSON.parse(e.newValue || "[]"));
        if (e.key === LS_SEMESTERS) setSemestersList(JSON.parse(e.newValue || "[]"));
        if (e.key === LS_SECTIONS) setSectionsList(JSON.parse(e.newValue || "[]"));
        if (e.key === LS_SUBJECTS) setSubjectsList(JSON.parse(e.newValue || "[]"));

        // react to LS_STUDENTS changes from other tabs
        if (e.key === LS_STUDENTS) {
          try { setStudentsByKey(JSON.parse(e.newValue || "{}")); } catch {}
        }

        // tombstones updated in other tabs
        if (e.key === LS_TOMBSTONES) {
          try {
            const raw = e.newValue ? JSON.parse(e.newValue) : {};
            const out: Record<string, Set<string>> = {};
            for (const [k, arr] of Object.entries(raw)) {
              if (Array.isArray(arr)) out[k] = new Set(arr as string[]);
            }
            setDeletedUsnsMap(out);
          } catch {}
        }

        // legacy per-key selection
        if (e.key === LS_SELECTED_DEPT) setSelectedDept(e.newValue ?? "");
        if (e.key === LS_SELECTED_SEM) setSelectedSem(e.newValue === "" || e.newValue === null ? "" : Number(e.newValue));
        if (e.key === LS_SELECTED_SECTION) setSelectedSection(e.newValue ?? "");
        if (e.key === LS_SELECTED_SUBJECT) setSelectedSubject(e.newValue ?? "");

        // centralized filters (from Marks or other modules)
        if (e.key === LS_FILTERS) {
          const obj = e.newValue ? JSON.parse(e.newValue) : { dept: "", sem: "", sec: "", sub: "" };
          setSelectedDept(obj.dept ?? "");
          setSelectedSem(obj.sem === "" || obj.sem == null ? "" : Number(obj.sem));
          setSelectedSection(obj.sec ?? "");
          setSelectedSubject(obj.sub ?? "");
        }
      } catch (err) {
        console.warn("storage handler error:", err);
      }
    };

    const onManaged = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        const d = ce.detail ?? {};
        const kind = d.kind;
        if (kind === "departments") setDepartmentsList(JSON.parse(localStorage.getItem(LS_DEPARTMENTS) || "[]"));
        if (kind === "semesters") setSemestersList(JSON.parse(localStorage.getItem(LS_SEMESTERS) || "[]"));
        if (kind === "sections") setSectionsList(JSON.parse(localStorage.getItem(LS_SECTIONS) || "[]"));
        if (kind === "subjects") setSubjectsList(JSON.parse(localStorage.getItem(LS_SUBJECTS) || "[]"));
        if (kind === "selected") {
          const which = d.which;
          if (which === "department") setSelectedDept(localStorage.getItem(LS_SELECTED_DEPT) ?? "");
          if (which === "semester") {
            const v = localStorage.getItem(LS_SELECTED_SEM);
            setSelectedSem(v === "" || v === null ? "" : Number(v));
          }
          if (which === "section") setSelectedSection(localStorage.getItem(LS_SELECTED_SECTION) ?? "");
          if (which === "subject") setSelectedSubject(localStorage.getItem(LS_SELECTED_SUBJECT) ?? "");
        }
      } catch (err) {
        console.warn("managed event handler error:", err);
      }
    };

    // New: listen for centralized app:shared so Marks <> Students sync works same as Marks module expects
    const onAppShared = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        const d = ce.detail ?? {};
        const type = d.type;
        const payload = d.payload ?? {};
        if (type === "filters") {
          setSelectedDept(payload.dept ?? "");
          setSelectedSem(payload.sem === "" || payload.sem == null ? "" : Number(payload.sem));
          setSelectedSection(payload.sec ?? "");
          setSelectedSubject(payload.sub ?? "");
        } else if (type === "lists") {
          // update lists if present
          if (Array.isArray(payload.departments)) setDepartmentsList(payload.departments);
          if (Array.isArray(payload.semesters)) setSemestersList(payload.semesters);
          if (Array.isArray(payload.sections)) setSectionsList(payload.sections);
          if (Array.isArray(payload.subjects)) setSubjectsList(payload.subjects);
        } else if (type === "students") {
          // Merge incoming groups into local store instead of outright replacing.
          try {
            const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
            if (parsed && typeof parsed === "object") {
              setStudentsByKey(prev => {
                const next = { ...prev };
                // parsed expected to be Record<string, Student[]>
                for (const [k, v] of Object.entries(parsed as Record<string, Student[]>)) {
                  try {
                    const incomingArr = Array.isArray(v) ? v : [];
                    const existing = prev[k] ?? [];
                    // build map: start with existing, then overwrite with incoming (server wins)
                    const map = new Map<string, Student>(existing.map(s => [s.usn, s]));
                    for (const s of incomingArr) map.set(s.usn, { ...s, id: s.usn });
                    next[k] = Array.from(map.values());
                  } catch {
                    // ignore invalid group
                    next[k] = prev[k] ?? [];
                  }
                }
                return next;
              });
            }
          } catch (err) {
            // ignore bad payload
          }
        }
      } catch (err) {
        console.warn("app:shared handler error:", err);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("managed:updated", onManaged as EventListener);
    window.addEventListener("app:shared", onAppShared as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("managed:updated", onManaged as EventListener);
      window.removeEventListener("app:shared", onAppShared as EventListener);
    };
  }, []);

  const removeGroupsReferencing = (kind: "dept"|"sem"|"sec"|"sub", value: string | number) => {
    try {
      setStudentsByKey(prev => {
        const next: Record<string, Student[]> = {};
        for (const [k, arr] of Object.entries(prev)) {
          const [d, s, sec, sub] = k.split("::").map(x => x === "_" ? "" : x);
          let remove = false;
          if (kind === "dept" && String(d) === String(value)) remove = true;
          if (kind === "sem" && String(s) === String(value)) remove = true;
          if (kind === "sec" && String(sec) === String(value)) remove = true;
          if (kind === "sub" && String(sub) === String(value)) remove = true;
          if (!remove) next[k] = arr;
        }
        return next;
      });
    } catch (e) { console.warn("failed to remove groups referencing deleted option", e); }
  };

  // managed list add/delete/update handlers - unchanged behavior but they will cause both legacy and centralized broadcasts
  const addDepartment = (val: string) => {
    if (!val) return;
    setDepartmentsList(prev => prev.includes(val) ? (toast({ title: "Exists", description: `${val} already exists` }), prev) : [...prev, val]);
    setOpenManage(null);
  };
  const deleteDepartment = (val: string | number) => {
    if (!confirm(`Delete department "${val}"? This will remove any student groups tied to it locally.`)) return;
    setDepartmentsList(prev => prev.filter(p => String(p) !== String(val)));
    removeGroupsReferencing("dept", val);
    setOpenManage(null);
  };
  const updateDepartment = (oldVal: string | number, newVal: string) => {
    if (!newVal) return;
    setDepartmentsList(prev => prev.map(p => String(p) === String(oldVal) ? newVal : p));
    setStudentsByKey(prev => {
      const next: Record<string, Student[]> = {};
      for (const [k, arr] of Object.entries(prev)) {
        const parts = k.split("::");
        if (parts[0] === String(oldVal)) { parts[0] = String(newVal); next[parts.join("::")] = arr.map(a => ({ ...a, department: String(newVal) })); }
        else next[k] = arr;
      }
      return next;
    });
    setOpenManage(null);
  };

  const addSemester = (val: string) => {
    if (!val) return;
    const n = Number(val);
    if (Number.isNaN(n)) return toast({ title: "Invalid", description: "Semester must be numeric" });
    setSemestersList(prev => prev.includes(n) ? (toast({ title: "Exists", description: `${n} already exists` }), prev) : [...prev, n].sort((a,b)=>Number(a)-Number(b)));
    setOpenManage(null);
  };
  const deleteSemester = (val: string | number) => {
    if (!confirm(`Delete semester "${val}"? This will remove any student groups tied to it locally.`)) return;
    setSemestersList(prev => prev.filter(p => String(p) !== String(val)));
    removeGroupsReferencing("sem", val);
    setOpenManage(null);
  };
  const updateSemester = (oldVal: string | number, newVal: string) => {
    if (!newVal) return;
    const n = Number(newVal);
    if (Number.isNaN(n)) return;
    setSemestersList(prev => prev.map(p => String(p) === String(oldVal) ? n : p).sort((a,b)=>Number(a)-Number(b)));
    setStudentsByKey(prev => {
      const next: Record<string, Student[]> = {};
      for (const [k, arr] of Object.entries(prev)) {
        const parts = k.split("::");
        if (parts[1] === String(oldVal)) { parts[1] = String(n); next[parts.join("::")] = arr.map(a => ({ ...a, semester: n })); }
        else next[k] = arr;
      }
      return next;
    });
    setOpenManage(null);
  };

  const addSection = (val: string) => {
    if (!val) return;
    setSectionsList(prev => prev.includes(val) ? (toast({ title: "Exists", description: `${val} already exists` }), prev) : [...prev, val]);
    setOpenManage(null);
  };
  const deleteSection = (val: string | number) => {
    if (!confirm(`Delete section "${val}"? This will remove any student groups tied to it locally.`)) return;
    setSectionsList(prev => prev.filter(p => String(p) !== String(val)));
    removeGroupsReferencing("sec", val);
    setOpenManage(null);
  };
  const updateSection = (oldVal: string | number, newVal: string) => {
    if (!newVal) return;
    setSectionsList(prev => prev.map(p => String(p) === String(oldVal) ? String(newVal) : p));
    setStudentsByKey(prev => {
      const next: Record<string, Student[]> = {};
      for (const [k, arr] of Object.entries(prev)) {
        const parts = k.split("::");
        if (parts[2] === String(oldVal)) { parts[2] = String(newVal); next[parts.join("::")] = arr.map(a => ({ ...a, section: String(newVal) })); }
        else next[k] = arr;
      }
      return next;
    });
    setOpenManage(null);
  };

  const addSubject = (val: string) => {
    if (!val) return;
    setSubjectsList(prev => prev.includes(val) ? (toast({ title: "Exists", description: `${val} already exists` }), prev) : [...prev, val]);
    setOpenManage(null);
  };
  const deleteSubject = (val: string | number) => {
    if (!confirm(`Delete subject "${val}"? This will remove any student groups tied to it locally.`)) return;
    setSubjectsList(prev => prev.filter(p => String(p) !== String(val)));
    removeGroupsReferencing("sub", val);
    setOpenManage(null);
  };
  const updateSubject = (oldVal: string | number, newVal: string) => {
    if (!newVal) return;
    setSubjectsList(prev => prev.map(p => String(p) === String(oldVal) ? newVal : p));
    setStudentsByKey(prev => {
      const next: Record<string, Student[]> = {};
      for (const [k, arr] of Object.entries(prev)) {
        const parts = k.split("::");
        if (parts[3] === String(oldVal)) { parts[3] = String(newVal); next[parts.join("::")] = arr.map(a => ({ ...a, subject: String(newVal) })); }
        else next[k] = arr;
      }
      return next;
    });
    setOpenManage(null);
  };

  // Add student
  const handleAddStudent = async () => {
    if (!formData.name.trim() || !formData.usn.trim()) { toast({ title: "Missing", description: "Name and USN required" }); return; }
    const payload: Partial<Student> = {
      name: formData.name.trim(),
      usn: formData.usn.trim(),
      email: formData.email?.trim(),
      phone: formData.phone?.trim(),
      department: selectedDept,
      semester: selectedSem,
      section: selectedSection,
      subject: selectedSubject
    };

    const s: Student = { ...payload, id: payload.usn } as Student;
    const k = activeKey();

    // optimistic local save
    setStudentsByKey(prev => {
      const group = prev[k] ?? [];
      if (group.some(x => x.usn === s.usn)) {
        toast({ title: "Duplicate", description: `${s.usn} already exists in this group` });
        return prev;
      }
      const next = { ...prev, [k]: [...group, s] };
      return next;
    });

    // remove from tombstones if previously deleted (only in this group)
    setDeletedUsnsMap(prev => {
      const next: Record<string, Set<string>> = {};
      for (const [key, setVal] of Object.entries(prev)) next[key] = new Set(Array.from(setVal));
      if (!next[k]) next[k] = new Set();
      if (next[k].has(s.usn)) next[k].delete(s.usn);
      return next;
    });

    setIsAddOpen(false);
    setFormData({ name:"", usn:"", email:"", phone:"" });

    try {
      const res = await api.post("/students", payload);
      const saved: Student = res.data;
      setStudentsByKey(prev => {
        const group = prev[k] ?? [];
        const next = group.map(g => g.usn === saved.usn ? { ...saved, id: saved.usn } : g);
        if (!next.some(x => x.usn === saved.usn)) next.push({ ...saved, id: saved.usn });
        return { ...prev, [k]: next };
      });
      toast({ title: "Saved", description: `${saved.name} saved to DB.` });
    } catch (err) {
      console.warn("save failed:", err);
      toast({ title: "Save failed", description: "Student kept locally; server save failed.", variant: "destructive" });
    }
  };

  const openEdit = (s: Student) => {
    setEditingUsn(s.usn);
    setEditFormData({ ...s });
    setIsEditOpen(true);
  };
  const handleEditStudent = async () => {
    if (!editingUsn) return;
    const updated = currentStudents.map(st => st.usn === editingUsn ? { ...st, ...editFormData } : st);
    writeCurrentStudents(updated);
    setIsEditOpen(false);
    setEditingUsn(null);
    try {
      await api.put(`/students/${encodeURIComponent(editFormData.usn)}`, editFormData);
      toast({ title: "Updated", description: "Student updated on server." });
    } catch (err) {
      console.warn("update failed:", err);
      toast({ title: "Update saved locally", description: "Server update failed.", variant: "destructive" });
    }
  };

  // Single delete (server-first, fallback) - updated to tombstone per-group
  const handleDeleteStudent = async (usn: string) => {
    if (!confirm(`Delete student ${usn}?`)) return;

    const k = activeKey();

    try {
      await api.delete(`/students/${encodeURIComponent(usn)}`, { data: { department: selectedDept || null, semester: selectedSem || null, section: selectedSection || null, subject: selectedSubject || null } });
      setDeletedUsnsMap(prev => {
        const next: Record<string, Set<string>> = {};
        for (const [key, setVal] of Object.entries(prev)) next[key] = new Set(Array.from(setVal));
        if (!next[k]) next[k] = new Set();
        next[k].add(usn);
        return next;
      });
      writeCurrentStudents(currentStudents.filter(s => s.usn !== usn));
      toast({ title: "Deleted", description: `${usn} deleted on server.` });
      return;
    } catch (err) {
      try {
        await api.post("/students/delete", { usn, department: selectedDept || null, semester: selectedSem || null, section: selectedSection || null, subject: selectedSubject || null });
        setDeletedUsnsMap(prev => {
          const next: Record<string, Set<string>> = {};
          for (const [key, setVal] of Object.entries(prev)) next[key] = new Set(Array.from(setVal));
          if (!next[k]) next[k] = new Set();
          next[k].add(usn);
          return next;
        });
        writeCurrentStudents(currentStudents.filter(s => s.usn !== usn));
        toast({ title: "Deleted", description: `${usn} deleted on server (fallback).` });
        return;
      } catch (err2) {
        console.warn("delete failed (both attempts):", err2);
        if (confirm("Could not delete on server. Mark as deleted locally anyway? (This will not remove server copy)")) {
          setDeletedUsnsMap(prev => {
            const next: Record<string, Set<string>> = {};
            for (const [key, setVal] of Object.entries(prev)) next[key] = new Set(Array.from(setVal));
            if (!next[k]) next[k] = new Set();
            next[k].add(usn);
            return next;
          });
          writeCurrentStudents(currentStudents.filter(s => s.usn !== usn));
          toast({ title: "Deleted locally", description: `${usn} marked deleted locally.`, variant: "destructive" });
        } else {
          toast({ title: "Delete cancelled", description: "Student not deleted." });
        }
      }
    }
  };

  // =======  UPDATED: handleDeleteAll (robust, strictly-scoped)  =======
  const handleDeleteAll = async () => {
    // Require full selection — prevents accidental global deletes
    if (!selectedDept || selectedSem === "" || !selectedSection || !selectedSubject) {
      toast({
        title: "Select full group",
        description: "Please select Department, Semester, Section and Subject before deleting the group.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Delete all students in ${selectedDept} / ${selectedSem} / ${selectedSection} / ${selectedSubject}? This will attempt to delete them on the server.`)) return;

    const k = activeKey();
    const usns = currentStudents.map(s => s.usn);
    if (usns.length === 0) { toast({ title: "Nothing to delete", description: "No students in this group." }); return; }

    // Explicit scoped payload
    const scopePayload = {
      department: selectedDept,
      semester: selectedSem,
      section: selectedSection,
      subject: selectedSubject,
      scoped: true
    };

    // helper to mark local tombstones for given usns (only active group)
    const markLocalDeleted = (usnList: string[]) => {
      setDeletedUsnsMap(prev => {
        const next: Record<string, Set<string>> = {};
        for (const [key, setVal] of Object.entries(prev)) next[key] = new Set(Array.from(setVal));
        if (!next[k]) next[k] = new Set();
        usnList.forEach(u => next[k].add(u));
        return next;
      });
      writeCurrentStudents(currentStudents.filter(s => !usnList.includes(s.usn)));
    };

    try {
      // Attempt 1: POST /students/delete-group (body)
      const r1 = await api.post("/students/delete-group", scopePayload);
      const deletedCount1 = Number(r1?.data?.deletedCount ?? r1?.data?.count ?? r1?.data?.deleted ?? 0);
      if (deletedCount1 > 0 || (r1.status >= 200 && r1.status < 300 && deletedCount1 === 0 && r1.data && (r1.data.success || r1.data.ok))) {
        markLocalDeleted(usns);
        toast({ title: "Deleted", description: `Group deleted on server.` });
        return;
      }

      // Attempt 2: POST /students/delete-group with params
      try {
        const r2 = await api.post("/students/delete-group", null, { params: { ...scopePayload } });
        const deletedCount2 = Number(r2?.data?.deletedCount ?? r2?.data?.count ?? r2?.data?.deleted ?? 0);
        if (deletedCount2 > 0 || (r2.status >= 200 && r2.status < 300 && (r2.data?.success || r2.data?.ok))) {
          markLocalDeleted(usns);
          toast({ title: "Deleted", description: `Group deleted on server (params).` });
          return;
        }
      } catch (err) {
        console.warn("Attempt 2 failed (params):", err);
      }

      // Attempt 3: Batch delete via POST /students/delete (body { usns: [...], ...scope })
      try {
        const r3 = await api.post("/students/delete", { usns, ...scopePayload });
        const deletedCount3 = Number(r3?.data?.deletedCount ?? r3?.data?.count ?? r3?.data?.deleted ?? 0);
        if (deletedCount3 > 0 || (r3.status >= 200 && r3.status < 300 && (r3.data?.success || r3.data?.ok))) {
          const deletedList = Array.isArray(r3.data?.deletedUsns) ? r3.data.deletedUsns : (deletedCount3 > 0 ? usns : usns);
          markLocalDeleted(deletedList);
          toast({ title: "Deleted", description: `Group deleted on server (batch).` });
          return;
        }
      } catch (err) {
        console.warn("Attempt 3 failed (batch):", err);
      }

      // Attempt 4: DELETE /students with query params (some servers use this shape)
      try {
        const r4 = await api.delete("/students", { params: { ...scopePayload } });
        const deletedCount4 = Number(r4?.data?.deletedCount ?? r4?.data?.count ?? r4?.data?.deleted ?? 0);
        if (deletedCount4 > 0 || (r4.status >= 200 && r4.status < 300 && (r4.data?.success || r4.data?.ok))) {
          markLocalDeleted(usns);
          toast({ title: "Deleted", description: `Group deleted on server (DELETE with params).` });
          return;
        }
      } catch (inner) {
        console.warn("Attempt 4 failed (DELETE with params):", inner);
      }

      // Attempt 5 (fallback): per-USN POST /students/delete with scoped body
      const perUsnResults = await Promise.allSettled(usns.map(u => api.post("/students/delete", { usn: u, ...scopePayload })));
      const succeeded = perUsnResults.reduce<string[]>((acc, r, i) => { if (r.status === "fulfilled" && r.value && r.value.status >= 200 && r.value.status < 300) acc.push(usns[i]); return acc; }, []);
      const failed = perUsnResults.reduce<string[]>((acc, r, i) => { if (r.status === "rejected" || !(r as any).value || (r as any).value.status >= 400) acc.push(usns[i]); return acc; }, []);

      if (succeeded.length > 0) markLocalDeleted(succeeded);

      if (failed.length === 0) {
        toast({ title: "Deleted", description: `Group deleted on server (per-USN).` });
        return;
      }

      const msg = `${failed.length} of ${usns.length} failed to delete on server. Mark the failed ones as deleted locally?`;
      if (confirm(msg)) {
        markLocalDeleted(failed);
        toast({ title: "Marked deleted locally", description: "Failed rows marked deleted locally.", variant: "destructive" });
      } else {
        toast({ title: "Partial delete", description: `${succeeded.length} deleted, ${failed.length} not deleted.` });
      }
    } catch (err) {
      console.error("handleDeleteAll: unexpected error", err);
      toast({ title: "Delete failed", description: "Server error while attempting to delete group.", variant: "destructive" });
    }
  };
  // =======  END UPDATED handleDeleteAll  =======

  // Import (Option A) — restore deleted rows and persist to DB (updated to operate per-group)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const imported: Student[] = json.map((r: any) => ({
          usn: String(r.USN ?? r.usn ?? r.usnno ?? "").trim(),
          name: String(r.Name ?? r.name ?? "").trim(),
          email: String(r.Email ?? r.email ?? "").trim(),
          phone: String(r.Phone ?? r.phone ?? "").trim(),
          department: selectedDept,
          semester: selectedSem,
          section: selectedSection,
          subject: selectedSubject,
        })).filter(x => x.usn && x.name);

        if (imported.length === 0) { toast({ title: "No rows", description: "No valid rows found in the sheet." }); return; }

        const k = activeKey();

        // Remove imported USNs from the deleted tombstone set (restore on import) for this group only
        setDeletedUsnsMap(prev => {
          const next: Record<string, Set<string>> = {};
          for (const [key, setVal] of Object.entries(prev)) next[key] = new Set(Array.from(setVal));
          if (!next[k]) next[k] = new Set();
          for (const st of imported) next[k].delete(st.usn);
          return next;
        });

        // Merge imported rows into the active group locally
        setStudentsByKey(prev => {
          const group = prev[k] ?? [];
          const map = new Map<string, Student>(group.map(g => [g.usn, g]));
          for (const st of imported) {
            map.set(st.usn, { ...st, id: st.usn });
          }
          const merged = Array.from(map.values());
          return { ...prev, [k]: merged };
        });

        toast({ title: "Imported", description: `${imported.length} rows imported locally. Saving to DB...` });

        // Persist imported rows to server (parallel). Use Promise.allSettled so failures don't block successes.
        const promises = imported.map(st => api.post("/students", {
          name: st.name,
          usn: st.usn,
          email: st.email,
          phone: st.phone,
          department: st.department,
          semester: st.semester,
          section: st.section,
          subject: st.subject
        }));

        const results = await Promise.allSettled(promises);

        // Process responses — on success, replace local record with server returned object
        const successes: Student[] = [];
        const failures: { usn: string; reason?: any }[] = [];
        results.forEach((r, idx) => {
          const usn = imported[idx].usn;
          if (r.status === "fulfilled") {
            const saved: Student = r.value.data;
            successes.push(saved);
          } else {
            failures.push({ usn, reason: r.reason });
          }
        });

        if (successes.length > 0) {
          setStudentsByKey(prev => {
            const group = prev[k] ?? [];
            const map = new Map<string, Student>(group.map(g => [g.usn, g]));
            for (const s of successes) map.set(s.usn, { ...s, id: s.usn });
            return { ...prev, [k]: Array.from(map.values()) };
          });
        }

        if (failures.length > 0) {
          toast({
            title: "Some rows failed to save",
            description: `${failures.length} of ${imported.length} rows failed to save to the server. They remain available locally.`,
            variant: "destructive"
          });
          console.warn("import save failures:", failures);
        } else {
          toast({ title: "All saved", description: `All ${imported.length} rows saved to DB.` });
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Import failed", description: "Could not parse the selected file.", variant: "destructive" });
      } finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsBinaryString(f);
  };

  // current students for active group excluding tombstones
  const currentStudents = useMemo(() => {
    const k = activeKey();
    const arr = studentsByKey[k] ?? [];
    const tombs = deletedUsnsMap[k] ?? new Set<string>();
    return arr.filter(s => !tombs.has(s.usn));
  }, [studentsByKey, selectedDept, selectedSem, selectedSection, selectedSubject, deletedUsnsMap]);

  const writeCurrentStudents = (arr: Student[]) => {
    const k = activeKey();
    setStudentsByKey(prev => ({ ...prev, [k]: arr }));
  };

  // best-effort: fetch backend students for active group (non-blocking)
  useEffect(() => {
    let mounted = true;
    const k = activeKey();
    (async () => {
      try {
        const res = await api.get("/students");
        if (!mounted) return;
        const all: Student[] = Array.isArray(res.data) ? res.data : [];
        const [d, s, sec, sub] = k.split("::").map(x => x === "_" ? "" : x);
        const tombsForKey = deletedUsnsMap[k] ?? new Set<string>();
        const filtered = all.filter(st => {
          if (d && String(st.department || "") !== d) return false;
          if (s && String(st.semester ?? "") !== s) return false;
          if (sec && String(st.section ?? "") !== sec) return false;
          if (sub && String(st.subject ?? "") !== sub) return false;
          if (tombsForKey.has(st.usn)) return false;
          return true;
        }).map(st => ({ ...st, id: st.usn }));

        // Merge server results with local group instead of forcibly overwriting.
        setStudentsByKey(prev => {
          const existing = prev[k] ?? [];
          // create map from existing
          const map = new Map<string, Student>(existing.map(s => [s.usn, s]));
          // overwrite / add from server results (server authoritative for remote values)
          for (const s of filtered) map.set(s.usn, { ...s, id: s.usn });
          // if server returned nothing AND existing has items, keep existing as-is (map already has them)
          return { ...prev, [k]: Array.from(map.values()) };
        });
      } catch {
        // ignore — keep local data
      }
    })();
    return () => { mounted = false; };
  }, [selectedDept, selectedSem, selectedSection, selectedSubject, deletedUsnsMap]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return currentStudents;
    const q = searchTerm.trim().toLowerCase();
    return currentStudents.filter(s =>
      String(s.name || "").toLowerCase().includes(q) ||
      String(s.usn || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q) ||
      String(s.phone || "").toLowerCase().includes(q)
    );
  }, [currentStudents, searchTerm]);

  const inputStyle: React.CSSProperties = { height: 40, borderRadius: 8, border: `1px solid ${colors.inputBorder}`, padding: "0 10px", boxSizing: "border-box", background: "white", fontSize: 14 };

  return (
    <div style={{ background: colors.pageBg, minHeight: "100vh" }}>
      <div className="w-full px-6 py-6">
        <Card className="w-full shadow-none" style={{ background: "transparent", boxShadow: "none" }}>
          <div style={{ background: colors.cardOuterBg, padding: 12, borderRadius: 12 }}>
            <CardContent className="p-3 rounded-lg" style={{ background: colors.cardInnerBg, borderRadius: 8, border: "1px solid rgba(30,120,200,0.04)" }}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                <div className="flex flex-col">
                  <h2 className="text-xl md:text-2xl font-semibold" style={{ color: colors.brandDark, marginBottom: 2 }}>Students</h2>
                  <div className="text-sm text-slate-500">Manage students by department, semester, section and subject</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />
                  <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1" style={{ backgroundColor: colors.addBlue, color: "white", borderRadius: 8 }}>
                    <FileUp /> Import
                  </Button>

                  <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-3 py-1" style={{ backgroundColor: colors.addBlue, color: "white", borderRadius: 8 }}>
                    <Plus /> Add
                  </Button>

                  <Button onClick={handleDeleteAll} className="flex items-center gap-2 px-3 py-1" style={{ backgroundColor: colors.danger, color: "white", borderRadius: 8 }}>
                    <Trash2 /> Delete All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-end mb-3">
                <div className="col-span-12 md:col-span-3">
                  <Label className="block mb-1">Department</Label>
                  <div className="flex gap-2 items-center">
                    <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ height: 40, borderRadius: 8, border: `1px solid ${colors.inputBorder}`, padding: "0 10px", background: "white", width: "100%" }}>
                      <option value="">— None —</option>
                      {departmentsList.map((d) => <option key={String(d)} value={String(d)}>{String(d)}</option>)}
                    </select>
                    <Button onClick={() => setOpenManage("departments")} className="px-2 py-1" style={{ backgroundColor: colors.addBlue, color: "white", borderRadius: 8 }}>Manage</Button>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <Label className="block mb-1">Semester</Label>
                  <div className="flex gap-2 items-center">
                    <select value={selectedSem as any} onChange={(e) => setSelectedSem(e.target.value === "" ? "" : Number(e.target.value))} style={{ height: 40, borderRadius: 8, border: `1px solid ${colors.inputBorder}`, padding: "0 10px", background: "white", width: "100%" }}>
                      <option value="">— None —</option>
                      {semestersList.map((s) => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                    </select>
                    <Button onClick={() => setOpenManage("semesters")} className="px-2 py-1" style={{ backgroundColor: colors.addBlue, color: "white", borderRadius: 8 }}>Manage</Button>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <Label className="block mb-1">Section</Label>
                  <div className="flex gap-2 items-center">
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={{ height: 40, borderRadius: 8, border: `1px solid ${colors.inputBorder}`, padding: "0 10px", background: "white", width: "100%" }}>
                      <option value="">— None —</option>
                      {sectionsList.map((s) => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                    </select>
                    <Button onClick={() => setOpenManage("sections")} className="px-2 py-1" style={{ backgroundColor: colors.addBlue, color: "white", borderRadius: 8 }}>Manage</Button>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <Label className="block mb-1">Subject</Label>
                  <div className="flex gap-2 items-center">
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ height: 40, borderRadius: 8, border: `1px solid ${colors.inputBorder}`, padding: "0 10px", background: "white", width: "100%" }}>
                      <option value="">— None —</option>
                      {subjectsList.map((s) => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                    </select>
                    <Button onClick={() => setOpenManage("subjects")} className="px-2 py-1" style={{ backgroundColor: colors.addBlue, color: "white", borderRadius: 8 }}>Manage</Button>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <input placeholder="Search name or USN" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", ...inputStyle }} />
              </div>

              <div className="mb-2 text-sm text-slate-500">Total: {currentStudents.length}</div>

              <div className="rounded overflow-auto" style={{ background: "white", width: "100%" }}>
                <div style={{ minWidth: 720 }}>
                  <Table>
                    <TableHeader style={{ background: "transparent" }}>
                      <TableRow>
                        <TableHead className="text-sm text-slate-600">#</TableHead>
                        <TableHead className="text-sm text-slate-600">Name</TableHead>
                        <TableHead className="text-sm text-slate-600">USN</TableHead>
                        <TableHead className="text-sm text-slate-600">Email</TableHead>
                        <TableHead className="text-sm text-slate-600">Phone</TableHead>
                        <TableHead className="text-sm text-slate-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-600">No students in this group.</TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((s, idx) => (
                          <TableRow key={s.usn} className="hover:bg-slate-50">
                            <TableCell style={{ width: 60 }}>{idx + 1}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.usn}</TableCell>
                            <TableCell>{s.email ?? "-"}</TableCell>
                            <TableCell>{s.phone ?? "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEdit(s)} aria-label="Edit" style={{ width: 40, height: 36, borderRadius: 8, background: colors.addBlue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                                  <Edit />
                                </button>
                                <button onClick={() => handleDeleteStudent(s.usn)} aria-label="Delete" style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", color: colors.danger, border: "1px solid rgba(234,106,110,0.14)" }}>
                                  <Trash2 />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* manage modals */}
      <ManageModal open={openManage === "departments"} onOpenChange={(o) => setOpenManage(o ? "departments" : null)} title="Departments" placeholder="Add department" items={departmentsList} onAdd={addDepartment} onDelete={deleteDepartment} onUpdate={updateDepartment} />
      <ManageModal open={openManage === "semesters"} onOpenChange={(o) => setOpenManage(o ? "semesters" : null)} title="Semesters" placeholder="Add semester (number)" items={semestersList} onAdd={addSemester} onDelete={deleteSemester} onUpdate={updateSemester} />
      <ManageModal open={openManage === "sections"} onOpenChange={(o) => setOpenManage(o ? "sections" : null)} title="Sections" placeholder="Add section" items={sectionsList} onAdd={addSection} onDelete={deleteSection} onUpdate={updateSection} />
      <ManageModal open={openManage === "subjects"} onOpenChange={(o) => setOpenManage(o ? "subjects" : null)} title="Subjects" placeholder="Add subject" items={subjectsList} onAdd={addSubject} onDelete={deleteSubject} onUpdate={updateSubject} />

      {/* Add Student (compact) */}
      <SmallModal open={isAddOpen} title="Add Student" onClose={() => setIsAddOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <Label className="mb-1">Name</Label>
            <input style={{ ...inputStyle, width: "100%" }} value={formData.name} onChange={(e) => setFormData(fd => ({ ...fd, name: e.target.value }))} />
          </div>
          <div>
            <Label className="mb-1">USN</Label>
            <input style={{ ...inputStyle, width: "100%" }} value={formData.usn} onChange={(e) => setFormData(fd => ({ ...fd, usn: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label className="mb-1">Email</Label>
              <input style={{ ...inputStyle, width: "100%" }} value={formData.email} onChange={(e) => setFormData(fd => ({ ...fd, email: e.target.value }))} />
            </div>
            <div style={{ width: 160 }}>
              <Label className="mb-1">Phone</Label>
              <input style={{ ...inputStyle, width: "100%" }} value={formData.phone} onChange={(e) => setFormData(fd => ({ ...fd, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setIsAddOpen(false)} style={{ minWidth: 100, padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`, background: "white" }}>Cancel</button>
            <button onClick={handleAddStudent} style={{ minWidth: 120, padding: "8px 12px", borderRadius: 8, border: "none", background: colors.addBlue, color: "white", fontWeight: 700 }}>Save</button>
          </div>
        </div>
      </SmallModal>

      {/* Edit Student (compact) */}
      <SmallModal open={isEditOpen} title="Edit Student" onClose={() => setIsEditOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <Label className="mb-1">Name</Label>
            <input style={{ ...inputStyle, width: "100%" }} value={editFormData.name ?? ""} onChange={(e) => setEditFormData(fd => ({ ...fd, name: e.target.value }))} />
          </div>
          <div>
            <Label className="mb-1">USN</Label>
            <input style={{ ...inputStyle, width: "100%" }} value={editFormData.usn ?? ""} onChange={(e) => setEditFormData(fd => ({ ...fd, usn: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Label className="mb-1">Email</Label>
              <input style={{ ...inputStyle, width: "100%" }} value={editFormData.email ?? ""} onChange={(e) => setEditFormData(fd => ({ ...fd, email: e.target.value }))} />
            </div>
            <div style={{ width: 160 }}>
              <Label className="mb-1">Phone</Label>
              <input style={{ ...inputStyle, width: "100%" }} value={editFormData.phone ?? ""} onChange={(e) => setEditFormData(fd => ({ ...fd, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setIsEditOpen(false)} style={{ minWidth: 100, padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`, background: "white" }}>Cancel</button>
            <button onClick={handleEditStudent} style={{ minWidth: 120, padding: "8px 12px", borderRadius: 8, border: "none", background: colors.addBlue, color: "white", fontWeight: 700 }}>Save</button>
          </div>
        </div>
      </SmallModal>
    </div>
  );
};

export default Students;
