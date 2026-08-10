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

export function isValidBRDate(dateBR: string | null | undefined): boolean {
  if (!dateBR || typeof dateBR !== "string") return false;
  const parts = dateBR.split("/");
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

  // Ano deve ter 4 dígitos e estar dentro de um intervalo válido (1900 a 2100)
  if (parts[2].length !== 4 || year < 1900 || year > 2100) return false;

  // Mês deve ser de 1 a 12
  if (month < 1 || month > 12) return false;

  // Validação dos dias do mês (considera ano bissexto)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

export function parseDateBRToISO(dateBR: string | null | undefined): string {
  if (!dateBR) return "";
  
  // Se já estiver no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateBR)) {
    return dateBR;
  }

  const parts = dateBR.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateBR;
}