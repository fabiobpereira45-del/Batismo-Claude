"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { generatePDF } from '@/lib/pdf-generator';

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <div className="space-x-4 flex items-center flex-wrap gap-y-2">
            {isMaster && (
              <Link href="/admin/usuarios">
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700">Gerenciar Acessos</Button>
              </Link>
            )}
            <Link href="/admin/estatisticas">
              <Button variant="secondary">Ver Estatísticas</Button>
            </Link>
            <Link href="/admin/inscricoes">
              <Button>Ver Todas Inscrições</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-500">Total de Inscrições</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-500">Igrejas</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Object.keys(stats.porIgreja).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-500">Pastores</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Object.keys(stats.porPastor).length}
            </p>
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
    </div>
  );
}
