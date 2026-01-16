"use client";
import { useEffect, useState } from "react";

export default function ClientDate({ date, options }: { date: string | number | Date, options?: Intl.DateTimeFormatOptions }) {
  const [formatted, setFormatted] = useState("");
  useEffect(() => {
    const d = new Date(date);
    setFormatted(d.toLocaleString(undefined, options));
  }, [date, options]);
  return <span className="ml-2 text-xs text-gray-600">{formatted}</span>;
} 