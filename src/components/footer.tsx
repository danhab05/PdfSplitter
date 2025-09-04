"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="text-center mt-12 text-sm text-muted-foreground">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
        <p>&copy; 2025 Habib Dan. Tous droits réservés.</p>
        <Link href="/terms" className="underline hover:text-primary">
          Conditions d'utilisation
        </Link>
      </div>
    </footer>
  );
}
