import React from 'react';
import { Button } from './Button';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (row: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl px-6 py-12 text-center">
        <h3 className="text-sm font-display font-semibold text-white">{emptyTitle}</h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto">{emptyDescription}</p>
        {emptyActionLabel && onEmptyAction && (
          <div className="mt-4">
            <Button size="sm" onClick={onEmptyAction}>
              {emptyActionLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#0D1320]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-medium text-slate-400 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors duration-100 ${
                  onRowClick ? 'hover:bg-white/[0.03] cursor-pointer' : 'hover:bg-white/[0.02]'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-slate-200 align-middle ${
                      col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {col.render(row)}
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
