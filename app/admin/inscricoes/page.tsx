"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generatePDF, generateIndividualPDF } from '@/lib/pdf-generator';
import { generateExcel } from '@/lib/excel-generator';
import { useAuth } from '@/lib/auth-context';
import { formatDateISOToBR, calcularIdade } from '@/lib/utils';
import WhatsAppButton from '@/components/ui/whatsapp-button';

interface Inscricao {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  data_consagracao?: string;
  telefone: string;
  igreja: string;
  pastor: string;

  created_at: string;
  cargo: string;
  funcao: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  estado_civil: string;

  // Novos campos
  nome_pai?: string;
  nome_mae?: string;
  naturalidade?: string;
  rg?: string;
  data_batismo?: string;
  foto_url?: string;
  nome_conjuge?: string;

  // Controle AD Salvador
  cadastrado_ad_salvador?: boolean;
}

// ---------------------------------------------------------------------------
// Painel de Estatísticas por Igreja para AD Salvador
// ---------------------------------------------------------------------------
interface EstatisticaIgreja {
  igreja: string;
  total: number;
  cadastrados: number;
  percentual: number;
}

function PainelAdSalvador({ inscricoes }: { inscricoes: Inscricao[] }) {
  const totalGeral = inscricoes.length;
  const totalCadastrados = inscricoes.filter((i) => i.cadastrado_ad_salvador).length;
  const percentualGeral = totalGeral > 0 ? Math.round((totalCadastrados / totalGeral) * 100) : 0;

  // Agrupar por igreja
  const mapaIgrejas: Record<string, EstatisticaIgreja> = {};
  for (const i of inscricoes) {
    const chave = i.igreja?.trim().toUpperCase() || 'SEM IGREJA';
    if (!mapaIgrejas[chave]) {
      mapaIgrejas[chave] = { igreja: chave, total: 0, cadastrados: 0, percentual: 0 };
    }
    mapaIgrejas[chave].total++;
    if (i.cadastrado_ad_salvador) mapaIgrejas[chave].cadastrados++;
  }

  const estatisticas: EstatisticaIgreja[] = Object.values(mapaIgrejas)
    .map((e) => ({ ...e, percentual: e.total > 0 ? Math.round((e.cadastrados / e.total) * 100) : 0 }))
    .sort((a, b) => b.percentual - a.percentual || a.igreja.localeCompare(b.igreja));

  const corBarra = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header do Painel */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Painel — Plataforma AD Salvador
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Progresso de cadastro na plataforma externa</p>
        </div>
        {/* Resumo Global */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-black text-white">{totalCadastrados}</div>
            <div className="text-xs text-emerald-400 font-medium">Cadastrados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white">{totalGeral - totalCadastrados}</div>
            <div className="text-xs text-rose-400 font-medium">Pendentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white">{percentualGeral}%</div>
            <div className="text-xs text-slate-400 font-medium">Total</div>
          </div>
        </div>
      </div>

      {/* Barra de progresso global */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium min-w-[80px]">Progresso geral</span>
          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
              style={{ width: `${percentualGeral}%` }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-600 min-w-[38px] text-right">{percentualGeral}%</span>
        </div>
      </div>

      {/* Grid de igrejas */}
      {estatisticas.length > 0 && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {estatisticas.map((est) => (
            <div
              key={est.igreja}
              className="rounded-xl border border-slate-100 bg-white shadow-sm p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-slate-700 leading-tight line-clamp-2 flex-1">{est.igreja}</span>
                <span
                  className={`text-xs font-black shrink-0 ml-1 ${
                    est.percentual >= 80
                      ? 'text-emerald-600'
                      : est.percentual >= 50
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}
                >
                  {est.percentual}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${corBarra(est.percentual)}`}
                  style={{ width: `${est.percentual}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{est.cadastrados} cadastrados</span>
                <span>{est.total} total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {inscricoes.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">Nenhum dado para exibir.</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página Principal
// ---------------------------------------------------------------------------
export default function InscricoesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isMaster } = useAuth();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModalData, setViewModalData] = useState<Inscricao | null>(null);

  // Controle AD Salvador — alterações pendentes (id -> novo valor boolean)
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);
  
  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCpf, setFiltroCpf] = useState('');
  const [filtroIgreja, setFiltroIgreja] = useState('');
  const [filtroPastor, setFiltroPastor] = useState('');
  const [filtroFuncao, setFiltroFuncao] = useState('');

  // Estados dos filtros em caixa de seleção (Checkboxes)
  const [selectedCargos, setSelectedCargos] = useState<string[]>([]);
  const [exportColumns, setExportColumns] = useState({
    nome: true,
    cpf: false,
    idade: false,
    telefone: false,
    cargoFuncao: true,
    estadoCivil: false,
    endereco: false,
    igrejaPastor: true,
  });

  const handleExportPDF = () => {
    generatePDF(inscricoes, {
      nome: filtroNome || undefined,
      cpf: filtroCpf || undefined,
      igreja: filtroIgreja || undefined,
      pastor: filtroPastor || undefined,
      cargo: selectedCargos.length > 0 ? selectedCargos.join(', ') : undefined,
      funcao: filtroFuncao || undefined,
    }, exportColumns);
  };

  
  // Opções únicas para dropdowns
  const [igrejas, setIgrejas] = useState<string[]>([]);
  const [pastores, setPastores] = useState<string[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  const [funcoes, setFuncoes] = useState<string[]>([]);

  // fetchInscricoes com useCallback garante que o useEffect sempre usa a versão
  // atualizada com os valores corretos dos filtros (sem stale closure)
  const fetchInscricoes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('inscricoes_batismo')
        .select('*')
        .order('nome', { ascending: true });

      if (filtroNome)   query = query.ilike('nome', `%${filtroNome}%`);
      if (filtroCpf)    query = query.ilike('cpf', `%${filtroCpf}%`);
      if (filtroIgreja) query = query.ilike('igreja', filtroIgreja);
      if (filtroPastor) query = query.ilike('pastor', filtroPastor);
      if (filtroFuncao) query = query.ilike('funcao', filtroFuncao);

      // Aplicar filtro de múltiplos cargos se selecionados nas checkboxes (case-insensitive via ilike)
      if (selectedCargos.length > 0) {
        const orQuery = selectedCargos.map(cargo => `cargo.ilike.%${cargo}%`).join(',');
        query = query.or(orQuery);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInscricoes(data || []);
      // Limpar pendências ao recarregar
      setPendingChanges({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, filtroNome, filtroCpf, filtroIgreja, filtroPastor, filtroFuncao, selectedCargos]);

  // Buscar opções dos dropdowns apenas uma vez ao autenticar
  useEffect(() => {
    if (user) fetchOpcoes();
  }, [user]);

  // Re-buscar sempre que os filtros mudarem (com debounce de 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInscricoes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchInscricoes]); // fetchInscricoes já inclui todas as deps de filtro via useCallback

  const fetchOpcoes = async () => {
    try {
      const { data: igrejasData } = await supabase
        .from('inscricoes_batismo')
        .select('igreja')
        .order('igreja');
      const { data: pastoresData } = await supabase
        .from('inscricoes_batismo')
        .select('pastor')
        .order('pastor');
      const { data: cargosData } = await supabase
        .from('inscricoes_batismo')
        .select('cargo')
        .order('cargo');
      const { data: funcoesData } = await supabase
        .from('inscricoes_batismo')
        .select('funcao')
        .order('funcao');

      // Normalizar em maiúsculo e remover duplicadas
      setIgrejas(Array.from(new Set(igrejasData?.map(i => i.igreja?.trim().toUpperCase()).filter(Boolean) || [])));
      setPastores(Array.from(new Set(pastoresData?.map(p => p.pastor?.trim().toUpperCase()).filter(Boolean) || [])));
      setCargos(Array.from(new Set(cargosData?.map(c => c.cargo?.trim().toUpperCase()).filter(Boolean) || [])));
      setFuncoes(Array.from(new Set(funcoesData?.map(f => f.funcao?.trim().toUpperCase()).filter(Boolean) || [])));
    } catch (err) {
      console.error('Erro ao buscar opções:', err);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a inscrição de ${nome}?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('inscricoes_batismo')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Inscrição excluída com sucesso!');
      fetchInscricoes();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };


  const limparFiltros = () => {
    // Apenas limpar os estados — o useEffect + useCallback cuidam de re-buscar
    // com os valores zerados automaticamente
    setFiltroNome('');
    setFiltroCpf('');
    setFiltroIgreja('');
    setFiltroPastor('');
    setFiltroFuncao('');
    setSelectedCargos([]);
  };

  // ---------------------------------------------------------------------------
  // AD Salvador — Toggle e Salvar
  // ---------------------------------------------------------------------------
  const handleToggleAdSalvador = (id: string, valorAtual: boolean) => {
    const novoValor = !valorAtual;

    // Atualizar visualmente a lista local imediatamente
    setInscricoes((prev) =>
      prev.map((insc) =>
        insc.id === id ? { ...insc, cadastrado_ad_salvador: novoValor } : insc
      )
    );

    // Registrar como pendência
    setPendingChanges((prev) => ({ ...prev, [id]: novoValor }));
    setSaveSuccess(false);
  };

  const handleSalvarAdSalvador = async () => {
    const ids = Object.keys(pendingChanges);
    if (ids.length === 0) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Agrupar por valor para fazer menos chamadas
      const paraTrue = ids.filter((id) => pendingChanges[id] === true);
      const paraFalse = ids.filter((id) => pendingChanges[id] === false);

      const promises: PromiseLike<any>[] = [];

      if (paraTrue.length > 0) {
        promises.push(
          supabase
            .from('inscricoes_batismo')
            .update({ cadastrado_ad_salvador: true })
            .in('id', paraTrue)
        );
      }
      if (paraFalse.length > 0) {
        promises.push(
          supabase
            .from('inscricoes_batismo')
            .update({ cadastrado_ad_salvador: false })
            .in('id', paraFalse)
        );
      }

      const results = await Promise.all(promises);
      for (const r of results) {
        if (r.error) throw r.error;
      }

      setPendingChanges({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;

  // Mostrar loading apenas enquanto a auth ainda não foi resolvida
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  // Se auth já resolveu e não há usuário, o useEffect já redirecionou
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-900">
      {/* Top Banner de Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md shadow-2xl text-white">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Membros &amp; Inscrições
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão unificada, contatos diretos no WhatsApp e relatórios cadastrais completos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 rounded-xl"
          >
            Exportar PDF
          </Button>
          <Button
            onClick={() => generateExcel(inscricoes)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 rounded-xl"
          >
            Exportar Excel (XLSX)
          </Button>
        </div>
      </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Painel AD Salvador */}
        <PainelAdSalvador inscricoes={inscricoes} />

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-medium mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={filtroCpf}
                onChange={(e) => setFiltroCpf(e.target.value)}
                placeholder="Buscar por CPF..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Igreja
              </label>
              <select
                value={filtroIgreja}
                onChange={(e) => setFiltroIgreja(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todas</option>
                {igrejas.map((igreja) => (
                  <option key={igreja} value={igreja}>{igreja}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastor
              </label>
              <select
                value={filtroPastor}
                onChange={(e) => setFiltroPastor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                {pastores.map((pastor) => (
                  <option key={pastor} value={pastor}>{pastor}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função
              </label>
              <select
                value={filtroFuncao}
                onChange={(e) => setFiltroFuncao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todas</option>
                {funcoes.map((funcao) => (
                  <option key={funcao} value={funcao}>{funcao}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t pt-4 mt-2">
            <div className="flex gap-2">
              <Button onClick={fetchInscricoes}>Aplicar Filtros</Button>
              <Button variant="outline" onClick={limparFiltros}>Limpar Filtros</Button>
            </div>

            {/* Divisor vertical */}
            <div className="hidden md:block h-6 w-px bg-gray-200" />

            {/* Checkboxes de colunas do PDF */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[100px]">Colunas PDF:</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.cpf} onChange={(e) => setExportColumns({...exportColumns, cpf: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>CPF</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.igrejaPastor} onChange={(e) => setExportColumns({...exportColumns, igrejaPastor: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Igreja/Pastor</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.idade} onChange={(e) => setExportColumns({...exportColumns, idade: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Idade</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.telefone} onChange={(e) => setExportColumns({...exportColumns, telefone: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Tel</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.cargoFuncao} onChange={(e) => setExportColumns({...exportColumns, cargoFuncao: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Cargo/Função</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.estadoCivil} onChange={(e) => setExportColumns({...exportColumns, estadoCivil: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Est. Civil</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={exportColumns.endereco} onChange={(e) => setExportColumns({...exportColumns, endereco: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Endereço</span>
                </label>
              </div>
            </div>

            {/* Divisor vertical */}
            <div className="hidden lg:block h-6 w-px bg-gray-200" />

            {/* Checkboxes de Cargos */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[100px]">Filtrar Cargos:</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {['MEMBRO', 'AUXILIAR', 'DIÁCONO', 'PRESBÍTERO', 'EVANGELISTA', 'PASTOR'].map((cargo) => (
                  <label key={cargo} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedCargos.includes(cargo)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCargos([...selectedCargos, cargo]);
                        } else {
                          setSelectedCargos(selectedCargos.filter((c) => c !== cargo));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{cargo}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Salvamento AD Salvador */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-sm font-semibold">
                {pendingCount} alteração{pendingCount !== 1 ? 'ões' : ''} pendente{pendingCount !== 1 ? 's' : ''} — AD Salvador
              </span>
            </div>
            <Button
              onClick={handleSalvarAdSalvador}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg px-5 shadow"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Salvar Alterações
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Feedback de Sucesso */}
        {saveSuccess && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-sm font-semibold">Alterações salvas com sucesso na plataforma AD Salvador!</span>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[65vh]" style={{ scrollbarGutter: 'stable' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                <tr>
                  {/* Coluna AD Salvador */}
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-emerald-600 font-bold">AD</span>
                      <span>Salvador</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  {exportColumns.cpf && (
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                  )}
                  {exportColumns.idade && (
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idade
                    </th>
                  )}
                  {exportColumns.telefone && (
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                  )}
                  {exportColumns.cargoFuncao && (
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo/Função
                    </th>
                  )}
                  {exportColumns.estadoCivil && (
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Civil
                    </th>
                  )}
                  {exportColumns.endereco && (
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endereço
                    </th>
                  )}
                  {exportColumns.igrejaPastor && (
                    <>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Igreja
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pastor
                      </th>
                    </>
                  )}
                  <th className="w-32 px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider pl-3 pr-6">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inscricoes.map((inscricao) => {
                  const isOk = !!inscricao.cadastrado_ad_salvador;
                  const isPending = inscricao.id in pendingChanges;
                  return (
                    <tr
                      key={inscricao.id}
                      className={`transition-colors duration-200 ${
                        isOk
                          ? 'bg-emerald-50 hover:bg-emerald-100/70'
                          : 'hover:bg-slate-50'
                      } ${isPending ? 'ring-1 ring-inset ring-amber-300' : ''}`}
                    >
                      {/* Checkbox AD Salvador */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <label className="relative cursor-pointer" title={isOk ? 'Já cadastrado na AD Salvador' : 'Ainda não cadastrado na AD Salvador'}>
                            <input
                              type="checkbox"
                              checked={isOk}
                              onChange={() => handleToggleAdSalvador(inscricao.id, isOk)}
                              className="sr-only peer"
                            />
                            <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${isOk ? 'bg-emerald-500' : 'bg-gray-200'} peer-focus:ring-2 peer-focus:ring-emerald-400 peer-focus:ring-offset-1`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm mt-0.5 transition-transform duration-200 ${isOk ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                            </div>
                          </label>
                          {isOk && (
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide leading-none">OK</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isOk && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          )}
                          <span>{inscricao.nome}</span>
                          {inscricao.foto_url && (
                            <div className="relative group inline-block">
                              <span className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                              </span>
                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-white p-1 rounded-lg shadow-xl border border-slate-200 pointer-events-none">
                                <div className="w-20 h-24 rounded overflow-hidden">
                                  <img src={inscricao.foto_url} alt="Foto do Membro" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      {exportColumns.cpf && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {inscricao.cpf}
                        </td>
                      )}
                      {exportColumns.idade && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {calcularIdade(inscricao.data_nascimento)} anos
                        </td>
                      )}
                      {exportColumns.telefone && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {inscricao.telefone}
                        </td>
                      )}
                      {exportColumns.cargoFuncao && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {[inscricao.cargo, inscricao.funcao].filter(Boolean).join(' - ') || '-'}
                        </td>
                      )}
                      {exportColumns.estadoCivil && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {inscricao.estado_civil || '-'}
                        </td>
                      )}
                      {exportColumns.endereco && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {inscricao.cidade ? `${inscricao.cidade}/${inscricao.estado}` : '-'}
                        </td>
                      )}
                      {exportColumns.igrejaPastor && (
                        <>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {inscricao.igreja}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {inscricao.pastor}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium pl-3 pr-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <WhatsAppButton
                            telefone={inscricao.telefone}
                            nome={inscricao.nome}
                            igreja={inscricao.igreja}
                            variant="icon"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setViewModalData(inscricao)}
                          >
                            Ver
                          </Button>
                          {isMaster && (
                            <>
                              <Link href={`/admin/inscricoes/${inscricao.id}/edit`}>
                                <Button size="sm" variant="outline">Editar</Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(inscricao.id, inscricao.nome)}
                              >
                                Excluir
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {inscricoes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma inscrição encontrada.
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Total: {inscricoes.length} inscrição(ões) — {inscricoes.filter(i => i.cadastrado_ad_salvador).length} cadastrado(s) na AD Salvador
        </div>

      {/* Modal de Visualização */}
      {viewModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setViewModalData(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 border-b pb-2">Detalhes da Inscrição</h2>

            {/* Badge AD Salvador no modal */}
            {viewModalData.cadastrado_ad_salvador ? (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Cadastrado na AD Salvador
              </div>
            ) : (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Pendente na AD Salvador
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {viewModalData.foto_url && (
                <div className="flex-shrink-0 flex justify-center items-start">
                  <div className="w-40 h-48 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    <img src={viewModalData.foto_url} alt="Foto do Membro" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Informações Pessoais</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Nome:</span> {viewModalData.nome}</p>
                    <p><span className="font-semibold text-gray-900">CPF:</span> {viewModalData.cpf}</p>
                    <p><span className="font-semibold text-gray-900">RG:</span> {viewModalData.rg || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Naturalidade:</span> {viewModalData.naturalidade || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Data de Nasc.:</span> {formatDateISOToBR(viewModalData.data_nascimento)} ({calcularIdade(viewModalData.data_nascimento)} anos)</p>
                    <div className="pt-1">
                      <span className="font-semibold text-gray-900">Filiação:</span>
                      <div className="pl-3 border-l-2 border-slate-100 mt-1">
                        <p><span className="font-medium text-gray-600">Pai:</span> {viewModalData.nome_pai || '-'}</p>
                        <p><span className="font-medium text-gray-600">Mãe:</span> {viewModalData.nome_mae || '-'}</p>
                      </div>
                    </div>
                    <p><span className="font-semibold text-gray-900">Estado Civil:</span> {viewModalData.estado_civil || '-'}</p>
                    {(viewModalData.estado_civil === "Casado" || viewModalData.nome_conjuge) && (
                      <p><span className="font-semibold text-gray-900">Cônjuge:</span> {viewModalData.nome_conjuge || '-'}</p>
                    )}
                    <p><span className="font-semibold text-gray-900">Telefone:</span> {viewModalData.telefone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Igreja e Ministério</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Igreja:</span> {viewModalData.igreja}</p>
                    <p><span className="font-semibold text-gray-900">Pastor:</span> {viewModalData.pastor}</p>
                    <p><span className="font-semibold text-gray-900">Cargo:</span> {viewModalData.cargo || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Função:</span> {viewModalData.funcao || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Data Batismo:</span> {formatDateISOToBR(viewModalData.data_batismo) || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Data Consagração:</span> {formatDateISOToBR(viewModalData.data_consagracao) || '-'}</p>
                  </div>
                </div>

                <div className="sm:col-span-2 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Endereço</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Rua:</span> {viewModalData.rua || '-'}, Nº {viewModalData.numero || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Bairro:</span> {viewModalData.bairro || '-'}</p>
                    <p><span className="font-semibold text-gray-900">Cidade/UF:</span> {viewModalData.cidade || '-'}/{viewModalData.estado || '-'}</p>
                    <p><span className="font-semibold text-gray-900">CEP:</span> {viewModalData.cep || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t pt-4">
              <WhatsAppButton
                telefone={viewModalData.telefone}
                nome={viewModalData.nome}
                igreja={viewModalData.igreja}
                variant="full"
              />
              <Button
                variant="default"
                onClick={() => {
                  generateIndividualPDF(viewModalData);
                }}
              >
                Baixar PDF
              </Button>
              <Button variant="outline" onClick={() => setViewModalData(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
