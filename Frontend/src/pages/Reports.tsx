import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Search, FileText } from "lucide-react";

type Student = {
  id?: string;
  name?: string;
  usn: string;
  email?: string;
  semester?: number;
  section?: string;
  department?: string;
};

type Attendance = {
  usn: string;
  subject: string;
  attendDate: string;
  present: boolean;
};

type Mark = {
  usn: string;
  subject: string;
  test: string;
  marks: number;
  maxMarks: number;
};

export default function Reports() {

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUSN, setSelectedUSN] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    try {
      const s = await api.get("/students");
      setStudents(s.data || []);
    } catch {}

    try {
      const a = await api.get("/attendance");
      setAttendance(a.data || []);
    } catch {}

    try {
      const m = await api.get("/marks");
      setMarks(m.data || []);
    } catch {}

  }

  const selectedStudent = students.find((s) => s.usn === selectedUSN);

  const subjects = Array.from(
    new Set([
      ...attendance.filter((a) => a.usn === selectedUSN).map((a) => a.subject),
      ...marks.filter((m) => m.usn === selectedUSN).map((m) => m.subject),
    ])
  );

  function attendanceForSubject(subject: string) {

    const rows = attendance.filter(
      (a) => a.usn === selectedUSN && a.subject === subject
    );

    const uniqueDates = new Set(rows.map((r) => r.attendDate));

    const total = uniqueDates.size;
    const attended = rows.filter((r) => r.present).length;

    const percent = total
      ? ((attended / total) * 100).toFixed(1)
      : "0";

    return { total, attended, percent };

  }

  const tests = Array.from(new Set(marks.map((m) => m.test)));

  const suggestions = students.filter(
    (s) =>
      s.usn?.toLowerCase().includes(query.toLowerCase()) ||
      s.name?.toLowerCase().includes(query.toLowerCase())
  );

  const downloadPDF = () => {
    window.print();
  };

  return (

    <div className="min-h-screen p-10 bg-white">

      <Card className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-sm">

        {/* SEARCH AREA */}

        <div className="p-6 border-b bg-white no-print">

          <h2 className="text-xl font-semibold text-black">
            Student Report
          </h2>

          <div className="flex gap-3 mt-4 items-center">

            <Search size={18} />

            <input
              className="border border-gray-300 p-2 w-full rounded bg-white"
              placeholder="Search by USN or name"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedUSN("");
              }}
            />

            <Button
              disabled={!selectedUSN}
              onClick={downloadPDF}
              className="bg-blue-600 text-white"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>

          </div>

          {query && (

            <div className="border border-gray-200 mt-2 rounded bg-white">

              {suggestions.slice(0, 10).map((s) => (
                <div
                  key={s.usn}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSelectedUSN(s.usn);
                    setQuery(s.usn);
                  }}
                >
                  {s.usn} — {s.name}
                </div>
              ))}

            </div>

          )}

        </div>

        <CardContent className="p-10 bg-white">

          {!selectedUSN ? (

            <div className="text-center text-gray-500 py-20">

              <FileText size={60} className="mx-auto mb-3" />
              Select a student to generate report

            </div>

          ) : (

            <div id="pdfReport" className="bg-white">

              {/* HEADER */}

              <div className="text-center bg-white">

                <h1 className="text-2xl font-bold text-black">
                  ATME College of Engineering
                </h1>

                <p className="text-gray-600">
                  Student Report — Attendance & Marks
                </p>

                <p className="font-semibold mt-1 text-black">
                  Department of {selectedStudent?.department || "CSE"}
                </p>

                <hr className="mt-4 border-gray-400" />

              </div>

              {/* STUDENT DETAILS */}

              <div className="grid grid-cols-2 gap-6 mt-6 text-sm bg-white">

                <p><b>Name:</b> {selectedStudent?.name}</p>
                <p><b>USN:</b> {selectedStudent?.usn}</p>

                <p><b>Email:</b> {selectedStudent?.email}</p>
                <p>
                  <b>Semester / Section:</b> {selectedStudent?.semester} - {selectedStudent?.section}
                </p>

              </div>

              {/* TABLE */}

              <div className="mt-6 bg-white">

                <table className="w-full border border-gray-300 text-sm bg-white">

                  <thead>

                    <tr className="bg-gray-100">

                      <th className="border p-2">Subject</th>
                      <th className="border p-2">Attended</th>
                      <th className="border p-2">%</th>

                      {tests.map((t) => (
                        <th key={t} className="border p-2">
                          {t}
                        </th>
                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {subjects.map((sub) => {

                      const att = attendanceForSubject(sub);

                      return (

                        <tr key={sub} className="bg-white">

                          <td className="border p-2">{sub}</td>

                          <td className="border p-2">
                            {att.attended}/{att.total}
                          </td>

                          <td className="border p-2">
                            {att.percent}%
                          </td>

                          {tests.map((t) => {

                            const m = marks.find(
                              (x) =>
                                x.usn === selectedUSN &&
                                x.subject === sub &&
                                x.test === t
                            );

                            return (
                              <td key={t} className="border p-2 text-center">
                                {m ? `${m.marks}/${m.maxMarks}` : "-"}
                              </td>
                            );

                          })}

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </CardContent>

      </Card>

      {/* PRINT STYLE */}

      <style>

        {`

        @media print {

          body * {
            visibility:hidden;
            background:white !important;
          }

          #pdfReport, #pdfReport * {
            visibility:visible;
            background:white !important;
          }

          #pdfReport {
            position:absolute;
            left:0;
            top:0;
            width:100%;
          }

          .no-print {
            display:none;
          }

        }

        `}

      </style>

    </div>

  );

}