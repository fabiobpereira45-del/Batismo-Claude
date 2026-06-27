"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      fetchUsuarios();
    }
  };

  const updateRole = async (id: string, novaRole: string) => {
    const { error } = await supabase
      .from('perfil_usuarios')
      .update({ role: novaRole })
      .eq('id', id);
    
    if (!error) {
      fetchUsuarios();
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-base sm:text-xl font-bold text-gray-900">Gerenciamento de Acessos</h1>
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
        <div className="bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={u.status}
                      onChange={(e) => updateStatus(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                      className={`text-sm rounded-md border-gray-300 shadow-sm px-3 py-1 ${
                        u.status === 'aprovado' ? 'bg-green-100 text-green-800' : 
                        u.status === 'bloqueado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
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
                      className={`text-sm rounded-md border-gray-300 shadow-sm px-3 py-1 ${
                        u.role === 'master' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="padrao">Padrão</option>
                      <option value="master">Master</option>
                    </select>
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
      </main>
    </div>
  );
}
