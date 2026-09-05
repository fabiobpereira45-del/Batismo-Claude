"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  IdCard,
  Search,
  Printer,
  Download,
  Upload,
  Palette,
  CheckCircle2,
  Users,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  FileText,
  AlertCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface MemberCardData {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento?: string;
  data_batismo?: string;
  telefone?: string;
  igreja: string;
  pastor: string;
  cargo?: string;
  funcao?: string;
  nome_pai?: string;
  nome_mae?: string;
  estado_civil?: string;
  nome_conjuge?: string;
  naturalidade?: string;
  foto_url?: string;
}

export default function AdminCarteiraPage() {
  const [members, setMembers] = useState<MemberCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroIgreja, setFiltroIgreja] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");

  const [selectedMember, setSelectedMember] = useState<MemberCardData | null>(null);
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"frente" | "verso" | "ambos">("ambos");
  const [printMode, setPrintMode] = useState<"single" | "batch">("single");

  // Estado de exportação
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  // Opções visuais customizáveis da Carteira
  const [corFundoFrente, setCorFundoFrente] = useState("#0f172a"); // Dark slate
  const [corFundoVerso, setCorFundoVerso] = useState("#1e293b");
  const [corAccent, setCorAccent] = useState("#f59e0b"); // Dourado
  const [corTexto, setCorTexto] = useState("#ffffff");
  const [validadeAnos, setValidadeAnos] = useState(2);
  const [tituloIgreja, setTituloIgreja] = useState("ASSEMBLEIA DE DEUS - MISSÕES");
  const [subtitulo, setSubtitulo] = useState("SETOR TANCREDO NEVES - SALVADOR / BA");
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null);

  const cardFrenteRef = useRef<HTMLDivElement>(null);
  const cardVersoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("inscricoes_batismo")
          .select("*")
          .order("nome", { ascending: true });

        if (error) throw error;
        setMembers(data || []);
        if (data && data.length > 0) {
          setSelectedMember(data[0]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar membros para carteira:", err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  // Opções únicas de igrejas e cargos para filtros
  const igrejasDisponiveis = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.igreja).filter(Boolean))).sort();
  }, [members]);

  const cargosDisponiveis = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.cargo).filter(Boolean))).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        m.nome.toLowerCase().includes(q) ||
        m.cpf.includes(q) ||
        m.igreja.toLowerCase().includes(q);

      const matchIgreja = filtroIgreja ? m.igreja === filtroIgreja : true;
      const matchCargo = filtroCargo ? m.cargo === filtroCargo : true;

      return matchSearch && matchIgreja && matchCargo;
    });
  }, [members, search, filtroIgreja, filtroCargo]);

  // Membros selecionados para o lote
  const batchMembers = useMemo(() => {
    if (batchSelectedIds.size === 0) {
      return selectedMember ? [selectedMember] : [];
    }
    return members.filter((m) => batchSelectedIds.has(m.id));
  }, [members, batchSelectedIds, selectedMember]);

  const toggleBatchSelect = (id: string) => {
    const next = new Set(batchSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBatchSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(batchSelectedIds);
    filteredMembers.forEach((m) => next.add(m.id));
    setBatchSelectedIds(next);
  };

  const clearBatch = () => {
    setBatchSelectedIds(new Set());
  };

  // Cálculo da data de validade
  const dataValidadeStr = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + validadeAnos);
    return d.toLocaleDateString("pt-BR");
  }, [validadeAnos]);

  // Formatação de data
  const formatData = (dStr?: string) => {
    if (!dStr) return "---";
    const parts = dStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  // Upload de assinatura do pastor
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssinaturaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Impressão individual
  const handlePrintSingle = () => {
    setPrintMode("single");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Impressão em Lote
  const handlePrintBatch = () => {
    if (batchSelectedIds.size === 0) {
      if (confirm(`Nenhum membro selecionado com checkbox. Deseja imprimir todas as ${filteredMembers.length} carteiras filtradas em lote?`)) {
        selectAllFiltered();
      } else if (selectedMember) {
        handlePrintSingle();
        return;
      } else {
        return;
      }
    }
    setPrintMode("batch");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Exportar PDF do membro selecionado (CR-80 isolado)
  const handleExportSinglePDF = async () => {
    if (!cardFrenteRef.current || !cardVersoRef.current) return;
    try {
      setIsExporting(true);

      const canvasFrente = await html2canvas(cardFrenteRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
      });

      const canvasVerso = await html2canvas(cardVersoRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
      });

      const imgFrente = canvasFrente.toDataURL("image/png");
      const imgVerso = canvasVerso.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54]
      });

      pdf.addImage(imgFrente, "PNG", 0, 0, 85.6, 54);
      pdf.addPage([85.6, 54], "landscape");
      pdf.addImage(imgVerso, "PNG", 0, 0, 85.6, 54);

      const nomeLimpo = (selectedMember?.nome || "carteira")
        .toLowerCase()
        .replace(/\s+/g, "_");
      pdf.save(`carteira_${nomeLimpo}.pdf`);
    } catch (err: any) {
      alert(`Erro ao gerar PDF: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar PDF em lote em folhas A4 organizadas
  const handleExportBatchPDF = async () => {
    const listToExport = batchMembers;
    if (listToExport.length === 0) {
      alert("Selecione pelo menos um membro para exportar em lote.");
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: listToExport.length });

      // Criar PDF A4 retrato
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Renderizar os cartões da página oculta de impressão
      const printPages = document.querySelectorAll(".carteira-print-page");
      if (!printPages || printPages.length === 0) {
        throw new Error("Não foi possível carregar as páginas de impressão.");
      }

      for (let i = 0; i < printPages.length; i++) {
        const pageEl = printPages[i] as HTMLElement;
        setExportProgress({ current: Math.min((i + 1) * 4, listToExport.length), total: listToExport.length });

        const canvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        // A4: 210mm x 297mm
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      pdf.save(`carteiras_lote_${listToExport.length}_membros.pdf`);
    } catch (err: any) {
      alert(`Erro ao gerar PDF em lote: ${err.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Download direto da imagem PNG
  const handleDownloadPNG = async (side: "frente" | "verso") => {
    const targetRef = side === "frente" ? cardFrenteRef : cardVersoRef;
    if (!targetRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(targetRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
      });
      const link = document.createElement("a");
      link.download = `carteira_${side}_${selectedMember?.cpf || "membro"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: any) {
      alert(`Erro ao baixar imagem: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Componente de Cartão Frente Reutilizável (Evita Sobreposição de Textos)
  const renderCardFrente = (m: MemberCardData, isPrint = false) => {
    return (
      <div
        className={`relative overflow-hidden select-none flex flex-col justify-between ${
          isPrint
            ? "border border-slate-300"
            : "rounded-2xl shadow-2xl border"
        }`}
        style={{
          width: isPrint ? "85.6mm" : "420px",
          height: isPrint ? "54mm" : "265px",
          padding: isPrint ? "2.5mm" : "14px",
          backgroundColor: corFundoFrente,
          color: corTexto,
          borderColor: isPrint ? "#cbd5e1" : `${corAccent}55`,
          boxSizing: "border-box"
        }}
      >
        {/* Barra superior dourada decorativa */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: isPrint ? "1.5mm" : "6px",
            background: `linear-gradient(90deg, ${corAccent}, #8b5cf6, ${corAccent})`
          }}
        />

        {/* Header do Cartão */}
        <div
          className="flex items-center justify-between border-b border-white/15"
          style={{
            paddingBottom: isPrint ? "1.5mm" : "6px",
            paddingTop: isPrint ? "1mm" : "2px"
          }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden pr-1">
            <div
              className="rounded flex items-center justify-center font-black text-slate-900 shrink-0 shadow-sm"
              style={{
                width: isPrint ? "6mm" : "26px",
                height: isPrint ? "6mm" : "26px",
                fontSize: isPrint ? "7pt" : "10px",
                backgroundColor: corAccent
              }}
            >
              AD
            </div>
            <div className="overflow-hidden leading-tight">
              <h2
                className="font-black uppercase tracking-tight truncate leading-none"
                style={{ fontSize: isPrint ? "6.8pt" : "11px" }}
              >
                {tituloIgreja}
              </h2>
              <p
                className="font-bold text-slate-400 uppercase tracking-wider truncate leading-none mt-0.5"
                style={{ fontSize: isPrint ? "5pt" : "8px" }}
              >
                {subtitulo}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span
              className="rounded-full font-black uppercase tracking-wider text-slate-900 truncate inline-block"
              style={{
                padding: isPrint ? "0.5mm 1.8mm" : "2px 8px",
                fontSize: isPrint ? "5.5pt" : "8.5px",
                maxWidth: isPrint ? "26mm" : "120px",
                backgroundColor: corAccent
              }}
            >
              {m.cargo || "MEMBRO"}
            </span>
          </div>
        </div>

        {/* Miolo Central: Foto 3x4 + Dados Pessoais Estruturados */}
        <div
          className="flex items-center gap-2.5 my-auto overflow-hidden"
          style={{ padding: isPrint ? "1mm 0" : "4px 0" }}
        >
          {/* Foto 3x4 com enquadramento perfeito */}
          <div
            className="rounded-lg overflow-hidden bg-slate-800 border shrink-0 flex items-center justify-center relative shadow-sm"
            style={{
              width: isPrint ? "21mm" : "90px",
              height: isPrint ? "28mm" : "120px",
              borderColor: corAccent
            }}
          >
            {m.foto_url ? (
              <img
                src={m.foto_url}
                alt="Foto"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="text-center p-1">
                <span
                  className="font-black opacity-40 uppercase"
                  style={{ fontSize: isPrint ? "12pt" : "20px" }}
                >
                  {m.nome.substring(0, 2)}
                </span>
                <span
                  className="block text-slate-400 uppercase font-bold mt-0.5"
                  style={{ fontSize: isPrint ? "4.5pt" : "7px" }}
                >
                  Sem Foto
                </span>
              </div>
            )}
          </div>

          {/* Dados do Membro - protegidos contra overflow */}
          <div className="flex-1 min-w-0 space-y-1 overflow-hidden text-left">
            <div>
              <span
                className="uppercase font-black text-slate-400 tracking-wider block"
                style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
              >
                Nome do Membro:
              </span>
              <h3
                className="font-black leading-tight uppercase line-clamp-2"
                style={{
                  fontSize: isPrint ? "7.8pt" : "12px",
                  maxHeight: isPrint ? "8mm" : "32px"
                }}
                title={m.nome}
              >
                {m.nome}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <div className="overflow-hidden">
                <span
                  className="uppercase font-bold text-slate-400 tracking-wider block truncate"
                  style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
                >
                  Congregação:
                </span>
                <p
                  className="font-bold leading-tight uppercase truncate"
                  style={{ fontSize: isPrint ? "6pt" : "9.5px" }}
                  title={m.igreja}
                >
                  {m.igreja}
                </p>
              </div>

              <div className="overflow-hidden">
                <span
                  className="uppercase font-bold text-slate-400 tracking-wider block truncate"
                  style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
                >
                  Função:
                </span>
                <p
                  className="font-bold leading-tight uppercase truncate"
                  style={{ fontSize: isPrint ? "6pt" : "9.5px" }}
                >
                  {m.funcao || "Apenas Membro"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <div>
                <span
                  className="uppercase font-bold text-slate-400 tracking-wider block"
                  style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
                >
                  Nascimento:
                </span>
                <p
                  className="font-bold leading-tight"
                  style={{ fontSize: isPrint ? "6pt" : "9.5px" }}
                >
                  {formatData(m.data_nascimento)}
                </p>
              </div>

              <div>
                <span
                  className="uppercase font-bold text-slate-400 tracking-wider block"
                  style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
                >
                  Batismo:
                </span>
                <p
                  className="font-bold leading-tight"
                  style={{ fontSize: isPrint ? "6pt" : "9.5px" }}
                >
                  {formatData(m.data_batismo)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Registro e Validade */}
        <div
          className="flex items-center justify-between border-t border-white/15 text-slate-400"
          style={{
            paddingTop: isPrint ? "1mm" : "4px",
            fontSize: isPrint ? "5.5pt" : "8px"
          }}
        >
          <span className="truncate">REG: {m.cpf}</span>
          <span className="font-bold text-white shrink-0">
            VAL: {dataValidadeStr}
          </span>
        </div>
      </div>
    );
  };

  // Componente de Cartão Verso Reutilizável
  const renderCardVerso = (m: MemberCardData, isPrint = false) => {
    return (
      <div
        className={`relative overflow-hidden select-none flex flex-col justify-between ${
          isPrint
            ? "border border-slate-300"
            : "rounded-2xl shadow-2xl border"
        }`}
        style={{
          width: isPrint ? "85.6mm" : "420px",
          height: isPrint ? "54mm" : "265px",
          padding: isPrint ? "2.5mm" : "14px",
          backgroundColor: corFundoVerso,
          color: corTexto,
          borderColor: isPrint ? "#cbd5e1" : `${corAccent}55`,
          boxSizing: "border-box"
        }}
      >
        {/* Barra superior decorativa */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: isPrint ? "1.5mm" : "6px",
            background: `linear-gradient(90deg, #8b5cf6, ${corAccent}, #8b5cf6)`
          }}
        />

        {/* Header do Verso */}
        <div
          className="flex items-center justify-between border-b border-white/15"
          style={{
            paddingBottom: isPrint ? "1.2mm" : "5px",
            paddingTop: isPrint ? "1mm" : "2px"
          }}
        >
          <span
            className="font-black uppercase tracking-wider text-slate-300 truncate"
            style={{ fontSize: isPrint ? "6pt" : "9px" }}
          >
            Identificação Cadastral & Eclesiástica
          </span>
          <span
            className="font-black uppercase tracking-widest shrink-0"
            style={{
              fontSize: isPrint ? "5.5pt" : "8px",
              color: corAccent
            }}
          >
            DOCUMENTO OFICIAL
          </span>
        </div>

        {/* Corpo do Verso: Dados Pessoais + QR Code */}
        <div
          className="grid grid-cols-12 gap-2 items-center my-auto overflow-hidden"
          style={{ padding: isPrint ? "1mm 0" : "4px 0" }}
        >
          {/* Informações detalhadas */}
          <div className="col-span-8 space-y-1 overflow-hidden text-left">
            <div>
              <span
                className="font-bold text-slate-400 uppercase block truncate"
                style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
              >
                Filiação:
              </span>
              <p
                className="font-semibold leading-tight uppercase truncate"
                style={{ fontSize: isPrint ? "6pt" : "9px" }}
                title={`${m.nome_mae || "-"} / ${m.nome_pai || "-"}`}
              >
                {m.nome_mae || m.nome_pai
                  ? `${m.nome_mae || "-"} / ${m.nome_pai || "-"}`
                  : "Não informada"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <div>
                <span
                  className="font-bold text-slate-400 uppercase block"
                  style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
                >
                  RG:
                </span>
                <p
                  className="font-semibold leading-tight truncate"
                  style={{ fontSize: isPrint ? "6pt" : "9px" }}
                >
                  {m.rg || "Não informado"}
                </p>
              </div>
              <div>
                <span
                  className="font-bold text-slate-400 uppercase block"
                  style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
                >
                  Estado Civil:
                </span>
                <p
                  className="font-semibold leading-tight uppercase truncate"
                  style={{ fontSize: isPrint ? "6pt" : "9px" }}
                >
                  {m.estado_civil || "Solteiro(a)"}
                </p>
              </div>
            </div>

            <div>
              <span
                className="font-bold text-slate-400 uppercase block"
                style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
              >
                Pastor Responsável:
              </span>
              <p
                className="font-semibold leading-tight uppercase truncate"
                style={{ fontSize: isPrint ? "6pt" : "9px" }}
                title={m.pastor}
              >
                {m.pastor}
              </p>
            </div>

            <p
              className="text-slate-400 leading-tight italic truncate"
              style={{ fontSize: isPrint ? "4.8pt" : "7.5px" }}
            >
              "O portador deste é membro regular em plena comunhão eclesiástica."
            </p>
          </div>

          {/* QR Code com borda e etiqueta */}
          <div className="col-span-4 flex flex-col items-center justify-center p-1.5 rounded-xl bg-white text-slate-900 shadow-md">
            <QRCodeSVG
              value={`https://cadastro-de-membros-henna.vercel.app/membro?cpf=${m.cpf}`}
              size={isPrint ? 48 : 68}
              level="M"
            />
            <span
              className="font-black tracking-tighter uppercase mt-0.5 text-slate-600"
              style={{ fontSize: isPrint ? "4.5pt" : "7px" }}
            >
              Validar Membro
            </span>
          </div>
        </div>

        {/* Rodapé com Assinatura */}
        <div
          className="border-t border-white/15 flex items-end justify-between"
          style={{ paddingTop: isPrint ? "1mm" : "4px" }}
        >
          <div className="w-1/2 text-center">
            {assinaturaUrl ? (
              <img
                src={assinaturaUrl}
                alt="Assinatura"
                className="mx-auto object-contain filter invert"
                style={{ height: isPrint ? "4.5mm" : "20px" }}
              />
            ) : (
              <div style={{ height: isPrint ? "3.5mm" : "16px" }} />
            )}
            <div className="border-t border-white/40 pt-0.5">
              <span
                className="uppercase font-bold text-slate-300 block leading-none truncate"
                style={{ fontSize: isPrint ? "5pt" : "7.5px" }}
              >
                Pastor Presidente / Setorial
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className="text-slate-400 uppercase block"
              style={{ fontSize: isPrint ? "4.5pt" : "7px" }}
            >
              Emissão Oficial
            </span>
            <span
              className="font-bold text-white truncate block"
              style={{ fontSize: isPrint ? "5.5pt" : "8px" }}
            >
              AD Setor Tancredo Neves
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Divide os membros em páginas A4 (4 membros por página = 4 pares Frente e Verso)
  const chunkedBatchPages = useMemo(() => {
    const list = printMode === "single" && selectedMember ? [selectedMember] : batchMembers;
    const chunks: MemberCardData[][] = [];
    const pageSize = 4;
    for (let i = 0; i < list.length; i += pageSize) {
      chunks.push(list.slice(i, i + pageSize));
    }
    return chunks;
  }, [printMode, selectedMember, batchMembers]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner de Controles */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <IdCard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Produção de Carteira de Membros
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Emissão individual ou em <strong>lote</strong> no padrão nacional CR-80 (85.6mm × 54mm) com Frente e Verso lado a lado, sem sobreposição de textos e com guias de corte.
          </p>
        </div>

        {/* Botões de Ação de Impressão e Lote */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrintSingle}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            title="Imprimir apenas o membro atualmente visualizado"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Imprimir Atual (1)</span>
          </button>

          <button
            onClick={handlePrintBatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
            title="Imprimir todos os membros selecionados com checkbox em folha A4"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>
              Imprimir Lote ({batchSelectedIds.size > 0 ? batchSelectedIds.size : filteredMembers.length})
            </span>
          </button>

          <button
            onClick={handleExportBatchPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            title="Exportar PDF em lote de todas as carteiras em folhas A4"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>PDF em Lote</span>
          </button>

          <button
            onClick={handleExportSinglePDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all active:scale-95 disabled:opacity-50"
            title="Baixar PDF do cartão individual"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>PDF Individual</span>
          </button>
        </div>
      </div>

      {/* Alerta / Indicador de Progresso de Exportação em Lote */}
      {isExporting && exportProgress && (
        <div className="no-print p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-white flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            <div>
              <p className="text-xs font-bold">Processando geração em lote...</p>
              <p className="text-[11px] text-slate-300">
                Página {exportProgress.current} de {exportProgress.total} membros processados.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-400">
            {Math.round((exportProgress.current / exportProgress.total) * 100)}%
          </span>
        </div>
      )}

      {/* Grid Principal: Seletor de Membros + Visualizador + Controles */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Lista de Membros com Seleção em Lote */}
        <div className="lg:col-span-4 flex flex-col h-[75vh] rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Membros ({filteredMembers.length})
              </h3>

              {batchSelectedIds.size > 0 && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {batchSelectedIds.size} no lote
                </span>
              )}
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar membro, CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filtros Rápidos por Igreja e Cargo */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filtroIgreja}
                onChange={(e) => setFiltroIgreja(e.target.value)}
                className="bg-white/[0.05] border border-white/10 text-white text-[11px] rounded-xl px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-slate-900">Todas Igrejas</option>
                {igrejasDisponiveis.map((ig) => (
                  <option key={ig} value={ig} className="bg-slate-900">
                    {ig}
                  </option>
                ))}
              </select>

              <select
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="bg-white/[0.05] border border-white/10 text-white text-[11px] rounded-xl px-2 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-slate-900">Todos Cargos</option>
                {cargosDisponiveis.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Ações de Seleção em Lote */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                onClick={selectAllFiltered}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Selecionar Todos ({filteredMembers.length})</span>
              </button>

              {batchSelectedIds.size > 0 && (
                <button
                  onClick={clearBatch}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Desmarcar Todos</span>
                </button>
              )}
            </div>
          </div>

          {/* Lista de Membros */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Carregando membros...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhum membro encontrado com os filtros aplicados.
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const isBatchChecked = batchSelectedIds.has(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/50"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBatchChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleBatchSelect(member.id);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 bg-white/10 border-white/20 focus:ring-indigo-500 shrink-0 cursor-pointer"
                    />

                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-white/10 shrink-0 flex items-center justify-center">
                      {member.foto_url ? (
                        <img
                          src={member.foto_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          {member.nome.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate leading-tight uppercase">
                        {member.nome}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {member.cargo || "Membro"} • {member.igreja}
                      </p>
                    </div>

                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel Central: Visualizador do Cartão e Customizador */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {/* Barra de Ferramentas / Estilos */}
          <div className="p-4 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("ambos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "ambos"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white bg-white/5"
                }`}
              >
                Frente & Verso
              </button>
              <button
                onClick={() => setActiveTab("frente")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "frente"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white bg-white/5"
                }`}
              >
                Apenas Frente
              </button>
              <button
                onClick={() => setActiveTab("verso")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "verso"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white bg-white/5"
                }`}
              >
                Apenas Verso
              </button>
            </div>

            {/* Customização de Cores e Assinatura */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Fundo:</span>
                <input
                  type="color"
                  value={corFundoFrente}
                  onChange={(e) => {
                    setCorFundoFrente(e.target.value);
                    setCorFundoVerso(e.target.value);
                  }}
                  className="w-7 h-7 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0"
                  title="Cor de Fundo"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Acento:</span>
                <input
                  type="color"
                  value={corAccent}
                  onChange={(e) => setCorAccent(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0"
                  title="Cor de Destaque / Ouro"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Validade:</span>
                <select
                  value={validadeAnos}
                  onChange={(e) => setValidadeAnos(Number(e.target.value))}
                  className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/10"
                >
                  <option value={1} className="bg-slate-900">1 Ano</option>
                  <option value={2} className="bg-slate-900">2 Anos</option>
                  <option value={4} className="bg-slate-900">4 Anos</option>
                </select>
              </div>

              <label className="cursor-pointer text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Assinatura</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Área de Visualização Interativa do Cartão */}
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#090d16] border border-white/10 min-h-[480px] shadow-inner relative overflow-hidden">
            {selectedMember ? (
              <div className="flex flex-col xl:flex-row items-center justify-center gap-8 max-w-full">
                {/* CARTÃO FRENTE */}
                {(activeTab === "ambos" || activeTab === "frente") && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Frente (Padrão CR-80)
                    </span>

                    <div ref={cardFrenteRef}>
                      {renderCardFrente(selectedMember, false)}
                    </div>

                    <button
                      onClick={() => handleDownloadPNG("frente")}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1"
                    >
                      <Download className="w-3 h-3" /> Baixar PNG Frente
                    </button>
                  </div>
                )}

                {/* CARTÃO VERSO */}
                {(activeTab === "ambos" || activeTab === "verso") && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Verso (Regulamentar)
                    </span>

                    <div ref={cardVersoRef}>
                      {renderCardVerso(selectedMember, false)}
                    </div>

                    <button
                      onClick={() => handleDownloadPNG("verso")}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1"
                    >
                      <Download className="w-3 h-3" /> Baixar PNG Verso
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                Selecione um membro à esquerda para visualizar a carteira.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ÁREA EXCLUSIVA DE IMPRESSÃO (Folha A4 com 4 pares Frente e Verso por folha)
          Com guias de corte e sem sobreposição de textos
         ========================================================================= */}
      <div className="hidden print:block text-black bg-white">
        {chunkedBatchPages.map((pageMembers, pageIdx) => (
          <div
            key={`page-${pageIdx}`}
            className="carteira-print-page w-[210mm] min-h-[297mm] mx-auto p-0 flex flex-col items-center justify-start space-y-4"
          >
            {pageMembers.map((member) => (
              <div
                key={`print-member-${member.id}`}
                className="flex items-center justify-center gap-0 border border-dashed border-slate-300 p-0.5 rounded shadow-none bg-white relative"
                style={{
                  width: "171.6mm", // 85.6mm + 85.6mm + 0.4mm
                  height: "54.8mm",
                  boxSizing: "border-box"
                }}
              >
                {/* Cartão Frente */}
                <div className="shrink-0">
                  {renderCardFrente(member, true)}
                </div>

                {/* Linha guia de dobra / corte central */}
                <div
                  className="h-full border-r border-dashed border-slate-400 shrink-0"
                  style={{ width: "0.2mm" }}
                />

                {/* Cartão Verso */}
                <div className="shrink-0">
                  {renderCardVerso(member, true)}
                </div>

                {/* Marcas de corte nos 4 cantos para guilhotina */}
                <span className="absolute -top-1 -left-1 text-[6px] text-slate-400">┌</span>
                <span className="absolute -top-1 -right-1 text-[6px] text-slate-400">┐</span>
                <span className="absolute -bottom-1 -left-1 text-[6px] text-slate-400">└</span>
                <span className="absolute -bottom-1 -right-1 text-[6px] text-slate-400">┘</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
