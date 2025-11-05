"use client";
import { useEffect, useState } from "react";

export default function ClientDate({ date }: { date: number | string }) {
  const [formatted, setFormatted] = useState("");
  useEffect(() => {
    const d = typeof date === "number" ? new Date(date) : new Date(Date.parse(date));
    setFormatted(d.toLocaleString());
  }, [date]);
  return <span className="ml-2 text-xs text-gray-600">{formatted}</span>;
} 