"use client";

import React, { useEffect, useState, useRef } from "react";
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
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  X
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
  const [selectedMember, setSelectedMember] = useState<MemberCardData | null>(null);
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"frente" | "verso" | "ambos">("ambos");
  const [isExporting, setIsExporting] = useState(false);

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

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.nome.toLowerCase().includes(q) ||
      m.cpf.includes(q) ||
      m.igreja.toLowerCase().includes(q)
    );
  });

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
  const dataValidadeStr = React.useMemo(() => {
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

  // Download do cartão (Frente e Verso em PNG ou PDF)
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

      // Tamanho padrão ISO ID-1 / CR-80 em mm: 85.6 x 53.98
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54]
      });

      // Página 1: Frente
      pdf.addImage(imgFrente, "PNG", 0, 0, 85.6, 54);

      // Página 2: Verso
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md shadow-2xl">
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
            Emissão oficial de credenciais eclesiásticas no padrão nacional CR-80 (85.6mm × 54mm) com Frente, Verso, QR Code e validação eclesiástica.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Imprimir Cartão</span>
          </button>

          <button
            onClick={handleExportSinglePDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Exportar PDF (CR-80)</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Seletor de Membros + Visualizador + Controles */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Lista de Membros */}
        <div className="lg:col-span-4 flex flex-col h-[75vh] rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Membros Cadastrados ({filteredMembers.length})
              </h3>

              {batchSelectedIds.size > 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {batchSelectedIds.size} selecionados
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar membro, CPF ou congregação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <button
                onClick={selectAllFiltered}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Selecionar Todos
              </button>
              {batchSelectedIds.size > 0 && (
                <button
                  onClick={clearBatch}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Limpar Seleção
                </button>
              )}
            </div>
          </div>

          {/* Lista com scroll */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Carregando membros...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhum membro encontrado.
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
          {/* Barra de Ferramentas / Estilos rápidos */}
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

            {/* Seletor de Cores */}
            <div className="flex items-center gap-3 text-xs">
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
                  title="Alterar cor de fundo"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Acento:</span>
                <input
                  type="color"
                  value={corAccent}
                  onChange={(e) => setCorAccent(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0"
                  title="Alterar cor de destaque"
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

              {/* Upload de Assinatura */}
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

          {/* Área de Visualização das Carteiras */}
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[#090d16] border border-white/10 min-h-[480px] shadow-inner relative overflow-hidden">
            {selectedMember ? (
              <div className="flex flex-col xl:flex-row items-center justify-center gap-8 max-w-full">
                {/* CARTÃO FRENTE */}
                {(activeTab === "ambos" || activeTab === "frente") && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Frente (Padrão CR-80)
                    </span>

                    <div
                      ref={cardFrenteRef}
                      className="relative rounded-2xl p-4 overflow-hidden shadow-2xl border flex flex-col justify-between select-none"
                      style={{
                        width: "420px",
                        height: "265px",
                        backgroundColor: corFundoFrente,
                        color: corTexto,
                        borderColor: `${corAccent}55`
                      }}
                    >
                      {/* Faixa decorativa no topo */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{
                          background: `linear-gradient(90deg, ${corAccent}, #8b5cf6, ${corAccent})`
                        }}
                      />

                      {/* Header da Carteira */}
                      <div className="flex items-center justify-between border-b pb-2 pt-1 border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-slate-900 shadow-md shrink-0"
                            style={{ backgroundColor: corAccent }}
                          >
                            AD
                          </div>
                          <div>
                            <h2 className="text-[11px] font-black uppercase tracking-tight leading-tight">
                              {tituloIgreja}
                            </h2>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {subtitulo}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-slate-900"
                            style={{ backgroundColor: corAccent }}
                          >
                            {selectedMember.cargo || "MEMBRO"}
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo Central: Foto + Dados */}
                      <div className="flex items-center gap-3.5 my-auto">
                        {/* Foto 3x4 do Membro */}
                        <div
                          className="w-24 h-32 rounded-xl overflow-hidden bg-slate-800 border-2 shadow-lg shrink-0 flex items-center justify-center relative"
                          style={{ borderColor: corAccent }}
                        >
                          {selectedMember.foto_url ? (
                            <img
                              src={selectedMember.foto_url}
                              alt="Foto do Membro"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <span className="text-2xl font-black opacity-40">
                                {selectedMember.nome.substring(0, 2).toUpperCase()}
                              </span>
                              <span className="block text-[8px] text-slate-400 uppercase mt-1">
                                Sem Foto
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Dados Principais */}
                        <div className="flex-1 space-y-1 text-left overflow-hidden">
                          <div>
                            <span className="text-[7.5px] uppercase font-black text-slate-400 tracking-wider block">
                              Nome do Membro:
                            </span>
                            <h3 className="text-[13px] font-black leading-tight uppercase truncate">
                              {selectedMember.nome}
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            <div>
                              <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Congregação:
                              </span>
                              <p className="text-[9.5px] font-bold leading-tight uppercase truncate">
                                {selectedMember.igreja}
                              </p>
                            </div>

                            <div>
                              <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Função:
                              </span>
                              <p className="text-[9.5px] font-bold leading-tight uppercase truncate">
                                {selectedMember.funcao || "Apenas Membro"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            <div>
                              <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Data Nascimento:
                              </span>
                              <p className="text-[9.5px] font-bold leading-tight">
                                {formatData(selectedMember.data_nascimento)}
                              </p>
                            </div>

                            <div>
                              <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Data Batismo:
                              </span>
                              <p className="text-[9.5px] font-bold leading-tight">
                                {formatData(selectedMember.data_batismo)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé da Frente */}
                      <div className="flex items-center justify-between text-[8px] pt-1.5 border-t border-white/10 text-slate-400">
                        <span>REGISTRO: {selectedMember.cpf}</span>
                        <span className="font-bold text-white">
                          VALIDADE: {dataValidadeStr}
                        </span>
                      </div>
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

                    <div
                      ref={cardVersoRef}
                      className="relative rounded-2xl p-4 overflow-hidden shadow-2xl border flex flex-col justify-between select-none text-left"
                      style={{
                        width: "420px",
                        height: "265px",
                        backgroundColor: corFundoVerso,
                        color: corTexto,
                        borderColor: `${corAccent}55`
                      }}
                    >
                      {/* Faixa decorativa no topo */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{
                          background: `linear-gradient(90deg, #8b5cf6, ${corAccent}, #8b5cf6)`
                        }}
                      />

                      {/* Header do Verso */}
                      <div className="flex items-center justify-between border-b pb-1.5 pt-1 border-white/10">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                          Identificação Cadastral & Eclesiástica
                        </span>
                        <span
                          className="text-[8px] font-black uppercase tracking-widest"
                          style={{ color: corAccent }}
                        >
                          DOCUMENTO OFICIAL
                        </span>
                      </div>

                      {/* Corpo do Verso: Dados detalhados + QR Code */}
                      <div className="grid grid-cols-12 gap-3 items-center my-auto">
                        <div className="col-span-8 space-y-1 text-[8.5px]">
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[7.5px] block">
                              Filiação:
                            </span>
                            <p className="font-semibold leading-tight uppercase truncate">
                              {selectedMember.nome_mae || selectedMember.nome_pai
                                ? `${selectedMember.nome_mae || "-"} / ${selectedMember.nome_pai || "-"}`
                                : "Não informada"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[7.5px] block">
                                RG:
                              </span>
                              <p className="font-semibold leading-tight">
                                {selectedMember.rg || "Não informado"}
                              </p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[7.5px] block">
                                Estado Civil:
                              </span>
                              <p className="font-semibold leading-tight uppercase">
                                {selectedMember.estado_civil || "Solteiro(a)"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[7.5px] block">
                              Pastor Responsável:
                            </span>
                            <p className="font-semibold leading-tight uppercase truncate">
                              {selectedMember.pastor}
                            </p>
                          </div>

                          <div className="pt-1">
                            <p className="text-[7.5px] text-slate-400 leading-tight italic">
                              "O portador deste documento é membro regular em plena comunhão com esta instituição."
                            </p>
                          </div>
                        </div>

                        {/* QR Code para conferência */}
                        <div className="col-span-4 flex flex-col items-center justify-center p-2 rounded-xl bg-white text-slate-900 shadow-md">
                          <QRCodeSVG
                            value={`https://cadastro-de-membros-henna.vercel.app/membro?cpf=${selectedMember.cpf}`}
                            size={72}
                            level="M"
                          />
                          <span className="text-[7px] font-black tracking-tighter uppercase mt-1 text-slate-600">
                            Validar Membro
                          </span>
                        </div>
                      </div>

                      {/* Assinatura do Pastor */}
                      <div className="border-t border-white/10 pt-2 flex items-end justify-between">
                        <div className="w-1/2 text-center">
                          {assinaturaUrl ? (
                            <img
                              src={assinaturaUrl}
                              alt="Assinatura"
                              className="h-7 mx-auto object-contain filter invert"
                            />
                          ) : (
                            <div className="h-5" />
                          )}
                          <div className="border-t border-white/40 pt-0.5">
                            <span className="text-[7.5px] uppercase font-bold text-slate-300 block">
                              Pastor Presidente / Setorial
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[7px] text-slate-400 uppercase block">
                            Emissão Sistema
                          </span>
                          <span className="text-[8px] font-bold text-white">
                            AD Setor Tancredo Neves
                          </span>
                        </div>
                      </div>
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

      {/* Estilo especial para impressão em folha A4 */}
      <div className="hidden print:block text-black">
        {selectedMember && (
          <div className="flex flex-wrap gap-4 p-4">
            {/* Renderizar em escala real para impressão */}
            <div
              style={{
                width: "85.6mm",
                height: "54mm",
                backgroundColor: corFundoFrente,
                color: corTexto,
                borderRadius: "3mm"
              }}
              className="p-2 border border-black flex flex-col justify-between text-xs"
            >
              <div className="text-center font-bold text-[9px]">
                {tituloIgreja}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-16 bg-gray-200 overflow-hidden rounded">
                  {selectedMember.foto_url && (
                    <img
                      src={selectedMember.foto_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="text-[8px]">
                  <p className="font-bold">{selectedMember.nome}</p>
                  <p>{selectedMember.cargo || "Membro"}</p>
                  <p>{selectedMember.igreja}</p>
                </div>
              </div>
              <div className="text-[7px] flex justify-between">
                <span>CPF: {selectedMember.cpf}</span>
                <span>Val: {dataValidadeStr}</span>
              </div>
            </div>

            <div
              style={{
                width: "85.6mm",
                height: "54mm",
                backgroundColor: corFundoVerso,
                color: corTexto,
                borderRadius: "3mm"
              }}
              className="p-2 border border-black flex flex-col justify-between text-xs"
            >
              <div className="text-center font-bold text-[9px]">
                IDENTIFICAÇÃO DE MEMBRO
              </div>
              <div className="flex items-center justify-between text-[7.5px]">
                <div>
                  <p>Pastor: {selectedMember.pastor}</p>
                  <p>Batismo: {formatData(selectedMember.data_batismo)}</p>
                  <p>Nascimento: {formatData(selectedMember.data_nascimento)}</p>
                </div>
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG
                    value={`https://cadastro-de-membros-henna.vercel.app/membro?cpf=${selectedMember.cpf}`}
                    size={45}
                  />
                </div>
              </div>
              <div className="text-[6.5px] text-center border-t pt-1">
                Assinatura da Diretoria
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
