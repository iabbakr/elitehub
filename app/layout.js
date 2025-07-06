import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // this will be used in Tailwind
  display: "swap",
});

export const metadata = {
  title: "elitehub",
  description: "e-commerce",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en className={inter.variable}">
      <body
        className="bg-background text-foreground font-sans"
      >
        {children}
      </body>
    </html>
  );
}
