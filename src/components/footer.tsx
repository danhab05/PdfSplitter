"use client";

import { useState, useEffect } from "react";

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="text-center mt-12 text-sm text-muted-foreground">
      {year && <p>&copy; {year} PDF Splitter. All rights reserved.</p>}
    </footer>
  );
}