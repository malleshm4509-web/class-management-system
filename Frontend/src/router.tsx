import { createBrowserRouter } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Home";
import Students from "@/pages/Students";
import Attendance from "@/pages/Attendance";
import Marks from "@/pages/Marks";
import Reports from "@/pages/Reports";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "students", element: <Students /> },
      { path: "attendance", element: <Attendance /> },
      { path: "marks", element: <Marks /> },
      { path: "reports", element: <Reports /> },
    ],
  },
]);

export default router;
