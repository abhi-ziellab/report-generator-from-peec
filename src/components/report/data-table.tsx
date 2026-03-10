"use client";

import type { ReactNode } from "react";
import { CLASSIFICATION_COLORS } from "@/components/charts/chart-colors";

export type CellValue = string | ReactNode;

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: CellValue[][];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--peec-text-muted)] py-2">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="print-break-inside-avoid">
          <tr className="border-b border-[var(--peec-text)]" style={{ borderBottomWidth: "1px" }}>
            <th
              className="px-2.5 py-2 text-left font-semibold text-[var(--peec-text-muted)] text-[10px] uppercase tracking-widest w-8"
              style={{ letterSpacing: "0.1em" }}
            >
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-2.5 py-2 text-left font-semibold text-[var(--peec-text-muted)] text-[10px] uppercase tracking-widest"
                style={{ letterSpacing: "0.1em" }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--peec-border-light)] last:border-b-0 hover:bg-[var(--peec-bg)] transition-colors"
            >
              <td className="px-2.5 py-2 text-[var(--peec-text-muted)] text-[10px] tabular-nums">
                {i + 1}
              </td>
              {row.map((cell, j) => (
                <td key={j} className="px-2.5 py-2 text-[var(--peec-text)]">
                  {typeof cell === "string" ? renderCell(cell, columns[j]) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Render classification cells as colored badges, delta cells with color */
function renderCell(value: string, column: string) {
  // Classification badge
  if (column === "Classification" || column === "Type") {
    const upper = value.toUpperCase();
    const colors = CLASSIFICATION_COLORS[upper];
    if (colors) {
      return (
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {value}
        </span>
      );
    }
  }

  // Delta column — color positive green, negative red
  if (column?.startsWith("Δ") || column?.startsWith("Delta")) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const color = num > 0.01 ? "var(--peec-success)" : num < -0.01 ? "var(--peec-error)" : "var(--peec-text-muted)";
      const arrow = num > 0.01 ? "↗" : num < -0.01 ? "↘" : "↔";
      return (
        <span className="font-medium text-[10px] tabular-nums" style={{ color }}>
          {arrow} {value}
        </span>
      );
    }
  }

  return value;
}
