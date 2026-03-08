// src/hooks/useSharedStudents.ts
import { useCallback, useEffect, useMemo, useState } from "react";

const LS_STUDENTS = "app_students_v1";
const LS_FILTERS = "app_filters_v1";
const LS_SYNC_EVENT = "app_sync_event";

export type Student = {
  id: string;
  name: string;
  usn: string;
  email?: string;
  phone?: string;
  department?: string;
  semester?: number | string;
  section?: string;
  subject?: string;
};

export type Filters = { dept?: string; sem?: number | ""; sec?: string; sub?: string };

function parseGroupedStudents(raw: string | null): Record<string, Student[]> {
  try {
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { _: parsed as Student[] };
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, Student[]>;
    return {};
  } catch {
    return {};
  }
}

function readFiltersFromLS(): Filters {
  try {
    const raw = localStorage.getItem(LS_FILTERS);
    if (!raw) return { dept: "", sem: "", sec: "", sub: "" };
    const parsed = JSON.parse(raw);
    return { dept: parsed.dept ?? "", sem: parsed.sem ?? "", sec: parsed.sec ?? "", sub: parsed.sub ?? "" };
  } catch {
    return { dept: "", sem: "", sec: "", sub: "" };
  }
}

export function useSharedStudents() {
  const [grouped, setGrouped] = useState<Record<string, Student[]>>(() =>
    parseGroupedStudents(localStorage.getItem(LS_STUDENTS))
  );
  const [filters, setFiltersState] = useState<Filters>(() => readFiltersFromLS());

  const activeKey = useCallback(
    (f: Filters = filters) => {
      const d = f.dept && f.dept !== "" ? f.dept : "_";
      const s = f.sem === "" || f.sem === undefined ? "_" : String(f.sem);
      const sec = f.sec && f.sec !== "" ? f.sec : "_";
      const sub = f.sub && f.sub !== "" ? f.sub : "_";
      return `${d}::${s}::${sec}::${sub}`;
    },
    [filters]
  );

  const currentStudents = useMemo(() => {
    const k = activeKey(filters);
    return grouped[k] ?? [];
  }, [grouped, filters, activeKey]);

  // update LS & broadcast filters
  const setFilters = useCallback((next: Filters | ((p: Filters) => Filters)) => {
    setFiltersState((prev) => {
      const newFilters = typeof next === "function" ? (next as (p: Filters) => Filters)(prev) : next;
      try {
        const payload = {
          dept: newFilters.dept ?? "",
          sem: newFilters.sem === "" ? "" : newFilters.sem,
          sec: newFilters.sec ?? "",
          sub: newFilters.sub ?? "",
        };
        localStorage.setItem(LS_FILTERS, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent("filters:updated", { detail: payload }));
        // small sync to notify other tabs
        localStorage.setItem(`${LS_SYNC_EVENT}_ts`, String(Date.now()));
      } catch {}
      return newFilters;
    });
  }, []);

  const refresh = useCallback(() => {
    try {
      setGrouped(parseGroupedStudents(localStorage.getItem(LS_STUDENTS)));
      setFiltersState(readFiltersFromLS());
    } catch {}
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === LS_STUDENTS && e.newValue) {
        setGrouped(parseGroupedStudents(e.newValue));
      }
      if (e.key === LS_FILTERS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFiltersState({ dept: parsed.dept ?? "", sem: parsed.sem ?? "", sec: parsed.sec ?? "", sub: parsed.sub ?? "" });
        } catch {}
      }
      if (e.key && e.key.startsWith(LS_SYNC_EVENT)) {
        setGrouped(parseGroupedStudents(localStorage.getItem(LS_STUDENTS)));
      }
    };

    const onCustom = () => {
      setGrouped(parseGroupedStudents(localStorage.getItem(LS_STUDENTS)));
      setFiltersState(readFiltersFromLS());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("students:updated", onCustom);
    window.addEventListener("students:deletedAll", onCustom);
    window.addEventListener("filters:updated", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("students:updated", onCustom);
      window.removeEventListener("students:deletedAll", onCustom);
      window.removeEventListener("filters:updated", onCustom);
    };
  }, []);

  return {
    groupedStudents: grouped,
    currentStudents,
    filters,
    setFilters,
    refresh,
    activeKey: () => activeKey(filters),
  };
}
