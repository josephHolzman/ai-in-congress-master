import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_LIVE } from "@/lib/site";
import "./globals.css";

const switzer = localFont({
  src: [
    {
      path: "../fonts/Switzer-Variable.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/Switzer-VariableItalic.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-switzer",
});

export const metadata: Metadata = {
  title: "AI in Congress",
  robots: SITE_LIVE ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={switzer.variable}>
      <body>
        <a
          href="#main"
          data-tile="ink"
          className="sr-only z-50 type-heading-h5 focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:p-stack"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
