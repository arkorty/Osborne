/* eslint-disable @next/next/no-page-custom-font */
import "./globals.css";
import type { Metadata } from "next";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Single:wght@400&display=swap"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
