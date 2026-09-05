/**
 * Utilitários para formatação e direcionamento para o WhatsApp
 */

export function formatWhatsAppNumber(phone: string): string | null {
  if (!phone) return null;

  // Remove tudo que não for dígito
  const digits = phone.replace(/\D/g, "");

  if (!digits) return null;

  // Celular brasileiro com DDD (10 ou 11 dígitos, ex: 71999998888 ou 7199998888)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se já possui DDI 55 (12 ou 13 dígitos)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }

  // Retorna dígitos se for outro formato internacional válido (> 8 dígitos)
  if (digits.length >= 8) {
    return digits;
  }

  return null;
}

export function getWhatsAppUrl(
  phone: string,
  nome?: string,
  igreja?: string
): string | null {
  const formatted = formatWhatsAppNumber(phone);
  if (!formatted) return null;

  let message = "Olá!";
  if (nome && igreja) {
    message = `Olá, ${nome}! Entramos em contato a respeito do seu cadastro na ${igreja}.`;
  } else if (nome) {
    message = `Olá, ${nome}! Entramos em contato a respeito do seu cadastro de membro.`;
  }

  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}
