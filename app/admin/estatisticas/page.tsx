"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { calcularIdade } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Inscricao {
  id: string;
  data_nascimento: string;
  igreja: string;
  pastor: string;
  cargo: string;
  funcao: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#f472b6', '#fb923c'];

export default function EstatisticasPage() {
  const router = useRouter();
  const { user, loading, isMaster } = useAuth();
  
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dados processados para os gráficos
  const [mediaIdade, setMediaIdade] = useState(0);
  const [totalInscritos, setTotalInscritos] = useState(0);
  
  const [dadosIgreja, setDadosIgreja] = useState<any[]>([]);
  const [dadosPastor, setDadosPastor] = useState<any[]>([]);
  const [dadosCargo, setDadosCargo] = useState<any[]>([]);
  const [dadosFuncao, setDadosFuncao] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);



  const processDataForChart = (data: Inscricao[], key: keyof Inscricao) => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      let val = item[key] as string;
      if (!val || val.trim() === '') val = 'Não informado';
      counts[val] = (counts[val] || 0) + 1;
    });
    
    return Object.keys(counts).map(k => ({
      name: k,
      value: counts[k]
    })).sort((a, b) => b.value - a.value); // Ordena do maior para o menor
  };

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('inscricoes_batismo')
        .select('id, data_nascimento, igreja, pastor, cargo, funcao');

      if (error) throw error;

      const inscricoes = data || [];
      setTotalInscritos(inscricoes.length);

      if (inscricoes.length > 0) {
        // Calcular média de idade
        const totalIdades = inscricoes.reduce((acc, curr) => {
           if (curr.data_nascimento) {
             const idade = calcularIdade(curr.data_nascimento);
             return acc + (typeof idade === 'number' ? idade : 0);
           }
           return acc;
        }, 0);
        
        const comIdadeValida = inscricoes.filter(i => i.data_nascimento).length;
        setMediaIdade(comIdadeValida > 0 ? Math.round(totalIdades / comIdadeValida) : 0);

        // Processar dados para gráficos
        setDadosIgreja(processDataForChart(inscricoes, 'igreja'));
        setDadosPastor(processDataForChart(inscricoes, 'pastor'));
        setDadosCargo(processDataForChart(inscricoes, 'cargo'));
        setDadosFuncao(processDataForChart(inscricoes, 'funcao'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    if (percent < 0.05) return null; // Não mostra label para fatias muito pequenas
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0f172a]/90 border border-white/10 backdrop-blur-md shadow-2xl text-white">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Estatísticas e Gráficos Setoriais</h1>
          <p className="text-xs text-slate-400 mt-1">
            Distribuição demográfica, pirâmide etária e relatórios analíticos por congregação e liderança.
          </p>
        </div>
      </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Calculando estatísticas e renderizando gráficos...</p>
          </div>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Total de Inscrições</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalInscritos}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Média de Idade</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{mediaIdade} <span className="text-lg font-normal text-gray-500">anos</span></p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Total de Igrejas</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dadosIgreja.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Total de Pastores</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dadosPastor.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfico de Cargos */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Distribuição por Cargo</h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosCargo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosCargo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} pessoas`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Funções */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Distribuição por Função</h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosFuncao}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosFuncao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} pessoas`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 mb-8">
              {/* Gráfico de Igrejas */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Cadastros por Igreja</h2>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosIgreja}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        interval={0}
                        height={90}
                        tick={{fontSize: 12}}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value: any) => [`${value} cadastros`, 'Quantidade']} />
                      <Bar dataKey="value" fill="#3b82f6" name="Quantidade" radius={[4, 4, 0, 0]}>
                        {dadosIgreja.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Pastores */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Cadastros por Pastor</h2>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosPastor}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        interval={0}
                        height={90}
                        tick={{fontSize: 12}}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value: any) => [`${value} cadastros`, 'Quantidade']} />
                      <Bar dataKey="value" fill="#10b981" name="Quantidade" radius={[4, 4, 0, 0]}>
                         {dadosPastor.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
