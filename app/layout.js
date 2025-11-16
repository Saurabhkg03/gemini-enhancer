import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gemini Enhancer",
  description: "Enhance educational content with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ADDED THIS LINK for KaTeX CSS */}
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
          crossOrigin="anonymous" 
        />
      </head>
      {/* Add suppressHydrationWarning to the body tag as well */}
      <body 
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}