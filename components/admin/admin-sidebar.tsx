"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  IdCard,
  Map,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isMaster, signOut } = useAuth();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const navItems = [
    {
      label: "Painel Geral",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: "Membros & Inscrições",
      href: "/admin/inscricoes",
      icon: Users,
      badge: null
    },
    {
      label: "Carteira de Membros",
      href: "/admin/carteira",
      icon: IdCard,
      badge: "Novo"
    },
    {
      label: "Mapa Salvador",
      href: "/admin/mapa",
      icon: Map,
      badge: "Novo"
    },
    {
      label: "Estatísticas",
      href: "/admin/estatisticas",
      icon: BarChart3,
      badge: null
    },
    ...(isMaster
      ? [
          {
            label: "Gestão de Acessos",
            href: "/admin/usuarios",
            icon: ShieldCheck,
            badge: "Master"
          }
        ]
      : [])
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b0f19] text-slate-100 border-r border-white/10 select-none">
      {/* Top Brand */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              ADMTN <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">PRO</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              Gestão Eclesiástica
            </p>
          </div>
        </Link>

        {/* Botão fechar no mobile */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Fechar Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Menu Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpenMobile(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/80 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badge === "Master"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
              </div>
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Acesso Externo
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-emerald-400" />
            <span>Formulário de Cadastro</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Público
          </span>
        </Link>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10 bg-[#070a12]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.email || "Usuário"}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isMaster ? "bg-amber-400" : "bg-indigo-400"
                  }`}
                />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {isMaster ? "Master Admin" : "Acesso Padrão"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Bar Mobile (Trigger) */}
      <div className="lg:hidden no-print sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0b0f19] border-b border-white/10 text-white">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpenMobile(true)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/5 border border-white/10"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm tracking-tight">ADMTN Painel</span>
        </div>

        <button
          onClick={handleLogout}
          title="Sair"
          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Sidebar (Fixo) */}
      <aside className="no-print hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Modal Lateral) */}
      {isOpenMobile && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
