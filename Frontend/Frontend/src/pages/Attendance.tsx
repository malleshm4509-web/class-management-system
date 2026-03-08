// src/pages/Attendance.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type Student = {
  id: string;
  name: string;
  usn?: string;
  department?: string;
  semester?: number | string;
  section?: string;
  subject?: string;
};

const LS_STUDENTS = "app_students_v1";
const LS_FILTERS = "app_filters_v1";
const LS_SESSIONS = "app_attendance_sessions_v1";
const LS_TOTALS = "app_attendance_totals_v1";
const LS_DEPARTMENTS = "app_departments_v1";
const LS_SEMESTERS = "app_semesters_v1";
const LS_SECTIONS = "app_sections_v1";
const LS_SUBJECTS = "app_subjects_v1";

/** Read students for the given groupKey from canonical students storage (read-only) */
const readGroupFromLS = (groupKey: string): Student[] => {
  try {
    const raw = localStorage.getItem(LS_STUDENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const arr = parsed[groupKey] ?? [];
    return arr.map((s: any, idx: number) => ({
      id: s.id ?? s.usn ?? `${groupKey}#${idx}`,
      name: s.name ?? "",
      usn: s.usn ?? "",
      department: s.department,
      semester: s.semester,
      section: s.section,
      subject: s.subject,
    }));
  } catch {
    return [];
  }
};

/** Safe read of filters from localStorage */
const readFiltersFromLS = () => {
  try {
    const raw = localStorage.getItem(LS_FILTERS);
    const p = raw ? JSON.parse(raw) : {};
    return { dept: p.dept ?? "", sem: p.sem ?? "", sec: p.sec ?? "", sub: p.sub ?? "" };
  } catch {
    return { dept: "", sem: "", sec: "", sub: "" };
  }
};

export default function Attendance() {
  // instance id to prevent echoing our own same-tab events
  const instanceIdRef = useRef<string>(() => Math.random().toString(36).slice(2, 9));
  if (typeof instanceIdRef.current === "function") instanceIdRef.current = (instanceIdRef.current as any)();

  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState<{ dept: string; sem: string | number; sec: string; sub: string }>(() =>
    readFiltersFromLS()
  );

  // compute today's date string (YYYY-MM-DD) and use as the maximum allowed date
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ensure initial date is not in the future (shouldn't be, but safe-guard)
  const initialDate = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    return now > todayStr ? todayStr : now;
  }, [todayStr]);

  const [date, setDate] = useState<string>(() => initialDate);
  const [sessionPresent, setSessionPresent] = useState<Record<string, boolean>>({});
  const [classesCount, setClassesCount] = useState<number>(0);
  const [totals, setTotals] = useState<Record<string, number>>({});

  const [departments] = useState<string[]>(() => JSON.parse(localStorage.getItem(LS_DEPARTMENTS) || "[]"));
  const [semesters] = useState<number[]>(() => JSON.parse(localStorage.getItem(LS_SEMESTERS) || "[]"));
  const [sections] = useState<string[]>(() => JSON.parse(localStorage.getItem(LS_SECTIONS) || "[]"));
  const [subjects] = useState<string[]>(() => JSON.parse(localStorage.getItem(LS_SUBJECTS) || "[]"));

  const filterKey = useMemo(() => `${filters.dept}::${String(filters.sem)}::${filters.sec}::${filters.sub}`, [filters]);
  const sessionKey = useMemo(() => `${date}::${filterKey}`, [date, filterKey]);

  // ---- FILTER SYNC (persist to LS + same-tab event) ----
  const filterDebounceTimer = useRef<number | null>(null);
  const FILTER_DEBOUNCE_MS = 220;

  const persistFilters = (nextFilters: { dept: string; sem: string | number; sec: string; sub: string }, immediate = false) => {
    const doSave = () => {
      try {
        localStorage.setItem(LS_FILTERS, JSON.stringify(nextFilters));
        window.dispatchEvent(
          new CustomEvent("filters:updated", { detail: { filters: nextFilters, source: instanceIdRef.current } })
        );
      } catch (e) {
        console.error("Failed saving filters to LS", e);
      }
    };

    if (immediate) {
      if (filterDebounceTimer.current) {
        window.clearTimeout(filterDebounceTimer.current);
        filterDebounceTimer.current = null;
      }
      doSave();
    } else {
      if (filterDebounceTimer.current) window.clearTimeout(filterDebounceTimer.current);
      // @ts-ignore
      filterDebounceTimer.current = window.setTimeout(() => {
        doSave();
        filterDebounceTimer.current = null;
      }, FILTER_DEBOUNCE_MS);
    }
  };

  const onFilterChange = (partial: Partial<{ dept: string; sem: string | number; sec: string; sub: string }>) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      persistFilters(next);
      return next;
    });
  };

  useEffect(() => {
    const onCustom = (ev: Event) => {
      try {
        const d = (ev as CustomEvent).detail || {};
        const remoteFilters = d.filters;
        const source = d.source;
        if (source === instanceIdRef.current) return;
        if (!remoteFilters) return;
        setFilters((prev) => {
          if (
            prev.dept === (remoteFilters.dept ?? "") &&
            String(prev.sem) === String(remoteFilters.sem ?? "") &&
            prev.sec === (remoteFilters.sec ?? "") &&
            prev.sub === (remoteFilters.sub ?? "")
          )
            return prev;
          return { dept: remoteFilters.dept ?? "", sem: remoteFilters.sem ?? "", sec: remoteFilters.sec ?? "", sub: remoteFilters.sub ?? "" };
        });
      } catch {}
    };

    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== LS_FILTERS) return;
      try {
        const remoteFilters = ev.newValue ? JSON.parse(ev.newValue) : { dept: "", sem: "", sec: "", sub: "" };
        setFilters((prev) => {
          if (
            prev.dept === (remoteFilters.dept ?? "") &&
            String(prev.sem) === String(remoteFilters.sem ?? "") &&
            prev.sec === (remoteFilters.sec ?? "") &&
            prev.sub === (remoteFilters.sub ?? "")
          )
            return prev;
          return { dept: remoteFilters.dept ?? "", sem: remoteFilters.sem ?? "", sec: remoteFilters.sec ?? "", sub: remoteFilters.sub ?? "" };
        });
      } catch {}
    };

    window.addEventListener("filters:updated", onCustom as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("filters:updated", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ---- END FILTER SYNC ----

  // keep students in-sync with filters (read-only)
  useEffect(() => {
    const refresh = () => setStudents(readGroupFromLS(filterKey));
    refresh();

    const storageListener = (ev: StorageEvent) => {
      if (ev.key === LS_STUDENTS || ev.key === LS_FILTERS) refresh();
    };

    window.addEventListener("students:updated", refresh);
    window.addEventListener("storage", storageListener);

    return () => {
      window.removeEventListener("students:updated", refresh);
      window.removeEventListener("storage", storageListener);
    };
  }, [filterKey]);

  useEffect(() => setStudents(readGroupFromLS(filterKey)), [filterKey]);

  // -------- NEW: prune attendance when students are deleted ----------
  // Keep a ref of the previous student list so we can diff and detect deletions.
  const prevStudentsRef = useRef<Student[]>([]);
  useEffect(() => {
    const computeAndPrune = async (newStudents: Student[], sourceInstance?: string) => {
      const prev = prevStudentsRef.current || [];
      // map by id for quick lookups
      const prevById = new Map(prev.map((s) => [s.id, s]));
      const newById = new Map(newStudents.map((s) => [s.id, s]));

      // removed = in prev but not in new
      const removed = prev.filter((s) => !newById.has(s.id));
      if (removed.length === 0) {
        prevStudentsRef.current = newStudents;
        return;
      }

      const removedIds = removed.map((r) => r.id);
      const removedUsns = removed.map((r) => (r.usn ?? "").toString()).filter(Boolean);

      // 1) prune localStorage sessions & totals
      try {
        // prune sessions
        const rawSessions = localStorage.getItem(LS_SESSIONS);
        const sessions = rawSessions ? JSON.parse(rawSessions) : {};
        // remove the removed student ids from each session's present map
        Object.keys(sessions).forEach((sKey) => {
          const entry = sessions[sKey];
          if (!entry || !entry.present) return;
          removedIds.forEach((rid) => {
            if (entry.present[rid] !== undefined) {
              delete entry.present[rid];
            }
          });
          // if present map becomes empty and draft === true, keep it (we may keep empty sessions).
          sessions[sKey] = entry;
        });
        localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed pruning sessions in localStorage", e);
      }

      try {
        // prune totals
        const rawTotals = localStorage.getItem(LS_TOTALS);
        const allTotals = rawTotals ? JSON.parse(rawTotals) : {};
        Object.keys(allTotals).forEach((tk) => {
          const entry = allTotals[tk];
          if (!entry || !entry.totals) return;
          removedIds.forEach((rid) => {
            if (entry.totals && entry.totals.hasOwnProperty(rid)) {
              delete entry.totals[rid];
            }
          });
          allTotals[tk] = entry;
        });
        localStorage.setItem(LS_TOTALS, JSON.stringify(allTotals));
      } catch (e) {
        console.error("Failed pruning totals in localStorage", e);
      }

      // 2) try to delete attendance rows on server for removed USNs (best-effort)
      if (removedUsns.length > 0) {
        try {
          // axios supports sending body with delete via config.data. We use generic request to be safe.
          await api.request({
            method: "delete",
            url: "/attendance/bulk",
            data: { usns: removedUsns },
          });
        } catch (err) {
          // don't block — inform the user that server prune failed (optional)
          console.warn("Server prune of attendance for removed students failed", err);
        }
      }

      // notify other tabs/components that pruning happened
      try {
        window.dispatchEvent(
          new CustomEvent("attendance:pruned", {
            detail: { removedIds, removedUsns, source: instanceIdRef.current },
          })
        );
      } catch {}

      // update prev ref
      prevStudentsRef.current = newStudents;
    };

    // event handler for when students are updated (same event name you use elsewhere)
    const handleStudentsUpdated = () => {
      const current = readGroupFromLS(filterKey);
      computeAndPrune(current);
      setStudents(current);
    };

    // also detect storage events (other tabs)
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key !== LS_STUDENTS) return;
      const current = readGroupFromLS(filterKey);
      computeAndPrune(current);
      setStudents(current);
    };

    // initialize prev
    prevStudentsRef.current = readGroupFromLS(filterKey);

    window.addEventListener("students:updated", handleStudentsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("students:updated", handleStudentsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
    // only run when filterKey changes — pruning is always computed against the canonical list for current filter group
  }, [filterKey]);

  // -------- END prune logic --------------------------------------

  // fetch totals from server (best-effort)
  const fetchTotalsFromServer = async () => {
    try {
      const res = await api.get(filters.sub ? `/attendance/by-subject/${encodeURIComponent(filters.sub)}` : "/attendance");
      const rows: any[] = Array.isArray(res.data) ? res.data : [];
      const allowedUsns = new Set(students.map((s) => s.usn));

      const totalsByUsn: Record<string, number> = {};
      const dateSet = new Set<string>();

      rows.forEach((r) => {
        if (!allowedUsns.has(r.usn)) return;
        if (r.attendDate) dateSet.add(r.attendDate);
        if (!totalsByUsn[r.usn]) totalsByUsn[r.usn] = 0;
        if (r.present) totalsByUsn[r.usn] += 1;
      });

      const totalsById: Record<string, number> = {};
      students.forEach((s) => {
        totalsById[s.id] = totalsByUsn[s.usn ?? ""] || 0;
      });

      setClassesCount(dateSet.size);
      setTotals(totalsById);

      const raw = localStorage.getItem(LS_TOTALS);
      const allTotals = raw ? JSON.parse(raw) : {};
      allTotals[filterKey] = { classes: dateSet.size, totals: totalsById };
      localStorage.setItem(LS_TOTALS, JSON.stringify(allTotals));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SESSIONS);
      const sessions = raw ? JSON.parse(raw) : {};
      setSessionPresent(sessions[sessionKey]?.present || {});
    } catch {}
    try {
      const rawTotals = localStorage.getItem(LS_TOTALS);
      const allTotals = rawTotals ? JSON.parse(rawTotals) : {};
      const entry = allTotals[filterKey] || { classes: 0, totals: {} };
      setClassesCount(entry.classes || 0);
      setTotals(entry.totals || {});
    } catch {}
    fetchTotalsFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, filterKey, students.length]);

  // persist session/totals locally and notify (same as before)
  // NOTE: added forceIncrement parameter to allow increment on every save click when desired.
  const persistSessionLocally = (final = false, forceIncrement = false) => {
    try {
      const rawSessions = localStorage.getItem(LS_SESSIONS);
      const sessions = rawSessions ? JSON.parse(rawSessions) : {};
      const rawTotals = localStorage.getItem(LS_TOTALS);
      const allTotals = rawTotals ? JSON.parse(rawTotals) : {};
      const totalsEntry = allTotals[filterKey] || { classes: 0, totals: {} };

      const prevSession = sessions[sessionKey]; // may be undefined
      const prevPresent: Record<string, boolean> = (prevSession && prevSession.present) || {};

      const newPresentIds = Object.keys(sessionPresent).filter((id) => sessionPresent[id]);
      const prevPresentIds = Object.keys(prevPresent).filter((id) => prevPresent[id]);

      const isNewSession = !prevSession;
      const wasDraft = !!(prevSession && prevSession.draft);

      const updatedTotals: Record<string, number> = { ...(totalsEntry.totals || {}) };

      if (final) {
        if (forceIncrement) {
          // Force increment behavior: every finalization increments classes and present totals
          totalsEntry.classes = (Number(totalsEntry.classes) || 0) + 1;
          newPresentIds.forEach((id) => {
            updatedTotals[id] = (updatedTotals[id] || 0) + 1;
          });
        } else {
          // Original safe behavior: increment only when new or draft->final, otherwise apply diffs
          if (isNewSession || wasDraft) {
            totalsEntry.classes = (Number(totalsEntry.classes) || 0) + 1;
            newPresentIds.forEach((id) => {
              updatedTotals[id] = (updatedTotals[id] || 0) + 1;
            });
          } else {
            // Editing an already-finalized session: apply differential changes only
            newPresentIds.forEach((id) => {
              if (!prevPresent[id]) updatedTotals[id] = (updatedTotals[id] || 0) + 1;
            });
            prevPresentIds.forEach((id) => {
              if (!sessionPresent[id]) updatedTotals[id] = Math.max(0, (updatedTotals[id] || 0) - 1);
            });
          }
        }
      } else {
        // Draft: do not change classes count or totals
      }

      totalsEntry.totals = updatedTotals;
      allTotals[filterKey] = totalsEntry;
      // save session; mark draft status appropriately
      sessions[sessionKey] = { present: { ...sessionPresent }, draft: !final };

      localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(LS_TOTALS, JSON.stringify(allTotals));

      setTotals(updatedTotals);
      setClassesCount(Number(totalsEntry.classes) || 0);

      try {
        window.dispatchEvent(
          new CustomEvent(final ? "attendance:updated" : "attendance:draft", {
            detail: { sessionKey, filterKey, source: instanceIdRef.current },
          })
        );
      } catch {}
    } catch (e) {
      console.error("Local persist failed:", e);
    }
  };

  // ---------- UPDATED: saveAttendanceToServer (Option A) ----------
  // Every successful save increments Total Classes by +1 and present student totals by +1 (forced).
  // We persist to LS_TOTALS and immediately read from LS to update UI; we do NOT call fetchTotalsFromServer()
  // right after save (so the forced increment is not overwritten).
  const saveAttendanceToServer = async () => {
    if (!filters.sub) {
      toast({ title: "Select subject", description: "Please select a subject before saving.", variant: "destructive" });
      return;
    }
    if (students.length === 0) {
      toast({ title: "No students", description: "Selected group has no students to save.", variant: "destructive" });
      return;
    }

    const missingUsn = students.filter((s) => !s.usn || String(s.usn).trim() === "");
    if (missingUsn.length > 0) {
      const names = missingUsn.map((s) => `${s.name ?? "(no-name)"} (id: ${s.id})`).join(", ");
      toast({ title: "Missing USNs", description: `Some students missing USN: ${names}`, variant: "destructive" });
      return;
    }

    const payload = students.map((s) => ({
      usn: String(s.usn).trim(),
      subject: filters.sub,
      attendDate: date,
      present: !!sessionPresent[s.id],
    }));

    try {
      // send to server
      await api.post("/attendance/bulk", payload);

      // Persist locally as finalized AND force increment totals/classes for this save click
      try {
        persistSessionLocally(true, true); // final=true, forceIncrement=true (this updates LS_TOTALS)
      } catch (e) {
        console.warn("Persist locally after server save failed:", e);
      }

      // Immediately reflect increments in UI state (read from LS_TOTALS to stay consistent)
      try {
        const rawTotals = localStorage.getItem(LS_TOTALS);
        const allTotals = rawTotals ? JSON.parse(rawTotals) : {};
        const entry = allTotals[filterKey] || { classes: 0, totals: {} };

        // set state from the entry we just updated via persistSessionLocally
        setClassesCount(Number(entry.classes) || 0);
        setTotals(entry.totals || {});
      } catch (e) {
        // fallback: increment state directly if LS read fails
        setClassesCount((c) => Number(c || 0) + 1);
        setTotals((prevTotals) => {
          const next = { ...(prevTotals || {}) };
          students.forEach((s) => {
            if (sessionPresent[s.id]) {
              next[s.id] = (Number(next[s.id] || 0) + 1);
            }
          });
          return next;
        });
      }

      // Do not fetch server totals immediately — we intentionally preserve local forced increment.
      toast({ title: "Saved successfully" });
    } catch (err) {
      console.warn("Save attendance server sync failed — saving as draft locally", err);
      // Server failed: persist as draft locally (do not increment classes)
      try {
        persistSessionLocally(false);
      } catch (e) {
        console.error("Persist draft failed after server error", e);
      }
      toast({ title: "Save failed", description: "Attendance saved as draft locally. Server sync failed.", variant: "destructive" });
    }
  };
  // ---------- END UPDATED saveAttendanceToServer ----------

  // Present toggles (persist draft)
  const togglePresent = (id: string) =>
    setSessionPresent((p) => {
      const n = { ...p };
      n[id] = !n[id];
      if (!n[id]) delete n[id];
      setTimeout(() => persistSessionLocally(false), 0);
      return n;
    });

  const markAll = () => {
    const n: Record<string, boolean> = {};
    students.forEach((s) => (n[s.id] = true));
    setSessionPresent(n);
    setTimeout(() => persistSessionLocally(false), 0);
  };

  const clearAll = () => {
    setSessionPresent({});
    setTimeout(() => persistSessionLocally(false), 0);
  };

  const percentFor = (id: string) => {
    const cls = Number(classesCount) || 0;
    if (cls <= 0) return "0%";
    return (((totals[id] || 0) / cls) * 100).toFixed(1) + "%";
  };

  // small helper UI pieces to make selects look nicer
  const FilterCard = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
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

  return (
    <main className="min-h-screen bg-[#F7F9FF] text-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="rounded-xl border border-[#E3E8FF] bg-white shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E3E8FF] bg-[#EEF2FF]">
            <h2 className="text-xl font-semibold text-[#3F51B5]">Attendance</h2>

            <div className="flex items-center gap-4">
              <div>
                <Label>Date</Label>
                {/* Prevent future dates: set max to today and clamp onChange */}
                <Input
                  type="date"
                  value={date}
                  max={todayStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    // Clamp to todayStr if user attempts to pick/paste future date
                    setDate(v > todayStr ? todayStr : v);
                  }}
                />
              </div>
              <div>
                <Label>Total Classes</Label>
                <Input value={classesCount} readOnly />
              </div>
              <Button className="bg-[#7B8CFF] hover:bg-[#6E7DF5] text-white" onClick={saveAttendanceToServer}>
                Save Attendance
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* prettier filter panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <FilterCard title="Department" hint="Select the department">
                <Select value={filters.dept} onValueChange={(v) => onFilterChange({ dept: v })}>
                  <SelectTrigger className="w-full rounded-xl border-[#E3E8FF] h-11">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCard>

              <FilterCard title="Semester" hint="Choose semester">
                <Select value={String(filters.sem)} onValueChange={(v) => onFilterChange({ sem: v })}>
                  <SelectTrigger className="w-full rounded-xl border-[#E3E8FF] h-11">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {semesters.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCard>

              <FilterCard title="Section" hint="Group / section">
                <Select value={filters.sec} onValueChange={(v) => onFilterChange({ sec: v })}>
                  <SelectTrigger className="w-full rounded-xl border-[#E3E8FF] h-11">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCard>

              <FilterCard title="Subject" hint="Subject for attendance">
                <Select value={filters.sub} onValueChange={(v) => onFilterChange({ sub: v })}>
                  <SelectTrigger className="w-full rounded-xl border-[#E3E8FF] h-11">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterCard>
            </div>

            {/* search & actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="relative w-full sm:w-1/3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name or USN" className="pl-10 border-[#E3E8FF]" />
              </div>

              <div className="flex gap-2">
                <Button className="bg-[#7B8CFF] hover:bg-[#6E7DF5] text-white" onClick={markAll}>
                  Mark All
                </Button>
                <Button variant="outline" className="border-[#7B8CFF] text-[#7B8CFF]" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="text-sm font-medium mb-3">Total: {students.length}</div>

            <div className="overflow-x-auto rounded border border-[#E3E8FF]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F4F6FF]">
                    <TableCell className="font-semibold text-[#3F51B5]">S.No</TableCell>
                    <TableCell className="font-semibold text-[#3F51B5]">Name</TableCell>
                    <TableCell className="font-semibold text-[#3F51B5]">USN</TableCell>
                    <TableCell className="font-semibold text-[#3F51B5]">Present</TableCell>
                    <TableCell className="font-semibold text-[#3F51B5]">Attended</TableCell>
                    <TableCell className="font-semibold text-[#3F51B5]">Percentage</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.usn}</TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={!!sessionPresent[s.id]}
                          onChange={() => togglePresent(s.id)}
                        />
                      </TableCell>
                      <TableCell>{totals[s.id] || 0}</TableCell>
                      <TableCell>{percentFor(s.id)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
