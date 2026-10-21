import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Repetytorium", template: "%s · Repetytorium" },
  description: "Modułowa aplikacja do nauki z powtórkami FSRS – fiszki, quizy, ćwiczenia ze słuchu i zadania egzaminacyjne (np. chiński HSK 2).",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-dvh">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
