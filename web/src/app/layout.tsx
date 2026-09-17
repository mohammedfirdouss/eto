import type { Metadata } from "next";
import "./globals.css";
import RegisterSw from "./register-sw";

export const metadata: Metadata = {
  title: "Ẹ̀tọ́ — know the law that applies to you today",
  description:
    "Lagos tenancy rights: what the law in force says, what the pending bill proposes, and your concrete next step. Informational only — not legal advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
