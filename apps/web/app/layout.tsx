import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoBalance",
  description: "Расчёт и снижение углеродного следа химической продукции",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
