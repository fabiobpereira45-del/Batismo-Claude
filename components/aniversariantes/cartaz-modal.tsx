"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Palette,
  Layers,
  Share2,
  FileText,
  Church,
  Eye
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { MemberBirthday, MESES_DO_ANO } from "@/lib/aniversariantes-helper";

interface CartazModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebrants: MemberBirthday[];
  allChurches: string[];
  initialPeriod: "dia" | "semana" | "mes";
  currentDate: Date;
  selectedChurchFilter: string;
}

type PosterTheme = "dourado-azul" | "purpura-real" | "esmeralda-nobre" | "alabastro-clean";
type PosterFormat = "a4-vertical" | "story-vertical" | "telao-horizontal";

const VERSICULOS = [
  {
    texto: '"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti, e tenha misericórdia de ti; o Senhor sobre ti levante o seu rosto e te dê a paz."',
    referencia: "Números 6:24-26"
  },
  {
    texto: '"Ensina-nos a contar os nossos dias, para que alcancemos coração sábio."',
    referencia: "Salmos 90:12"
  },
  {
    texto: '"Porque por mim se multiplicam os teus dias, e anos de vida se te acrescentarão."',
    referencia: "Provérbios 9:11"
  },
  {
    texto: '"Graças te dou, visto que por modo assombrosamente maravilhoso me formaste; as tuas obras são admiráveis, e a minha alma o sabe muito bem."',
    referencia: "Salmos 139:14"
  }
];

export default function CartazModal({
  isOpen,
  onClose,
  celebrants,
  allChurches,
  initialPeriod,
  currentDate,
  selectedChurchFilter
}: CartazModalProps) {
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">(initialPeriod);
  const [congregacaoFiltro, setCongregacaoFiltro] = useState<string>(selectedChurchFilter || "");
  const [theme, setTheme] = useState<PosterTheme>("dourado-azul");
  const [format, setFormat] = useState<PosterFormat>("a4-vertical");
  const [versiculoIdx, setVersiculoIdx] = useState<number>(0);
  const [mostrarFotos, setMostrarFotos] = useState<boolean>(true);
  const [mostrarFuncao, setMostrarFuncao] = useState<boolean>(true);
  const [mostrarCongregacao, setMostrarCongregacao] = useState<boolean>(true);
  const [tituloCustom, setTituloCustom] = useState<string>("");
  const [subtituloCustom, setSubtituloCustom] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filtragem dos membros com base no período e congregação selecionados dentro do modal
  const mesAtual = currentDate.getMonth() + 1;
  const diaAtual = currentDate.getDate();
  const nomeMesAtual = MESES_DO_ANO.find((m) => m.numero === mesAtual)?.nome || "";

  const filtrados = celebrants.filter((m) => {
    // Filtro de congregação
    if (congregacaoFiltro && m.igreja !== congregacaoFiltro) {
      return false;
    }
    // Filtro de período
    if (periodo === "dia") {
      return m.birthDay === diaAtual && m.birthMonth === mesAtual;
    }
    if (periodo === "semana") {
      return m.isEstaSemana;
    }
    if (periodo === "mes") {
      return m.birthMonth === mesAtual;
    }
    return true;
  }).sort((a, b) => a.birthDay - b.birthDay || a.nome.localeCompare(b.nome));

  // Título padrão
  const tituloPadrao =
    tituloCustom ||
    (periodo === "dia"
      ? "ANIVERSARIANTES DE HOJE"
      : periodo === "semana"
      ? "ANIVERSARIANTES DA SEMANA"
      : `ANIVERSARIANTES DE ${nomeMesAtual.toUpperCase()}`);

  const subtituloPadrao =
    subtituloCustom ||
    (congregacaoFiltro
      ? congregacaoFiltro
      : "ASSEMBLEIA DE DEUS MISSÕES • SETOR TANCREDO NEVES");

  // Configuração visual dos temas
  const themeStyles = {
    "dourado-azul": {
      bg: "bg-gradient-to-b from-[#060c1e] via-[#091533] to-[#040814]",
      border: "border-[#d4af37]",
      accent: "#d4af37",
      titleColor: "from-[#ffe8a3] via-[#e5c068] to-[#aa7d28]",
      cardBg: "bg-slate-900/80 border-[#d4af37]/30",
      avatarRing: "ring-[#d4af37]",
      badgeBg: "bg-[#d4af37]/20 text-[#f5d77f] border-[#d4af37]/40",
      textColor: "text-slate-100",
      subtextColor: "text-slate-300",
      verseBg: "bg-[#040814]/70 border-[#d4af37]/30 text-amber-200/90"
    },
    "purpura-real": {
      bg: "bg-gradient-to-b from-[#19042b] via-[#290947] to-[#120220]",
      border: "border-[#e0a96d]",
      accent: "#e0a96d",
      titleColor: "from-[#ffdfba] via-[#e0a96d] to-[#b37d46]",
      cardBg: "bg-purple-950/70 border-[#e0a96d]/30",
      avatarRing: "ring-[#e0a96d]",
      badgeBg: "bg-[#e0a96d]/20 text-[#ffdfba] border-[#e0a96d]/40",
      textColor: "text-purple-100",
      subtextColor: "text-purple-200/80",
      verseBg: "bg-[#120220]/75 border-[#e0a96d]/30 text-amber-100/90"
    },
    "esmeralda-nobre": {
      bg: "bg-gradient-to-b from-[#022319] via-[#043627] to-[#01140e]",
      border: "border-[#dfbb77]",
      accent: "#dfbb77",
      titleColor: "from-[#fff0cd] via-[#dfbb77] to-[#9e7c3b]",
      cardBg: "bg-emerald-950/70 border-[#dfbb77]/30",
      avatarRing: "ring-[#dfbb77]",
      badgeBg: "bg-[#dfbb77]/20 text-[#fff0cd] border-[#dfbb77]/40",
      textColor: "text-emerald-100",
      subtextColor: "text-emerald-200/80",
      verseBg: "bg-[#01140e]/75 border-[#dfbb77]/30 text-amber-200/90"
    },
    "alabastro-clean": {
      bg: "bg-gradient-to-b from-[#ffffff] via-[#faf8f5] to-[#f3ede2]",
      border: "border-[#b8913b]",
      accent: "#b8913b",
      titleColor: "from-[#855e10] via-[#b8913b] to-[#6d4d0b]",
      cardBg: "bg-white/95 border-[#b8913b]/30 shadow-md",
      avatarRing: "ring-[#b8913b]",
      badgeBg: "bg-[#b8913b]/15 text-[#855e10] border-[#b8913b]/40",
      textColor: "text-slate-900",
      subtextColor: "text-slate-700",
      verseBg: "bg-amber-50/80 border-[#b8913b]/30 text-slate-800"
    }
  }[theme];

  // Configurações de dimensão conforme formato
  const formatDimensions = {
    "a4-vertical": {
      width: "w-[794px]",
      minHeight: "min-h-[1123px]",
      aspect: "aspect-[1/1.414]",
      gridCols: filtrados.length <= 4 ? "grid-cols-2" : filtrados.length <= 9 ? "grid-cols-3" : "grid-cols-4",
      avatarSize: filtrados.length <= 2 ? "w-24 h-24 text-2xl" : filtrados.length <= 6 ? "w-16 h-16 text-lg" : "w-12 h-12 text-sm"
    },
    "story-vertical": {
      width: "w-[650px]",
      minHeight: "min-h-[1155px]",
      aspect: "aspect-[9/16]",
      gridCols: filtrados.length <= 4 ? "grid-cols-2" : filtrados.length <= 9 ? "grid-cols-3" : "grid-cols-3",
      avatarSize: filtrados.length <= 3 ? "w-20 h-20 text-xl" : "w-14 h-14 text-base"
    },
    "telao-horizontal": {
      width: "w-[1080px]",
      minHeight: "min-h-[608px]",
      aspect: "aspect-[16/9]",
      gridCols: filtrados.length <= 4 ? "grid-cols-4" : filtrados.length <= 8 ? "grid-cols-4" : "grid-cols-5",
      avatarSize: filtrados.length <= 4 ? "w-20 h-20 text-xl" : "w-14 h-14 text-sm"
    }
  }[format];

  // Gerar Imagem PNG
  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(posterRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      const link = document.createElement("a");
      const cleanTitle = tituloPadrao.toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.download = `cartaz_aniversariantes_${cleanTitle}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: any) {
      alert("Erro ao gerar imagem do cartaz: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Gerar PDF de Alta Qualidade
  const handleDownloadPDF = async () => {
    if (!posterRef.current) return;
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(posterRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");

      const isLandscape = format === "telao-horizontal";
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      const cleanTitle = tituloPadrao.toLowerCase().replace(/[^a-z0-9]/g, "_");
      pdf.save(`cartaz_aniversariantes_${cleanTitle}.pdf`);
    } catch (err: any) {
      alert("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Imprimir diretamente
  const handlePrint = () => {
    window.print();
  };

  // Copiar Imagem para o Clipboard
  const handleCopyImage = async () => {
    if (!posterRef.current) return;
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          // @ts-ignore
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 3000);
        } catch (e) {
          alert("Não foi possível copiar diretamente para a área de transferência no seu navegador. Você pode baixar a imagem PNG com o botão Baixar Imagem.");
        }
      });
    } catch (err: any) {
      alert("Erro ao copiar imagem: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto cartaz-modal-backdrop">
      <div className="relative w-full max-w-7xl max-h-[96vh] flex flex-col bg-[#0b0f19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-100 cartaz-modal-box">
        {/* Cabeçalho do Modal */}
        <div className="no-print p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-[1.5px] shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Estúdio de Cartaz Comemorativo
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Alta Resolução
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere cartazes refinados para mural, projeção, WhatsApp e redes sociais
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Estúdio: Painel de Controles à Esquerda e Visualização à Direita */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Painel de Controles (Scrollable) */}
          <div className="no-print w-full lg:w-96 p-4 sm:p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 bg-[#080d1a]/80 space-y-5 shrink-0">
            {/* 1. Escolha do Período */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Período dos Aniversariantes
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPeriodo("dia")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                    periodo === "dia"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Do Dia
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodo("semana")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                    periodo === "semana"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Da Semana
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodo("mes")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                    periodo === "mes"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Do Mês
                </button>
              </div>
            </div>

            {/* 2. Congregação */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Church className="w-4 h-4 text-indigo-400" />
                Congregação no Cartaz
              </label>
              <select
                value={congregacaoFiltro}
                onChange={(e) => setCongregacaoFiltro(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas as Congregações (Geral)</option>
                {allChurches.map((ig) => (
                  <option key={ig} value={ig}>
                    {ig}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Tema Visual */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-400" />
                Tema Visual
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "dourado-azul" as PosterTheme,
                    label: "Dourado & Marinho",
                    bgClass: "from-[#091533] to-[#040814] border-[#d4af37]"
                  },
                  {
                    id: "purpura-real" as PosterTheme,
                    label: "Púrpura Imperial",
                    bgClass: "from-[#290947] to-[#120220] border-[#e0a96d]"
                  },
                  {
                    id: "esmeralda-nobre" as PosterTheme,
                    label: "Esmeralda Nobre",
                    bgClass: "from-[#043627] to-[#01140e] border-[#dfbb77]"
                  },
                  {
                    id: "alabastro-clean" as PosterTheme,
                    label: "Alabastro & Ouro",
                    bgClass: "from-[#ffffff] to-[#f3ede2] text-slate-900 border-[#b8913b]"
                  }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      theme === t.id
                        ? "ring-2 ring-amber-400 shadow-md bg-white/10"
                        : "border-white/10 hover:bg-white/5 opacity-80"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${t.bgClass} border shrink-0`}
                    />
                    <span className="text-xs font-semibold truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Formato */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Formato / Proporção
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFormat("a4-vertical")}
                  className={`py-2 px-1.5 text-xs font-semibold rounded-lg transition-all ${
                    format === "a4-vertical"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mural / A4
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("story-vertical")}
                  className={`py-2 px-1.5 text-xs font-semibold rounded-lg transition-all ${
                    format === "story-vertical"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Status (9:16)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("telao-horizontal")}
                  className={`py-2 px-1.5 text-xs font-semibold rounded-lg transition-all ${
                    format === "telao-horizontal"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Telão (16:9)
                </button>
              </div>
            </div>

            {/* 5. Versículo Bíblico */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Versículo Bíblico de Bênção
              </label>
              <select
                value={versiculoIdx}
                onChange={(e) => setVersiculoIdx(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {VERSICULOS.map((v, i) => (
                  <option key={i} value={i}>
                    {v.referencia}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Opções de Exibição */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Opções de Conteúdo
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mostrarFotos}
                    onChange={(e) => setMostrarFotos(e.target.checked)}
                    className="rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Mostrar fotos dos membros</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mostrarFuncao}
                    onChange={(e) => setMostrarFuncao(e.target.checked)}
                    className="rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Mostrar Função / Cargo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mostrarCongregacao}
                    onChange={(e) => setMostrarCongregacao(e.target.checked)}
                    className="rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Mostrar Congregação no cartão</span>
                </label>
              </div>
            </div>

            {/* 7. Personalização de Textos */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Título Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder={tituloPadrao}
                  value={tituloCustom}
                  onChange={(e) => setTituloCustom(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Subtítulo / Rodapé da Instituição
                </label>
                <input
                  type="text"
                  placeholder={subtituloPadrao}
                  value={subtituloCustom}
                  onChange={(e) => setSubtituloCustom(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Área de Visualização e Renderização do Cartaz (Scrollable com zoom) */}
          <div className="flex-1 p-4 sm:p-6 overflow-auto bg-[#050811] flex flex-col items-center justify-start">
            <div className="no-print w-full flex items-center justify-between mb-3 px-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                Pré-visualização em Tempo Real ({filtrados.length} aniversariante(s) incluído(s))
              </span>
              <span className="text-[11px] text-amber-400/90 font-medium">
                Dica: O cartaz ajusta a grade automaticamente para a melhor harmonia
              </span>
            </div>

            {/* Container do Cartaz para Exportação */}
            <div className="overflow-auto max-w-full flex justify-center pb-8">
              <div
                ref={posterRef}
                id="cartaz-print-area"
                className={`relative ${formatDimensions.width} ${formatDimensions.minHeight} ${formatDimensions.aspect} ${themeStyles.bg} p-8 sm:p-10 flex flex-col justify-between border-4 ${themeStyles.border} shadow-2xl rounded-2xl select-none transition-all`}
                style={{
                  boxShadow: `0 0 45px rgba(0, 0, 0, 0.7), inset 0 0 35px rgba(212, 175, 55, 0.15)`
                }}
              >
                {/* Brilho radial de fundo para profundidade */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl opacity-60"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 18%, rgba(212,175,55,0.16), transparent 55%)"
                  }}
                />

                {/* Moldura Interna Clássica Dourada */}
                <div
                  className={`absolute inset-3 border-2 ${themeStyles.border} pointer-events-none rounded-xl opacity-75`}
                  style={{ borderStyle: "double" }}
                />
                <div
                  className={`absolute inset-[18px] border ${themeStyles.border} pointer-events-none rounded-lg opacity-30`}
                />

                {/* Cantoneiras Ornamentadas (Cantos Superiores e Inferiores) */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl-md pointer-events-none" style={{ borderColor: themeStyles.accent }} />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr-md pointer-events-none" style={{ borderColor: themeStyles.accent }} />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 rounded-bl-md pointer-events-none" style={{ borderColor: themeStyles.accent }} />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 rounded-br-md pointer-events-none" style={{ borderColor: themeStyles.accent }} />

                {/* 1. TOPO / CABEÇALHO DO CARTAZ */}
                <div className="relative z-10 text-center space-y-2.5 mb-5">
                  {/* Logo e Nome da Igreja */}
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className={`p-1.5 rounded-full border ${themeStyles.border} bg-black/10 shadow-lg`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-setor.png"
                        alt="Brasão ADMTN"
                        className="h-14 w-14 object-contain drop-shadow-md"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className={`text-[11px] font-bold tracking-[0.3em] uppercase ${themeStyles.subtextColor}`}>
                      {subtituloPadrao}
                    </p>
                    <h1
                      className={`text-2xl sm:text-4xl font-black uppercase tracking-wide bg-gradient-to-r ${themeStyles.titleColor} bg-clip-text text-transparent drop-shadow-sm px-2 leading-tight`}
                      style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                    >
                      {tituloPadrao}
                    </h1>
                    <div className="flex items-center justify-center gap-3 pt-1.5">
                      <div className="h-px w-16 sm:w-20" style={{ background: `linear-gradient(to right, transparent, ${themeStyles.accent})` }} />
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" style={{ color: themeStyles.accent }} />
                      <div className="h-px w-16 sm:w-20" style={{ background: `linear-gradient(to left, transparent, ${themeStyles.accent})` }} />
                    </div>
                  </div>
                </div>

                {/* 2. MIOLO / GRADE DOS ANIVERSARIANTES */}
                <div className="relative z-10 flex-1 my-3 flex flex-col justify-center">
                  {filtrados.length === 0 ? (
                    <div className="text-center py-12 px-6 rounded-2xl bg-black/20 border border-white/10 my-auto">
                      <Calendar className="w-12 h-12 mx-auto text-amber-400/50 mb-3" />
                      <p className={`text-base font-semibold ${themeStyles.textColor}`}>
                        Nenhum aniversariante encontrado neste período para a congregação selecionada.
                      </p>
                      <p className={`text-xs ${themeStyles.subtextColor} mt-1`}>
                        Alterne para &quot;Da Semana&quot; ou &quot;Do Mês&quot; para visualizar mais irmãos!
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`grid ${formatDimensions.gridCols} gap-3 sm:gap-4 items-center justify-center`}
                    >
                      {filtrados.map((m) => (
                        <div
                          key={m.id}
                          className={`relative pt-4 px-3 pb-3 rounded-2xl border ${themeStyles.cardBg} flex flex-col items-center text-center backdrop-blur-sm shadow-lg transition-transform overflow-hidden`}
                        >
                          {/* Brilho sutil no topo do cartão */}
                          <div
                            className="absolute inset-x-0 top-0 h-10 pointer-events-none opacity-40"
                            style={{
                              background: `linear-gradient(to bottom, ${themeStyles.accent}33, transparent)`
                            }}
                          />

                          {/* Selo do Dia comemorado */}
                          <div
                            className={`relative z-10 mb-2.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border shadow-sm ${themeStyles.badgeBg}`}
                          >
                            Dia {String(m.birthDay).padStart(2, "0")} • {MESES_DO_ANO.find((x) => x.numero === m.birthMonth)?.abreviacao}
                          </div>

                          {/* Foto ou Avatar do Membro */}
                          {mostrarFotos && (
                            <div className="relative mb-2.5">
                              <div
                                className="absolute -inset-1 rounded-full opacity-60 blur-[2px]"
                                style={{ background: `${themeStyles.accent}40` }}
                              />
                              {m.foto_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.foto_url}
                                  alt={m.nome}
                                  className={`relative ${formatDimensions.avatarSize} rounded-full object-cover ring-[3px] ring-offset-2 ring-offset-transparent ${themeStyles.avatarRing} shadow-md`}
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <div
                                  className={`relative ${formatDimensions.avatarSize} rounded-full bg-gradient-to-tr from-amber-500 to-indigo-700 flex items-center justify-center font-bold text-white shadow-md ring-[3px] ${themeStyles.avatarRing}`}
                                >
                                  {m.nome
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Nome do Membro */}
                          <h3
                            className={`relative z-10 font-black text-xs sm:text-sm tracking-tight leading-snug line-clamp-2 ${themeStyles.textColor}`}
                          >
                            {m.nome}
                          </h3>

                          {/* Função / Cargo */}
                          {mostrarFuncao && (m.cargo || m.funcao) && (
                            <p
                              className="relative z-10 text-[10px] font-semibold uppercase tracking-wide mt-1 truncate max-w-full"
                              style={{ color: themeStyles.accent }}
                            >
                              {m.funcao || m.cargo}
                            </p>
                          )}

                          {/* Congregação */}
                          {mostrarCongregacao && (
                            <p
                              className={`relative z-10 text-[9px] font-medium ${themeStyles.subtextColor} truncate max-w-full mt-0.5 opacity-80`}
                            >
                              {m.igreja}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. RODAPÉ DO CARTAZ (VERSÍCULO E ASSINATURA) */}
                <div className="relative z-10 text-center space-y-3 mt-4 pt-4">
                  {/* Separador decorativo */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${themeStyles.accent})` }} />
                    <div
                      className="w-1.5 h-1.5 rotate-45"
                      style={{ background: themeStyles.accent }}
                    />
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${themeStyles.accent})` }} />
                  </div>

                  {/* Versículo Bíblico Inspirador */}
                  <div
                    className={`relative p-4 rounded-xl border ${themeStyles.verseBg} text-center space-y-1.5`}
                  >
                    <span
                      className="absolute top-1 left-2.5 text-3xl font-serif opacity-30 leading-none select-none"
                      style={{ color: themeStyles.accent }}
                    >
                      &ldquo;
                    </span>
                    <p className="text-xs sm:text-[13px] italic font-serif leading-relaxed px-3">
                      {VERSICULOS[versiculoIdx].texto}
                    </p>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: themeStyles.accent }}
                    >
                      — {VERSICULOS[versiculoIdx].referencia}
                    </p>
                  </div>

                  {/* Mensagem e Assinatura Pastoral */}
                  <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase opacity-85 px-1 pt-1">
                    <span className={themeStyles.subtextColor}>
                      Celebração da Vida • Igreja Evangélica ADMTN
                    </span>
                    <span className="flex items-center gap-1" style={{ color: themeStyles.accent }}>
                      <Sparkles className="w-3 h-3" />
                      Pastor Setorial &amp; Liderança
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações do Modal */}
        <div className="no-print p-4 border-t border-white/10 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Total de homenageados no cartaz:{" "}
              <strong className="text-white">{filtrados.length}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copiar Imagem */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating || filtrados.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all disabled:opacity-50"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copiar Imagem</span>
                </>
              )}
            </button>

            {/* Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || filtrados.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Imprimir</span>
            </button>

            {/* Baixar PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating || filtrados.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40 transition-all disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Baixar PDF (A4)</span>
            </button>

            {/* Baixar Imagem PNG */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isGenerating || filtrados.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-950/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-950 font-bold" />
              <span>{isGenerating ? "Renderizando..." : "Baixar Imagem PNG"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
