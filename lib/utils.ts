import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateISOToBR(dateISO: string | null | undefined): string {
  if (!dateISO) return "";
  const datePart = dateISO.split(/[T ]/)[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateISO;
}

export function calcularIdade(dataNascimento: string | null | undefined): number | "" {
  if (!dataNascimento) return "";
  const datePart = dataNascimento.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length !== 3) return "";
  
  const anoNasc = parseInt(parts[0], 10);
  const mesNasc = parseInt(parts[1], 10) - 1; // 0-indexed month
  const diaNasc = parseInt(parts[2], 10);
  
  const hoje = new Date();
  let idade = hoje.getFullYear() - anoNasc;
  const mesDiff = hoje.getMonth() - mesNasc;
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < diaNasc)) {
    idade--;
  }
  return Math.max(0, idade);
}