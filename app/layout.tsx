import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import "./themes.css";

export const metadata: Metadata = {
  title: "PokéTable — Pokémon TCG with friends",
  description:
    "Pull up a chair. Play Pokémon TCG with friends, build your own decks, and explore 20,444 English cards. Multiplayer powered by VibiNet.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
