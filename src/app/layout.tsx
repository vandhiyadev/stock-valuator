import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Stock Valuator | Professional Stock Analysis",
  description: "Production-grade stock valuation tool with DCF, earnings multiples, technical analysis, and fundamental scoring.",
  keywords: ["stock analysis", "DCF valuation", "stock valuation", "intrinsic value", "margin of safety"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
