/**
 * Helper com regras de negócio e cálculo de datas para o módulo de Aniversariantes
 */

export interface MemberRecord {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone?: string;
  igreja: string;
  pastor?: string;
  cargo?: string;
  funcao?: string;
  foto_url?: string;
  bairro?: string;
}

export interface MemberBirthday extends MemberRecord {
  birthDay: number; // 1 - 31
  birthMonth: number; // 1 - 12
  birthYear: number;
  idadeQueFara: number;
  diaFormatado: string; // Ex: "14/10"
  diaExtenso: string; // Ex: "14 de Outubro"
  diasAteAniversario: number; // 0 = hoje, positivo = dias restantes
  isHoje: boolean;
  isEstaSemana: boolean;
  isEsteMes: boolean;
  diaSemanaEsteAno?: string; // Ex: "Terça-feira"
}

export const MESES_DO_ANO = [
  { numero: 1, nome: "Janeiro", abreviacao: "Jan" },
  { numero: 2, nome: "Fevereiro", abreviacao: "Fev" },
  { numero: 3, nome: "Março", abreviacao: "Mar" },
  { numero: 4, nome: "Abril", abreviacao: "Abr" },
  { numero: 5, nome: "Maio", abreviacao: "Mai" },
  { numero: 6, nome: "Junho", abreviacao: "Jun" },
  { numero: 7, nome: "Julho", abreviacao: "Jul" },
  { numero: 8, nome: "Agosto", abreviacao: "Ago" },
  { numero: 9, nome: "Setembro", abreviacao: "Set" },
  { numero: 10, nome: "Outubro", abreviacao: "Out" },
  { numero: 11, nome: "Novembro", abreviacao: "Nov" },
  { numero: 12, nome: "Dezembro", abreviacao: "Dez" },
];

export const DIAS_DA_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

/**
 * Converte data de nascimento em objeto { day, month, year }
 * Trata tanto ISO (YYYY-MM-DD) quanto BR (DD/MM/YYYY)
 */
export function parseBirthDateParts(dateStr: string | null | undefined): { day: number; month: number; year: number } | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const clean = dateStr.trim().split(/[T ]/)[0];

  // Formato YYYY-MM-DD
  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { day, month, year };
      }
    }
  }

  // Formato DD/MM/YYYY
  if (clean.includes("/")) {
    const parts = clean.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { day, month, year };
      }
    }
  }

  return null;
}

/**
 * Retorna os 7 dias da semana (de Domingo a Sábado) que englobam a data de referência
 */
export function getDaysOfWeekRange(refDate: Date = new Date()): { date: Date; day: number; month: number; year: number; dayOfWeekName: string }[] {
  const sunday = new Date(refDate);
  const dayOfWeek = sunday.getDay(); // 0 a 6
  sunday.setDate(sunday.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(sunday);
    current.setDate(sunday.getDate() + i);
    days.push({
      date: current,
      day: current.getDate(),
      month: current.getMonth() + 1,
      year: current.getFullYear(),
      dayOfWeekName: DIAS_DA_SEMANA[current.getDay()]
    });
  }
  return days;
}

/**
 * Processa um membro bruto para calcular campos de aniversário
 */
export function processMemberBirthday(member: MemberRecord, refDate: Date = new Date()): MemberBirthday | null {
  const parsed = parseBirthDateParts(member.data_nascimento);
  if (!parsed) return null;

  const { day, month, year } = parsed;
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth() + 1;
  const currentDay = refDate.getDate();

  // Idade que fará ou já fez neste ano
  let idadeQueFara = currentYear - year;
  if (idadeQueFara < 0) idadeQueFara = 0;

  const isHoje = day === currentDay && month === currentMonth;
  const isEsteMes = month === currentMonth;

  // Checagem de semana
  const weekDays = getDaysOfWeekRange(refDate);
  const isEstaSemana = weekDays.some((w) => w.day === day && w.month === month);

  // Dia da semana em que cai este ano
  const thisYearDate = new Date(currentYear, month - 1, day);
  const diaSemanaEsteAno = DIAS_DA_SEMANA[thisYearDate.getDay()];

  // Dias até o próximo aniversário
  // Se já passou este ano, calcula com relação ao próximo ano
  const todayOnlyDate = new Date(currentYear, refDate.getMonth(), refDate.getDate());
  let targetBirthday = new Date(currentYear, month - 1, day);
  if (targetBirthday < todayOnlyDate && !isHoje) {
    targetBirthday = new Date(currentYear + 1, month - 1, day);
  }
  const diffTime = targetBirthday.getTime() - todayOnlyDate.getTime();
  const diasAteAniversario = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const nomeMes = MESES_DO_ANO.find((m) => m.numero === month)?.nome || "";

  return {
    ...member,
    igreja: formatNomeIgreja(member.igreja),
    birthDay: day,
    birthMonth: month,
    birthYear: year,
    idadeQueFara,
    diaFormatado: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    diaExtenso: `${day} de ${nomeMes}`,
    diasAteAniversario: isHoje ? 0 : diasAteAniversario,
    isHoje,
    isEstaSemana,
    isEsteMes,
    diaSemanaEsteAno
  };
}

/**
 * Normaliza o nome da congregação/igreja removendo a antiga sigla ADMTN
 * e padronizando para AD Setor T. Neves ou Assembléia de Deus Setor Tancredo Neves
 */
export function formatNomeIgreja(igreja?: string | null): string {
  if (!igreja || !igreja.trim()) {
    return "Assembléia de Deus Setor Tancredo Neves";
  }

  let limpo = igreja.trim();

  // Se for apenas a sigla isolada
  if (/^ADMTN$/i.test(limpo)) {
    return "Assembléia de Deus Setor Tancredo Neves";
  }

  // Substitui "ADMTN - " no início por "AD Setor T. Neves - "
  limpo = limpo.replace(/^ADMTN\s*[-–—]\s*/i, "AD Setor T. Neves - ");

  // Qualquer outra menção isolada à sigla ADMTN
  limpo = limpo.replace(/\bADMTN\b/gi, "AD Setor T. Neves");

  return limpo;
}

/**
 * Mensagem carinhosa e abençoada para envio no WhatsApp
 */
export function getBirthdayWhatsAppMessage(
  nome: string,
  igreja?: string,
  pastor?: string
): string {
  const nomeIgrejaLimpo = formatNomeIgreja(igreja);
  const saudacaoIgreja = nomeIgrejaLimpo
    ? ` de toda a família ${nomeIgrejaLimpo}`
    : " da Assembléia de Deus Setor Tancredo Neves";

  return `A paz do Senhor Jesus, ${nome}! 🎂🎉\n\nNeste dia tão especial, queremos expressar nossa alegria e gratidão a Deus pela sua vida! Em nome da liderança${saudacaoIgreja}, desejamos a você um Feliz Aniversário abençoado!\n\n"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti, e tenha misericórdia de ti; o Senhor sobre ti levante o seu rosto e te dê a paz." (Números 6:24-26)\n\nQue este novo ciclo seja repleto de graça, saúde, paz e conquistas no Senhor! Parabéns! ✨`;
}

