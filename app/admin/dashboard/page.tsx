"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { generatePDF } from '@/lib/pdf-generator';
import WhatsAppButton from '@/components/ui/whatsapp-button';
import { Users, Building2, UserCheck, Sparkles, Download } from 'lucide-react';

interface Inscricao {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  igreja: string;
  pastor: string;
  cargo: string;
  funcao: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  estado_civil: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, isMaster, signOut } = useAuth();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    porIgreja: {} as Record<string, number>,
    porPastor: {} as Record<string, number>,
  });
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroIgreja, setFiltroIgreja] = useState('');
  const [filtroPastor, setFiltroPastor] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMessage('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setUpdatingPassword(true);
    setPasswordMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      setPasswordMessage('Erro ao atualizar: ' + error.message);
    } else {
      setPasswordMessage('Senha atualizada com sucesso!');
      setNewPassword('');
    }
  };

  // Redirecionar se não houver usuário logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchInscricoes();
    }
  }, [user]);

  const fetchInscricoes = async () => {
    try {
      setLoadingData(true);
      let query = supabase
        .from('inscricoes_batismo')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtroNome) {
        query = query.ilike('nome', `%${filtroNome}%`);
      }
      if (filtroIgreja) {
        query = query.ilike('igreja', `%${filtroIgreja}%`);
      }
      if (filtroPastor) {
        query = query.ilike('pastor', `%${filtroPastor}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setInscricoes(data || []);

      // Calcular estatísticas
      const porIgreja: Record<string, number> = {};
      const porPastor: Record<string, number> = {};

      data?.forEach((item) => {
        porIgreja[item.igreja] = (porIgreja[item.igreja] || 0) + 1;
        porPastor[item.pastor] = (porPastor[item.pastor] || 0) + 1;
      });

      setStats({
        total: data?.length || 0,
        porIgreja,
        porPastor,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    signOut(); // limpa estado imediatamente, revoga sessão em background
    router.push('/admin/login');
  };

  const handleDownloadPDF = () => {
    generatePDF(inscricoes, {
      nome: filtroNome || undefined,
      igreja: filtroIgreja || undefined,
      pastor: filtroPastor || undefined,
    });
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Visão Geral do Sistema
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Painel de controle setorial, métricas consolidadas e gerenciamento de congregações.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Relatório em PDF</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Cards de Estatísticas com Estética Total-Gestão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Total de Membros</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 leading-none">{stats.total}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">Cadastros ativos no banco raiz</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Congregações</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 leading-none">{Object.keys(stats.porIgreja).length}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">Igrejas representadas</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Liderança / Pastores</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 leading-none">{Object.keys(stats.porPastor).length}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">Pastores responsáveis</span>
        </div>
      </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Filtros</h2>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              Baixar PDF com Filtros
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Igreja
              </label>
              <input
                type="text"
                value={filtroIgreja}
                onChange={(e) => setFiltroIgreja(e.target.value)}
                placeholder="Buscar por igreja..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastor
              </label>
              <input
                type="text"
                value={filtroPastor}
                onChange={(e) => setFiltroPastor(e.target.value)}
                placeholder="Buscar por pastor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Últimas Inscrições */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Últimas Inscrições</h2>
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
                    Igreja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inscricoes.slice(0, 5).map((inscricao) => (
                  <tr key={inscricao.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inscricao.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inscricao.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inscricao.igreja}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <WhatsAppButton
                        telefone={inscricao.telefone}
                        nome={inscricao.nome}
                        igreja={inscricao.igreja}
                        variant="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inscricoes.length > 5 && (
            <div className="mt-4 text-center">
              <Link href="/admin/inscricoes">
                <Button variant="link">Ver todas ({inscricoes.length})</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Trocar Senha */}
        {isMaster && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Configurações (Trocar Senha)</h2>
            <div className="max-w-md">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="No mínimo 6 caracteres"
                />
              </div>
              <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
                {updatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
              {passwordMessage && (
                <p className={`mt-2 text-sm ${passwordMessage.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordMessage}
                </p>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
