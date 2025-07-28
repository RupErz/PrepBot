import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

// Set up custom fonts - Mona Sans
const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

// Set up Metadata for better SEO and UX
export const metadata: Metadata = {
  title: "PrepBot",
  description: "PrepBot uses AI to simulate real interviews, generate tailored questions, and help you master every round — from behavioral to technical.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${monaSans.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
