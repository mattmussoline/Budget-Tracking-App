import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Licensing Budget",
  description: "Fiscal-year content licensing budget tracker",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml"
      }
    ],
    shortcut: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
