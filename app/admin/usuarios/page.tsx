"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateISOToBR } from '@/lib/utils';
import { KeyRound, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface PerfilUsuario {
  id: string;
  email: string;
  status: string;
  role: string;
  created_at: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { user, loading: authLoading, isMaster } = useAuth();
  
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Troca de Senha
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PerfilUsuario | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Notificação global temporária
  const [globalFeedback, setGlobalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (!isMaster) {
        router.push('/admin/dashboard');
      } else {
        fetchUsuarios();
      }
    }
  }, [user, authLoading, isMaster, router]);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfil_usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase
      .from('perfil_usuarios')
      .update({ status: novoStatus })
      .eq('id', id);
    
    if (!error) {
      setGlobalFeedback({ type: 'success', message: 'Status do usuário atualizado com sucesso!' });
      fetchUsuarios();
      setTimeout(() => setGlobalFeedback(null), 4000);
    } else {
      setGlobalFeedback({ type: 'error', message: 'Erro ao atualizar status: ' + error.message });
      setTimeout(() => setGlobalFeedback(null), 5000);
    }
  };

  const updateRole = async (id: string, novaRole: string) => {
    const { error } = await supabase
      .from('perfil_usuarios')
      .update({ role: novaRole })
      .eq('id', id);
    
    if (!error) {
      setGlobalFeedback({ type: 'success', message: 'Cargo do usuário atualizado com sucesso!' });
      fetchUsuarios();
      setTimeout(() => setGlobalFeedback(null), 4000);
    } else {
      setGlobalFeedback({ type: 'error', message: 'Erro ao atualizar cargo: ' + error.message });
      setTimeout(() => setGlobalFeedback(null), 5000);
    }
  };

  const openPasswordModal = (usuario: PerfilUsuario) => {
    setSelectedUser(usuario);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setModalError(null);
    setModalSuccess(null);
    setModalOpen(true);
  };

  const closePasswordModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Validações locais
    if (!newPassword || newPassword.length < 6) {
      setModalError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('As senhas digitadas não coincidem.');
      return;
    }

    setPasswordLoading(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      // Obter a sessão atual para o Bearer Token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      // 1. Tentar chamada à API interna
      const response = await fetch('/api/admin/alterar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Se a API retornar erro, tentar fallback direto via RPC Supabase
        const { data: rpcData, error: rpcError } = await supabase.rpc('alterar_senha_usuario', {
          usuario_id: selectedUser.id,
          nova_senha: newPassword,
        });

        if (rpcError) {
          throw new Error(result.error || rpcError.message || 'Erro ao alterar a senha.');
        }
      }

      setModalSuccess(`Senha de ${selectedUser.email} alterada com sucesso!`);
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        closePasswordModal();
        setGlobalFeedback({
          type: 'success',
          message: `Senha do usuário ${selectedUser.email} atualizada com sucesso.`,
        });
        setTimeout(() => setGlobalFeedback(null), 5000);
      }, 1500);

    } catch (err: any) {
      setModalError(err.message || 'Ocorreu um erro ao atualizar a senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 font-medium">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de Navegação */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider">
                Acesso Master
              </span>
              <h1 className="text-base sm:text-xl font-bold text-gray-900">
                Gerenciamento de Acessos & Senhas
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Feedback Global */}
        {globalFeedback && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-between shadow-sm transition-all ${
              globalFeedback.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {globalFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{globalFeedback.message}</span>
            </div>
            <button
              onClick={() => setGlobalFeedback(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Usuários Cadastrados</h2>
              <p className="text-xs text-gray-500">
                Como Master, você pode gerenciar cargos, aprovar cadastros e alterar senhas de acesso.
              </p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Total: <strong>{usuarios.length}</strong> usuário(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camada (Cargo)
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.email}</div>
                      {u.id === user?.id && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded">
                          Você
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDateISOToBR(u.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.status}
                        onChange={(e) => updateStatus(u.id, e.target.value)}
                        disabled={u.id === user?.id}
                        className={`text-xs sm:text-sm font-medium rounded-md border-gray-300 shadow-sm px-3 py-1 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                          u.status === 'aprovado'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : u.status === 'bloqueado'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="bloqueado">Bloqueado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        disabled={u.id === user?.id}
                        className={`text-xs sm:text-sm font-medium rounded-md border-gray-300 shadow-sm px-3 py-1 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                          u.role === 'master'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="padrao">Padrão</option>
                        <option value="master">Master</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPasswordModal(u)}
                        className="inline-flex items-center gap-1.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300"
                        title={`Alterar senha de ${u.email}`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Alterar Senha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Alteração de Senha */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Fechar modal */}
            <button
              onClick={closePasswordModal}
              disabled={passwordLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Alterar Senha de Acesso</h3>
                <p className="text-xs text-gray-500 truncate max-w-[280px]">
                  Usuário: <span className="font-semibold text-gray-700">{selectedUser.email}</span>
                </p>
              </div>
            </div>

            {/* Mensagem de Erro no Modal */}
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed">{modalError}</p>
              </div>
            )}

            {/* Mensagem de Sucesso no Modal */}
            {modalSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-800 leading-relaxed font-medium">{modalSuccess}</p>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={passwordLoading || !!modalSuccess}
                    className="pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirmar Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    disabled={passwordLoading || !!modalSuccess}
                    className="pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={passwordLoading || !!modalSuccess}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {passwordLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
