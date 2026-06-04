import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Licensing Budget",
  description: "Fiscal-year content licensing budget tracker"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
