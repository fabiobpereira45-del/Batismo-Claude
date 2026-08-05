import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cadastro de Membros e Obreiros - AD Setor Tancredo Neves",
  description: "Formulário de cadastro de membros e obreiros da Igreja Assembleia de Deus Setor Tancredo Neves",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} uppercase`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}