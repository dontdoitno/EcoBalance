import type { Metadata } from "next";
import { Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Console's named faces (Host Grotesk, Atkinson Hyperlegible Mono) have no
// Cyrillic subset on Google Fonts and the product's copy is Russian. Onest
// (full Cyrillic, a neutral/humanist UI grotesk built in the same register
// as Inter rather than a blocky geometric one) and JetBrains Mono (full
// Cyrillic, a genuinely technical/measured face) stand in for them — see
// docs/design/index.md for the substitution note.
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-outlier",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoBalance",
  description: "Расчёт углеродного следа химической продукции и отчёты CBAM",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${onest.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
