"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generatePDF, generateIndividualPDF } from '@/lib/pdf-generator';
import { useAuth } from '@/lib/auth-context';

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
}

export default function InscricoesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isMaster } = useAuth();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModalData, setViewModalData] = useState<Inscricao | null>(null);

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
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroFuncao, setFiltroFuncao] = useState('');

  // Exportar PDF Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    nome: true,
    cpf: true,
    igreja: true,
    pastor: true,
    cargo: true,
    funcao: true,
  });
  const [exportColumns, setExportColumns] = useState({
    nome: true,
    cpf: true,
    idade: true,
    telefone: true,
    cargoFuncao: true,
    estadoCivil: true,
    endereco: true,
    igrejaPastor: true,
  });

  const openExportModal = () => {
    setExportModalOpen(true);
  };

  const handleExportPDF = () => {
    generatePDF(inscricoes, {
      nome: exportFilters.nome && filtroNome ? filtroNome : undefined,
      cpf: exportFilters.cpf && filtroCpf ? filtroCpf : undefined,
      igreja: exportFilters.igreja && filtroIgreja ? filtroIgreja : undefined,
      pastor: exportFilters.pastor && filtroPastor ? filtroPastor : undefined,
      cargo: exportFilters.cargo && filtroCargo ? filtroCargo : undefined,
      funcao: exportFilters.funcao && filtroFuncao ? filtroFuncao : undefined,
    }, exportColumns);
    setExportModalOpen(false);
  };

  
  // Opções únicas para dropdowns
  const [igrejas, setIgrejas] = useState<string[]>([]);
  const [pastores, setPastores] = useState<string[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  const [funcoes, setFuncoes] = useState<string[]>([]);

  useEffect(() => {
    // Só busca as opções de filtro quando o usuário está autenticado
    if (user) {
      fetchOpcoes();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return; // Só busca se o usuário estiver logado
    
    const delayDebounceFn = setTimeout(() => {
      fetchInscricoes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [user, filtroNome, filtroCpf, filtroIgreja, filtroPastor, filtroCargo, filtroFuncao]);

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

      const igrejasUnicas = Array.from(new Set(igrejasData?.map(i => i.igreja) || []));
      const pastoresUnicos = Array.from(new Set(pastoresData?.map(p => p.pastor) || []));
      const cargosUnicos = Array.from(new Set(cargosData?.map(c => c.cargo).filter(Boolean) || []));
      const funcoesUnicas = Array.from(new Set(funcoesData?.map(f => f.funcao).filter(Boolean) || []));
      
      setIgrejas(igrejasUnicas);
      setPastores(pastoresUnicos);
      setCargos(cargosUnicos);
      setFuncoes(funcoesUnicas);
    } catch (err) {
      console.error('Erro ao buscar opções:', err);
    }
  };

  const fetchInscricoes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('inscricoes_batismo')
        .select('*')
        .order('nome', { ascending: true });

      // Aplicar filtros
      if (filtroNome) {
        query = query.ilike('nome', `%${filtroNome}%`);
      }
      if (filtroCpf) {
        query = query.ilike('cpf', `%${filtroCpf}%`);
      }
      if (filtroIgreja) {
        query = query.eq('igreja', filtroIgreja);
      }
      if (filtroPastor) {
        query = query.eq('pastor', filtroPastor);
      }
      if (filtroCargo) {
        query = query.eq('cargo', filtroCargo);
      }
      if (filtroFuncao) {
        query = query.eq('funcao', filtroFuncao);
      }


      const { data, error } = await query;

      if (error) throw error;
      setInscricoes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesDiff = hoje.getMonth() - nascimento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroCpf('');
    setFiltroIgreja('');
    setFiltroPastor('');
    setFiltroCargo('');
    setFiltroFuncao('');

    fetchInscricoes();
  };

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inscrições</h1>
          <div className="flex gap-2">
            <Button
              onClick={openExportModal}
              variant="outline"
            >
              Exportar PDF
            </Button>
            <Link href="/admin/estatisticas">
              <Button variant="secondary">Estatísticas</Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

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
                Cargo
              </label>
              <select
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                {cargos.map((cargo) => (
                  <option key={cargo} value={cargo}>{cargo}</option>
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
          <div className="flex gap-2">
            <Button onClick={fetchInscricoes}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={limparFiltros}>Limpar Filtros</Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Idade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Igreja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pastor
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inscricoes.map((inscricao) => (
                  <tr key={inscricao.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inscricao.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inscricao.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calcularIdade(inscricao.data_nascimento)} anos
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inscricao.igreja}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inscricao.pastor}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
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
                ))}
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
          Total: {inscricoes.length} inscrição(ões)
        </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Detalhes da Inscrição</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Informações Pessoais</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium text-gray-900">Nome:</span> {viewModalData.nome}</p>
                  <p><span className="font-medium text-gray-900">CPF:</span> {viewModalData.cpf}</p>
                  <p><span className="font-medium text-gray-900">Data de Nasc.:</span> {new Date(viewModalData.data_nascimento).toLocaleDateString('pt-BR')} ({calcularIdade(viewModalData.data_nascimento)} anos)</p>
                  <p><span className="font-medium text-gray-900">Estado Civil:</span> {viewModalData.estado_civil || '-'}</p>
                  <p><span className="font-medium text-gray-900">Telefone:</span> {viewModalData.telefone}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Igreja e Ministério</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium text-gray-900">Igreja:</span> {viewModalData.igreja}</p>
                  <p><span className="font-medium text-gray-900">Pastor:</span> {viewModalData.pastor}</p>
                  <p><span className="font-medium text-gray-900">Cargo:</span> {viewModalData.cargo || '-'}</p>
                  <p><span className="font-medium text-gray-900">Função:</span> {viewModalData.funcao || '-'}</p>
                  <p><span className="font-medium text-gray-900">Data Consagração:</span> {viewModalData.data_consagracao ? new Date(viewModalData.data_consagracao).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Endereço</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium text-gray-900">Rua:</span> {viewModalData.rua || '-'}, Nº {viewModalData.numero || '-'}</p>
                  <p><span className="font-medium text-gray-900">Bairro:</span> {viewModalData.bairro || '-'}</p>
                  <p><span className="font-medium text-gray-900">Cidade/UF:</span> {viewModalData.cidade || '-'}/{viewModalData.estado || '-'}</p>
                  <p><span className="font-medium text-gray-900">CEP:</span> {viewModalData.cep || '-'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
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
      {/* Modal de Exportação PDF */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setExportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Exportar PDF</h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Colunas para Imprimir</h3>
              <p className="text-xs text-gray-500 mb-3">Selecione quais dados devem aparecer na tabela do PDF:</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.nome} onChange={(e) => setExportColumns({...exportColumns, nome: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Nome</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.cpf} onChange={(e) => setExportColumns({...exportColumns, cpf: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">CPF</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.idade} onChange={(e) => setExportColumns({...exportColumns, idade: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Idade</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.telefone} onChange={(e) => setExportColumns({...exportColumns, telefone: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Telefone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.cargoFuncao} onChange={(e) => setExportColumns({...exportColumns, cargoFuncao: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Cargo/Função</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.estadoCivil} onChange={(e) => setExportColumns({...exportColumns, estadoCivil: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Est. Civil</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.endereco} onChange={(e) => setExportColumns({...exportColumns, endereco: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Endereço</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportColumns.igrejaPastor} onChange={(e) => setExportColumns({...exportColumns, igrejaPastor: e.target.checked})} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">Igreja/Pastor</span>
                </label>
              </div>
            </div>

            {(filtroNome || filtroCpf || filtroIgreja || filtroPastor || filtroCargo || filtroFuncao) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 border-t pt-4">Filtros no Cabeçalho</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Selecione quais filtros aplicados você deseja exibir no cabeçalho do PDF:
                </p>
                <div className="space-y-2">
                  {filtroNome && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={exportFilters.nome} onChange={(e) => setExportFilters({...exportFilters, nome: e.target.checked})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Nome: <span className="font-medium">{filtroNome}</span></span>
                    </label>
                  )}
                  {filtroCpf && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={exportFilters.cpf} onChange={(e) => setExportFilters({...exportFilters, cpf: e.target.checked})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">CPF: <span className="font-medium">{filtroCpf}</span></span>
                    </label>
                  )}
                  {filtroIgreja && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={exportFilters.igreja} onChange={(e) => setExportFilters({...exportFilters, igreja: e.target.checked})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Igreja: <span className="font-medium">{filtroIgreja}</span></span>
                    </label>
                  )}
                  {filtroPastor && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={exportFilters.pastor} onChange={(e) => setExportFilters({...exportFilters, pastor: e.target.checked})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Pastor: <span className="font-medium">{filtroPastor}</span></span>
                    </label>
                  )}
                  {filtroCargo && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={exportFilters.cargo} onChange={(e) => setExportFilters({...exportFilters, cargo: e.target.checked})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Cargo: <span className="font-medium">{filtroCargo}</span></span>
                    </label>
                  )}
                  {filtroFuncao && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={exportFilters.funcao} onChange={(e) => setExportFilters({...exportFilters, funcao: e.target.checked})} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Função: <span className="font-medium">{filtroFuncao}</span></span>
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setExportModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExportPDF}>
                Gerar PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
