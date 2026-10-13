"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Cake,
  Calendar,
  CalendarDays,
  CalendarRange,
  Users,
  Search,
  Filter,
  Church,
  Sparkles,
  Phone,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  LayoutGrid,
  List,
  Gift,
  HeartHandshake,
  Download,
  Flame,
  Clock
} from "lucide-react";
import {
  MemberRecord,
  MemberBirthday,
  MESES_DO_ANO,
  DIAS_DA_SEMANA,
  processMemberBirthday,
  getDaysOfWeekRange,
  getBirthdayWhatsAppMessage,
  parseBirthDateParts
} from "@/lib/aniversariantes-helper";
import CartazModal from "@/components/aniversariantes/cartaz-modal";

type PeriodTab = "dia" | "semana" | "mes" | "ano";

export default function AdminAniversariantesPage() {
  const [members, setMembers] = useState<MemberBirthday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Período selecionado
  const [activeTab, setActiveTab] = useState<PeriodTab>("mes");

  // Filtros
  const [filtroIgreja, setFiltroIgreja] = useState<string>("");
  const [filtroFuncao, setFiltroFuncao] = useState<string>("");
  const [busca, setBusca] = useState<string>("");

  // Sub-filtros por período
  const hoje = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(hoje.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState<number>(hoje.getDate()); // 1-31
  const [selectedDayMonth, setSelectedDayMonth] = useState<number>(hoje.getMonth() + 1);
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = esta semana, +1 próxima, -1 anterior

  // Modo de visualização (grade ou lista)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal de Cartaz Comemorativo
  const [isCartazOpen, setIsCartazOpen] = useState<boolean>(false);

  // Notificação de cópia de mensagem WhatsApp
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Carregar dados de todos os membros do banco de dados
  const loadMembers = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("inscricoes_batismo")
        .select("id, nome, cpf, data_nascimento, telefone, igreja, pastor, cargo, funcao, foto_url, bairro")
        .order("nome", { ascending: true });

      if (error) throw error;

      if (data) {
        const processed = data
          .map((m: any) => processMemberBirthday(m as MemberRecord, hoje))
          .filter((m): m is MemberBirthday => m !== null);
        setMembers(processed);
      }
    } catch (err: any) {
      console.error("Erro ao carregar membros para aniversariantes:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Extrair listas únicas de igrejas e funções para os selects de filtros
  const igrejasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.igreja && m.igreja.trim()) set.add(m.igreja.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  const funcoesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.funcao && m.funcao.trim()) set.add(m.funcao.trim());
      if (m.cargo && m.cargo.trim()) set.add(m.cargo.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  // Cálculo da semana selecionada com offset
  const selectedWeekDays = useMemo(() => {
    const refDate = new Date(hoje);
    refDate.setDate(hoje.getDate() + weekOffset * 7);
    return getDaysOfWeekRange(refDate);
  }, [hoje, weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return "Esta Semana";
    if (weekOffset === 1) return "Próxima Semana";
    if (weekOffset === -1) return "Semana Passada";
    const start = selectedWeekDays[0];
    const end = selectedWeekDays[6];
    return `${start.day}/${start.month} a ${end.day}/${end.month}`;
  }, [weekOffset, selectedWeekDays]);

  // Aniversariantes de Hoje para estatísticas rápidas
  const aniversariantesHoje = useMemo(() => {
    return members.filter((m) => m.isHoje);
  }, [members]);

  const aniversariantesEstaSemana = useMemo(() => {
    return members.filter((m) => m.isEstaSemana);
  }, [members]);

  const aniversariantesEsteMes = useMemo(() => {
    return members.filter((m) => m.isEsteMes);
  }, [members]);

  // Filtragem dos membros com base na aba de período, busca e seletores
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Filtro de Congregação
      if (filtroIgreja && m.igreja !== filtroIgreja) return false;

      // 2. Filtro de Função / Cargo
      if (filtroFuncao && m.funcao !== filtroFuncao && m.cargo !== filtroFuncao) {
        return false;
      }

      // 3. Busca por texto
      if (busca) {
        const q = busca.toLowerCase();
        const matchNome = m.nome.toLowerCase().includes(q);
        const matchIgreja = m.igreja?.toLowerCase().includes(q);
        const matchTelefone = m.telefone?.includes(q);
        const matchCargo = m.cargo?.toLowerCase().includes(q) || m.funcao?.toLowerCase().includes(q);
        if (!matchNome && !matchIgreja && !matchTelefone && !matchCargo) return false;
      }

      // 4. Período
      if (activeTab === "dia") {
        return m.birthDay === selectedDay && m.birthMonth === selectedDayMonth;
      }

      if (activeTab === "semana") {
        return selectedWeekDays.some(
          (w) => w.day === m.birthDay && w.month === m.birthMonth
        );
      }

      if (activeTab === "mes") {
        return m.birthMonth === selectedMonth;
      }

      if (activeTab === "ano") {
        // Mostra todos do ano (todos os membros válidos)
        return true;
      }

      return true;
    }).sort((a, b) => {
      if (activeTab === "ano" || activeTab === "mes") {
        // Ordena por mês e depois por dia
        if (a.birthMonth !== b.birthMonth) return a.birthMonth - b.birthMonth;
        return a.birthDay - b.birthDay;
      }
      if (activeTab === "semana") {
        return a.birthDay - b.birthDay;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [
    members,
    activeTab,
    selectedDay,
    selectedDayMonth,
    selectedMonth,
    selectedWeekDays,
    filtroIgreja,
    filtroFuncao,
    busca
  ]);

  // Agrupamento para a visualização anual (Ano)
  const groupedByMonth = useMemo(() => {
    if (activeTab !== "ano") return {};
    const map: Record<number, MemberBirthday[]> = {};
    for (let i = 1; i <= 12; i++) map[i] = [];
    filteredMembers.forEach((m) => {
      if (!map[m.birthMonth]) map[m.birthMonth] = [];
      map[m.birthMonth].push(m);
    });
    return map;
  }, [filteredMembers, activeTab]);

  // Copiar mensagem para o WhatsApp
  const handleCopyMessage = (m: MemberBirthday) => {
    const text = getBirthdayWhatsAppMessage(m.nome, m.igreja, m.pastor);
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. TOPO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 p-[1.5px] shadow-lg shadow-pink-500/20">
              <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center">
                <Cake className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Aniversariantes
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                  {members.length} cadastrados
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Acompanhe e celebre a vida de cada irmão com felicitações e cartazes oficiais
              </p>
            </div>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Atualizar */}
          <button
            onClick={loadMembers}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          {/* Botão Principal: Gerar Bonito Cartaz */}
          <button
            onClick={() => setIsCartazOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
            <span>Gerar Cartaz Comemorativo</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE RESUMO E DESTAQUES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card Hoje */}
        <div
          onClick={() => {
            setActiveTab("dia");
            setSelectedDay(hoje.getDate());
            setSelectedDayMonth(hoje.getMonth() + 1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === "dia" && selectedDay === hoje.getDate()
              ? "bg-gradient-to-br from-pink-950/60 to-purple-950/60 border-pink-500/50 ring-2 ring-pink-500/30 shadow-lg"
              : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
          }`}
        >
          {aniversariantesHoje.length > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white animate-pulse">
              <PartyPopper className="w-3 h-3" /> Hoje!
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Aniversário Hoje</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {aniversariantesHoje.length}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-pink-400/90 mt-2 font-medium">
            {aniversariantesHoje.length > 0
              ? `${aniversariantesHoje[0].nome.split(" ")[0]} e outros irmãos`
              : "Nenhum no dia de hoje"}
          </p>
        </div>

        {/* Card Esta Semana */}
        <div
          onClick={() => {
            setActiveTab("semana");
            setWeekOffset(0);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === "semana" && weekOffset === 0
              ? "bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500/50 ring-2 ring-indigo-500/30 shadow-lg"
              : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Nesta Semana</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {aniversariantesEstaSemana.length}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-indigo-400/90 mt-2 font-medium">
            Domingo a Sábado
          </p>
        </div>

        {/* Card Este Mês */}
        <div
          onClick={() => {
            setActiveTab("mes");
            setSelectedMonth(hoje.getMonth() + 1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === "mes" && selectedMonth === hoje.getMonth() + 1
              ? "bg-gradient-to-br from-purple-950/60 to-amber-950/60 border-purple-500/50 ring-2 ring-purple-500/30 shadow-lg"
              : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Neste Mês</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {aniversariantesEsteMes.length}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-purple-400/90 mt-2 font-medium">
            Mês de {MESES_DO_ANO.find((m) => m.numero === hoje.getMonth() + 1)?.nome}
          </p>
        </div>

        {/* Card Total Cadastrados */}
        <div
          onClick={() => setActiveTab("ano")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === "ano"
              ? "bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-500/50 ring-2 ring-amber-500/30 shadow-lg"
              : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Visão Anual</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {members.length}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-amber-400/90 mt-2 font-medium">
            Todos os 12 meses
          </p>
        </div>
      </div>

      {/* 3. ALERTA COMEMORATIVO SE HOUVER ANIVERSARIANTES HOJE */}
      {aniversariantesHoje.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-900/40 via-purple-900/30 to-amber-900/40 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-pink-950/20">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 p-[2px] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <PartyPopper className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                Hoje temos {aniversariantesHoje.length} aniversariante(s) especial(is)!
                <span className="text-xs font-normal text-pink-300">🎉</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Não deixe passar em branco: envie felicitações pastoral ou gere um lindo cartaz para homenageá-los.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab("dia");
              setSelectedDay(hoje.getDate());
              setSelectedDayMonth(hoje.getMonth() + 1);
              setIsCartazOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-400 text-white shadow-md shadow-pink-950/50 transition-all shrink-0"
          >
            Gerar Cartaz de Hoje
          </button>
        </div>
      )}

      {/* 4. BARRA DE SELEÇÃO DE PERÍODO (DIA, SEMANA, MÊS, ANO) E CONTROLES */}
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Abas Superiores de Período */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab("dia")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "dia"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Por Dia</span>
            </button>

            <button
              onClick={() => setActiveTab("semana")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "semana"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Por Semana</span>
            </button>

            <button
              onClick={() => setActiveTab("mes")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "mes"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Por Mês</span>
            </button>

            <button
              onClick={() => setActiveTab("ano")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "ano"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Por Ano</span>
            </button>
          </div>

          {/* Alternador de Modo de Visualização (Grade vs Tabela) */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg border transition-all ${
                viewMode === "grid"
                  ? "bg-white/10 text-white border-white/20"
                  : "text-slate-400 hover:text-white border-transparent"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg border transition-all ${
                viewMode === "table"
                  ? "bg-white/10 text-white border-white/20"
                  : "text-slate-400 hover:text-white border-transparent"
              }`}
              title="Visualização em Lista / Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-controles do Período Específico */}
        {activeTab === "dia" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(hoje.getDate());
                  setSelectedDayMonth(hoje.getMonth() + 1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedDay === hoje.getDate() && selectedDayMonth === hoje.getMonth() + 1
                    ? "bg-pink-600 text-white border-pink-500 shadow"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
              >
                Hoje ({String(hoje.getDate()).padStart(2, "0")}/{String(hoje.getMonth() + 1).padStart(2, "0")})
              </button>

              <button
                type="button"
                onClick={() => {
                  const amanhã = new Date(hoje);
                  amanhã.setDate(hoje.getDate() + 1);
                  setSelectedDay(amanhã.getDate());
                  setSelectedDayMonth(amanhã.getMonth() + 1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedDay === hoje.getDate() + 1 && selectedDayMonth === hoje.getMonth() + 1
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
              >
                Amanhã
              </button>
            </div>

            {/* Seletor Manual de Dia e Mês */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Dia específico:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {String(d).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <select
                value={selectedDayMonth}
                onChange={(e) => setSelectedDayMonth(Number(e.target.value))}
                className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {MESES_DO_ANO.map((m) => (
                  <option key={m.numero} value={m.numero}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "semana" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white px-2">
                {weekLabel}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="text-[11px] text-indigo-400 hover:underline ml-2"
                >
                  Voltar para Esta Semana
                </button>
              )}
            </div>

            {/* Dias da semana em badges */}
            <div className="flex flex-wrap items-center gap-1">
              {selectedWeekDays.map((w) => {
                const isTodayBadge =
                  w.day === hoje.getDate() && w.month === hoje.getMonth() + 1;
                return (
                  <div
                    key={w.dayOfWeekName}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                      isTodayBadge
                        ? "bg-pink-500/20 text-pink-300 border-pink-500/40"
                        : "bg-white/5 text-slate-400 border-white/10"
                    }`}
                  >
                    {w.dayOfWeekName.substring(0, 3)}: {w.day}/{w.month}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "mes" && (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {MESES_DO_ANO.map((m) => {
              const isSelected = selectedMonth === m.numero;
              const isCurrent = hoje.getMonth() + 1 === m.numero;
              // Contar quantos aniversariantes tem nesse mês
              const countInMonth = members.filter((x) => x.birthMonth === m.numero).length;

              return (
                <button
                  key={m.numero}
                  type="button"
                  onClick={() => setSelectedMonth(m.numero)}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50 ring-1 ring-white/30"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                  }`}
                >
                  <p className="text-xs font-bold">{m.abreviacao}</p>
                  <span
                    className={`text-[10px] font-medium block mt-0.5 ${
                      isSelected
                        ? "text-indigo-200"
                        : isCurrent
                        ? "text-pink-400 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {countInMonth} {countInMonth === 1 ? "aniv." : "aniv."}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 5. LINHA DE FILTROS: CONGREGAÇÃO, FUNÇÃO E BUSCA */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filtro de Congregação */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Church className="w-3.5 h-3.5 text-indigo-400" />
              Filtrar por Congregação
            </label>
            <select
              value={filtroIgreja}
              onChange={(e) => setFiltroIgreja(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas as Congregações ({igrejasDisponiveis.length})</option>
              {igrejasDisponiveis.map((ig) => (
                <option key={ig} value={ig}>
                  {ig}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Função / Cargo */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              Filtrar por Função / Cargo
            </label>
            <select
              value={filtroFuncao}
              onChange={(e) => setFiltroFuncao(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas as Funções ({funcoesDisponiveis.length})</option>
              {funcoesDisponiveis.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Busca Livre */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              Buscar por Nome ou Telefone
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: João Silva, pastor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumo da Contagem com Filtros Ativos */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>
            Exibindo <strong>{filteredMembers.length}</strong> aniversariante(s) correspondente(s)
          </span>

          {(filtroIgreja || filtroFuncao || busca) && (
            <button
              onClick={() => {
                setFiltroIgreja("");
                setFiltroFuncao("");
                setBusca("");
              }}
              className="text-xs text-indigo-400 hover:underline font-medium"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      </div>

      {/* 6. LISTAGEM DOS ANIVERSARIANTES */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Carregando aniversariantes dos membros...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Cake className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum aniversariante encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não há aniversariantes cadastrados para os critérios e filtros selecionados. Tente alterar o período, congregação ou remover filtros.
          </p>
        </div>
      ) : activeTab === "ano" ? (
        /* VISÃO ANUAL EM GRUPOS DE MESES */
        <div className="space-y-6">
          {MESES_DO_ANO.map((mes) => {
            const list = groupedByMonth[mes.numero] || [];
            if (list.length === 0) return null;

            return (
              <div
                key={mes.numero}
                className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {mes.numero}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {mes.nome}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {list.length} aniversariante(s) neste mês
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("mes");
                      setSelectedMonth(mes.numero);
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Ver detalhes do mês →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {list.map((m) => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      onCopy={() => handleCopyMessage(m)}
                      isCopied={copiedId === m.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "grid" ? (
        /* VISÃO EM GRADE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredMembers.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onCopy={() => handleCopyMessage(m)}
              isCopied={copiedId === m.id}
            />
          ))}
        </div>
      ) : (
        /* VISÃO EM TABELA / LISTA */
        <div className="bg-[#0b0f19] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-3 sm:p-4">Membro</th>
                  <th className="p-3 sm:p-4">Data do Aniversário</th>
                  <th className="p-3 sm:p-4">Congregação</th>
                  <th className="p-3 sm:p-4">Função / Cargo</th>
                  <th className="p-3 sm:p-4">Telefone</th>
                  <th className="p-3 sm:p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredMembers.map((m) => {
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-white/[0.04] transition-colors ${
                        m.isHoje ? "bg-pink-950/20" : ""
                      }`}
                    >
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          {m.foto_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.foto_url}
                              alt={m.nome}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0">
                              {m.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {m.nome}
                              {m.isHoje && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500 text-white font-black animate-pulse">
                                  HOJE!
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Completando {m.idadeQueFara} anos
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4">
                        <span className="font-semibold text-white">
                          {m.diaExtenso}
                        </span>
                        {m.diaSemanaEsteAno && (
                          <span className="block text-[11px] text-slate-400">
                            {m.diaSemanaEsteAno}
                          </span>
                        )}
                      </td>

                      <td className="p-3 sm:p-4 font-medium text-slate-300">
                        {m.igreja}
                      </td>

                      <td className="p-3 sm:p-4 font-medium text-amber-400">
                        {m.funcao || m.cargo || "—"}
                      </td>

                      <td className="p-3 sm:p-4 font-mono text-slate-300">
                        {m.telefone || "Não informado"}
                      </td>

                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.telefone && (
                            <a
                              href={`https://wa.me/55${m.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                getBirthdayWhatsAppMessage(m.nome, m.igreja, m.pastor)
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                              title="Enviar parabéns no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                            title="Copiar mensagem de felicitação"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. MODAL DE CRIAÇÃO DO CARTAZ COMEMORATIVO */}
      <CartazModal
        isOpen={isCartazOpen}
        onClose={() => setIsCartazOpen(false)}
        celebrants={members}
        allChurches={igrejasDisponiveis}
        initialPeriod={activeTab === "ano" ? "mes" : activeTab}
        currentDate={hoje}
        selectedChurchFilter={filtroIgreja}
      />
    </div>
  );
}

/**
 * Componente do Card de Aniversariante Individual
 */
function MemberCard({
  member,
  onCopy,
  isCopied
}: {
  member: MemberBirthday;
  onCopy: () => void;
  isCopied: boolean;
}) {
  const whatsappUrl = member.telefone
    ? `https://wa.me/55${member.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
        getBirthdayWhatsAppMessage(member.nome, member.igreja, member.pastor)
      )}`
    : null;

  return (
    <div
      className={`group relative p-4 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
        member.isHoje
          ? "bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-slate-900 border-pink-500/40 shadow-lg shadow-pink-950/30 ring-1 ring-pink-500/30"
          : "bg-[#0f172a]/80 hover:bg-[#131c33] border-white/10 hover:border-white/20"
      }`}
    >
      {/* Selo Destaque Hoje */}
      {member.isHoje && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-slate-950 shadow animate-pulse">
          <PartyPopper className="w-3 h-3 text-slate-950" />
          HOJE!
        </div>
      )}

      <div>
        {/* Cabeçalho do Card: Foto e Dados Básicos */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {member.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.foto_url}
                alt={member.nome}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-indigo-400 transition-all shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-[1.5px] shadow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-white text-base">
                  {member.nome.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-sm truncate leading-snug">
              {member.nome}
            </h3>

            {(member.funcao || member.cargo) && (
              <p className="text-[11px] font-semibold text-amber-400 truncate mt-0.5">
                {member.funcao || member.cargo}
              </p>
            )}

            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {member.igreja}
            </p>
          </div>
        </div>

        {/* Detalhes do Aniversário */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <Gift className="w-4 h-4 text-pink-400" />
            <span>{member.diaExtenso}</span>
          </div>

          <span className="text-[11px] font-bold text-indigo-300 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30">
            {member.idadeQueFara} anos
          </span>
        </div>

        {member.diaSemanaEsteAno && (
          <p className="text-[10px] text-slate-400 mt-1">
            Cai em um(a) {member.diaSemanaEsteAno}
          </p>
        )}
      </div>

      {/* Ações: WhatsApp e Copiar Mensagem */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Parabenizar</span>
          </a>
        ) : (
          <span className="flex-1 text-center py-1.5 text-[11px] text-slate-400 italic">
            Sem telefone
          </span>
        )}

        <button
          type="button"
          onClick={onCopy}
          title="Copiar mensagem pastoral"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
