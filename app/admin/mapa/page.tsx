"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  Building2,
  Users,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  Download,
  Loader2
} from "lucide-react";
import {
  SALVADOR_PREFEITURAS,
  findBairro,
  PrefeituraBairro
} from "@/lib/salvador-bairros";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Carregamento dinâmico do mapa (apenas no cliente / sem SSR)
const SalvadorMap = dynamic(() => import("@/components/mapa/SalvadorMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#0b0f19]/80 border border-white/10 rounded-2xl">
      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-300">
        Carregando mapa geográfico de Salvador...
      </p>
    </div>
  )
});

interface IgrejaMapItem {
  id: string;
  nome: string;
  pastor: string;
  bairro?: string;
  membersCount: number;
}

interface MembroGeo {
  id: string;
  nome: string;
  igreja: string;
  pastor: string;
  bairro: string;
  cidade: string;
  foto_url?: string;
}

export default function AdminMapaPage() {
  const [loading, setLoading] = useState(true);
  const [membros, setMembros] = useState<MembroGeo[]>([]);
  const [selectedPbId, setSelectedPbId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [selectedIgrejaNome, setSelectedIgrejaNome] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("inscricoes_batismo")
          .select("id, nome, igreja, pastor, bairro, cidade, foto_url")
          .order("igreja", { ascending: true });

        if (error) throw error;
        setMembros(data || []);
      } catch (err: any) {
        console.error("Erro ao carregar dados geográficos:", err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Agrupa congregações a partir dos membros cadastrados
  const igrejasAgrupadas: IgrejaMapItem[] = useMemo(() => {
    const mapaIgrejas: Record<
      string,
      {
        id: string;
        nome: string;
        pastores: Record<string, number>;
        bairros: Record<string, number>;
        count: number;
      }
    > = {};

    membros.forEach((m) => {
      const igrejaNorm = (m.igreja || "Sem Congregação").trim().toUpperCase();
      if (!mapaIgrejas[igrejaNorm]) {
        mapaIgrejas[igrejaNorm] = {
          id: igrejaNorm,
          nome: igrejaNorm,
          pastores: {},
          bairros: {},
          count: 0
        };
      }

      mapaIgrejas[igrejaNorm].count += 1;

      if (m.pastor) {
        const pNorm = m.pastor.trim().toUpperCase();
        mapaIgrejas[igrejaNorm].pastores[pNorm] =
          (mapaIgrejas[igrejaNorm].pastores[pNorm] || 0) + 1;
      }

      if (m.bairro) {
        const bNorm = m.bairro.trim().toUpperCase();
        mapaIgrejas[igrejaNorm].bairros[bNorm] =
          (mapaIgrejas[igrejaNorm].bairros[bNorm] || 0) + 1;
      }
    });

    return Object.values(mapaIgrejas).map((item) => {
      // Pastor mais frequente
      const topPastor = Object.entries(item.pastores).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "Pastor não informado";

      // Bairro mais frequente ou tentativa de extrair do nome
      let topBairro = Object.entries(item.bairros).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];

      // Fallback: se não tiver bairro cadastrado ou for Tancredo Neves
      if (!topBairro || !findBairro(topBairro)) {
        if (item.nome.includes("TANCREDO NEVES") || item.nome.includes("SEDE")) {
          topBairro = "TANCREDO NEVES";
        } else if (item.nome.includes("ROTULA") || item.nome.includes("RÓTULA")) {
          topBairro = "BEIRU / TANCREDO NEVES";
        } else if (item.nome.includes("CABULA")) {
          topBairro = "CABULA";
        } else if (item.nome.includes("SUSSUARANA")) {
          topBairro = "SUSSUARANA";
        } else {
          topBairro = "TANCREDO NEVES";
        }
      }

      return {
        id: item.id,
        nome: item.nome,
        pastor: topPastor,
        bairro: topBairro,
        membersCount: item.count
      };
    }).sort((a, b) => b.membersCount - a.membersCount);
  }, [membros]);

  // Filtra por busca e prefeitura-bairro
  const igrejasFiltradas = useMemo(() => {
    return igrejasAgrupadas.filter((igreja) => {
      const matchBusca =
        igreja.nome.toLowerCase().includes(busca.toLowerCase()) ||
        igreja.pastor.toLowerCase().includes(busca.toLowerCase()) ||
        (igreja.bairro && igreja.bairro.toLowerCase().includes(busca.toLowerCase()));

      if (!matchBusca) return false;

      if (selectedPbId !== null) {
        if (!igreja.bairro) return false;
        const bInfo = findBairro(igreja.bairro);
        return bInfo && bInfo.pbId === selectedPbId;
      }

      return true;
    });
  }, [igrejasAgrupadas, busca, selectedPbId]);

  // Exportar relatório de congregações em PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO GEOGRÁFICO DE CONGREGAÇÕES E MEMBROS", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Salvador / BA - Total de Congregações: ${igrejasFiltradas.length} | Membros Mapeados: ${membros.length}`,
      14,
      25
    );

    const rows = igrejasFiltradas.map((ig, i) => {
      const bInfo = ig.bairro ? findBairro(ig.bairro) : null;
      return [
        (i + 1).toString(),
        ig.nome,
        ig.pastor,
        bInfo ? `${bInfo.nome} (${bInfo.pbNome})` : ig.bairro || "Salvador",
        ig.membersCount.toString()
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [["#", "Congregação", "Pastor Responsável", "Bairro / Divisão", "Membros"]],
      body: rows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save("mapa_congregacoes_salvador.pdf");
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner & Métricas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Mapa Geográfico de Salvador
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Localização e distribuição de congregações e congregações vinculadas aos membros do Setor Tancredo Neves através das divisões oficiais da capital.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Membros</p>
              <p className="text-lg font-black text-white leading-tight">{membros.length}</p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Congregações</p>
              <p className="text-lg font-black text-white leading-tight">{igrejasAgrupadas.length}</p>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Filtros de Prefeituras-Bairro de Salvador */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            Divisões Regionais de Salvador:
          </span>
          {selectedPbId !== null && (
            <button
              onClick={() => setSelectedPbId(null)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Limpar Filtro de Região
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedPbId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedPbId === null
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40"
                : "bg-white/[0.05] text-slate-300 hover:bg-white/10 border border-white/5"
            }`}
          >
            Todas as Regiões
          </button>

          {SALVADOR_PREFEITURAS.map((pb) => {
            const isSelected = selectedPbId === pb.id;
            return (
              <button
                key={pb.id}
                onClick={() => setSelectedPbId(isSelected ? null : pb.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  isSelected
                    ? "text-white shadow-lg"
                    : "bg-white/[0.04] text-slate-300 hover:bg-white/10 border-white/5"
                }`}
                style={{
                  backgroundColor: isSelected ? pb.cor : undefined,
                  borderColor: isSelected ? pb.cor : undefined
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: pb.cor }}
                />
                <span>{pb.nome}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Principal: Mapa e Painel Lateral de Congregações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa Leaflet */}
        <div className="lg:col-span-8 min-h-[580px] h-[65vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <SalvadorMap
            igrejas={igrejasFiltradas}
            selectedPbId={selectedPbId}
            onSelectPB={(id) => setSelectedPbId(id)}
          />
        </div>

        {/* Painel Lateral com Lista de Congregações */}
        <div className="lg:col-span-4 flex flex-col h-[65vh] rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Busca no painel lateral */}
          <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Congregações Mapeadas ({igrejasFiltradas.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar congregação, pastor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Lista com Scroll */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                <span className="text-xs">Carregando congregações...</span>
              </div>
            ) : igrejasFiltradas.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhuma congregação encontrada para este filtro.
              </div>
            ) : (
              igrejasFiltradas.map((item) => {
                const bInfo = item.bairro ? findBairro(item.bairro) : null;
                const pbInfo = bInfo
                  ? SALVADOR_PREFEITURAS.find((p) => p.id === bInfo.pbId)
                  : null;

                const isSelected = selectedIgrejaNome === item.nome;

                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      setSelectedIgrejaNome(isSelected ? null : item.nome)
                    }
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-tight leading-snug">
                        {item.nome}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 shrink-0">
                        {item.membersCount} {item.membersCount === 1 ? "membro" : "membros"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mb-2 truncate">
                      <strong className="text-slate-400 uppercase font-semibold">Pastor:</strong> {item.pastor}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                        {bInfo ? `${bInfo.nome}` : item.bairro || "Salvador"}
                      </span>
                      {pbInfo && (
                        <span
                          className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider truncate"
                          style={{
                            backgroundColor: `${pbInfo.cor}22`,
                            color: pbInfo.cor
                          }}
                        >
                          {pbInfo.nome.replace("Divisão ", "")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
