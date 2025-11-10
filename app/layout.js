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
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}