"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

const PRINT_WIDTH = 680; // px — fits A4 with margins
const PRINT_HEIGHT_DEFAULT = 300;

interface PrintSafeChartProps {
  children: ReactNode;
  height?: number;
  className?: string;
}

export function PrintSafeChart({
  children,
  height = PRINT_HEIGHT_DEFAULT,
  className = "",
}: PrintSafeChartProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("print");
    const handler = (e: MediaQueryListEvent) => setIsPrinting(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (isPrinting) {
    return (
      <div
        className={`print-break-inside-avoid ${className}`}
        style={{ width: PRINT_WIDTH, height }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`print-break-inside-avoid ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
