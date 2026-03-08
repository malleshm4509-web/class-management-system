// src/components/ui/table.tsx
import React from "react";

/**
 * Table primitives that match the markup used across the project.
 *
 * Usage expected by pages:
 * <Table>
 *   <TableHeader>        // renders <thead>
 *     <TableRow>         // renders <tr>
 *       <TableHead/>     // renders <th>
 *     </TableRow>
 *   </TableHeader>
 *
 *   <TableBody>          // renders <tbody>
 *     <TableRow>         // renders <tr>
 *       <TableCell/>     // renders <td>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 */

/* Main table */
export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, className = "", ...props }) => {
  return (
    <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </table>
  );
};

/* THEAD wrapper used by pages as <TableHeader> */
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = "", ...props }) => (
  <thead className={className} {...props}>
    {children}
  </thead>
);

/* THEAD row */
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = "", ...props }) => (
  <tr className={className} {...props}>
    {children}
  </tr>
);

/* TH cell */
export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = "", ...props }) => (
  <th scope="col" className={`px-3 py-3 text-left text-sm font-semibold text-gray-700 ${className}`} {...props}>
    {children}
  </th>
);

/* TBODY wrapper used by pages as <TableBody> */
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = "", ...props }) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

/* TD cell */
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = "", ...props }) => (
  <td className={`px-3 py-2 align-top text-sm ${className}`} {...props}>
    {children}
  </td>
);

/* Default export for older imports */
export default Table;
