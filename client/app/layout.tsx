import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Osborne",
  description: "Real-time multi-user text editor with rooms.",
  openGraph: {
    title: "Osborne",
    description: "Real-time multi-user text editor with rooms.",
    url: "https://o.webark.in",
    siteName: "Osborne",
    images: [
      {
        url: "https://o.webark.in/og-image.png",
        width: 1500,
        height: 768,
        alt: "Osborne",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
