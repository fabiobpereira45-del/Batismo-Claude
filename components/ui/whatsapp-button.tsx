"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp-helper";

interface WhatsAppButtonProps {
  telefone?: string;
  nome?: string;
  igreja?: string;
  variant?: "icon" | "full" | "sm";
  className?: string;
}

export default function WhatsAppButton({
  telefone,
  nome,
  igreja,
  variant = "icon",
  className = "",
}: WhatsAppButtonProps) {
  const url = telefone ? getWhatsAppUrl(telefone, nome, igreja) : null;

  if (!url) {
    return null;
  }

  if (variant === "full") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Conversar com ${nome || "o membro"} no WhatsApp`}
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <MessageCircle className="w-4 h-4 text-white shrink-0 fill-white/20" />
        <span>WhatsApp</span>
      </a>
    );
  }

  if (variant === "sm") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Conversar no WhatsApp (${telefone})`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all ${className}`}
      >
        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-emerald-400/20" />
        <span>WhatsApp</span>
      </a>
    );
  }

  // variant === 'icon'
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Conversar com ${nome || "o membro"} no WhatsApp (${telefone})`}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 shadow-sm ${className}`}
    >
      <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
    </a>
  );
}
