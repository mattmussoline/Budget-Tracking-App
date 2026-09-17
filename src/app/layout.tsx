import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap"
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant-garamond",
  display: "swap"
});

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
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable} ${cormorantGaramond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
