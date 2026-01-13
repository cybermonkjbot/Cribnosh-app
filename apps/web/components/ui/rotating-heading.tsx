"use client";
import { useEffect, useState } from "react";

const headings = [
  {
    text: [
      { value: "Dreamt of it? ", highlight: false },
      { value: "Cribnosh does it.", highlight: true }
    ]
  },
  {
    text: [
      { value: "Crave it? ", highlight: false },
      { value: "Cribnosh delivers.", highlight: true }
    ]
  },
  {
    text: [
      { value: "Imagine it? ", highlight: false },
      { value: "Cribnosh makes it real.", highlight: true }
    ]
  },
  {
    text: [
      { value: "Wish for it? ", highlight: false },
      { value: "Cribnosh brings it home.", highlight: true }
    ]
  },
  {
    text: [
      { value: "Need it? ", highlight: false },
      { value: "Cribnosh has you covered.", highlight: true }
    ]
  }
];

/**
 * Displays a heading that cycles through predefined text segments, highlighting specified parts.
 *
 * The heading updates every 2.5 seconds, looping through a set of headings. Highlighted text segments receive a customizable CSS class.
 *
 * @param className - Optional CSS class for the container element
 * @param highlightClassName - Optional CSS class for highlighted text segments
 */
export interface RotatingHeadingProps {
  className?: string;
  highlightClassName?: string;
  items?: typeof headings;
}

export function RotatingHeading({ className = "", highlightClassName = "text-[#ff3b30]", items = headings }: RotatingHeadingProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <span className={className}>
      {items[index].text.map((part, i) =>
        part.highlight ? (
          <span key={i} className={highlightClassName}>{part.value}</span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  );
}
