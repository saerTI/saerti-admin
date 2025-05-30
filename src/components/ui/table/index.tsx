// src/components/ui/table/index.tsx
import { ReactNode, HTMLAttributes } from "react";

// Props for Table
interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableHeader
interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableBody
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableRow
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableCell
interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className = "", ...props }) => {
  return (
    <table 
      className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
      {...props}
    >
      {children}
    </table>
  );
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "", ...props }) => {
  return (
    <thead 
      className={`bg-gray-50 dark:bg-gray-800 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className = "", ...props }) => {
  return (
    <tbody 
      className={`bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className = "", ...props }) => {
  return (
    <tr 
      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
  colSpan,
  ...props
}) => {
  const Component = isHeader ? "th" : "td";
  
  const baseClasses = isHeader
    ? "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
    : "px-6 py-4 text-sm text-gray-900 dark:text-gray-100";
  
  return (
    <Component 
      className={`${baseClasses} ${className}`}
      colSpan={colSpan}
      {...props}
    >
      {children}
    </Component>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };