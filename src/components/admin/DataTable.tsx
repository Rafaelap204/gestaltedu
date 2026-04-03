"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-gray-50 border-b border-brand-gray-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider"
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-100">
              {Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <Skeleton variant="text" width="80%" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm">
        <EmptyState
          icon={Inbox}
          title={emptyMessage}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-gray-50 border-b border-brand-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray-100">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={`hover:bg-brand-gray-50 transition-colors duration-150 ${
                  index % 2 === 1 ? "bg-brand-gray-25" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 text-sm text-brand-gray-900 whitespace-nowrap"
                  >
                    {col.render
                      ? col.render(item)
                      : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple table without complex features for smaller use cases
interface SimpleTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function SimpleTable({ headers, children }: SimpleTableProps) {
  return (
    <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-gray-50 border-b border-brand-gray-200">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
