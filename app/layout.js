import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ProfSight",
  description:
    "We help students find the best professors for their courses using AI-driven insights and comprehensive reviews. Discover top-rated professors tailored to your needs and excel in your academic journey",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
