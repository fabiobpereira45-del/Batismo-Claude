"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Inscricao {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  data_consagracao?: string;
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
  nome_conjuge?: string;
}

const igrejasData = [
  { nome: "ADMTN - ARENOSO I", pastor: "PR. Nicodemos Glória" },
  { nome: "ADMTN - ARENOSO II", pastor: "PB. NATANAEL SANTANA" },
  { nome: "ADMTN - ARENOSO III", pastor: "BP. Marcelo da Paixão" },
  { nome: "ADMTN - CABULA VII", pastor: "Pb. Jeferson Guedes" },
  { nome: "ADMTN - CONJUNTO ACM", pastor: "PB. ISAC SOUZA" },
  { nome: "ADMTN - EDGARD SANTOS", pastor: "Pb. Marcos Almeida" },
  { nome: "ADMTN - RUA PARAÍBA", pastor: "Pb. Ezequeil Mendes" },
  { nome: "ADMTN - NOVA VILA", pastor: "Pb. Francisco Marinho" },
  { nome: "ADMTN - RÓTULA I", pastor: "Pr. Joval Barreto" },
  { nome: "ADMTN - RÓTULA II", pastor: "Pb. Robison Adorno" },
  { nome: "ADMTN - RÓTULA III", pastor: "PB. SANDIVAL PASSOS" },
  { nome: "ADMTN - RUA SÃO GERÔNIMO", pastor: "Pr. Samuel Miranda" },
  { nome: "ADMTN - TANCREDO NEVES II", pastor: "Pr. Domingos Prado" },
  { nome: "ADMTN - TANCREDO NEVES III", pastor: "PB. Claudio de Jesus Silva" },
  { nome: "ADMTN - TEMPLO SEDE SETORIAL", pastor: "Pr. André Gomes" },
  { nome: "ADMTN - VILA DOIS IRMÃOS", pastor: "PB. JONATAS FERREIRA" },
  { nome: "ADMTN - VILA MOISÉS", pastor: "Pb. Augusto Spinola" }
];

function formatData(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function parseDateBRToISO(dateBR: string): string {
  if (!dateBR) return dateBR;
  const parts = dateBR.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateBR;
}

function formatDateISOToBR(dateISO: string | null | undefined): string {
  if (!dateISO) return "";
  // Extrai somente a parte da data (antes do T ou espaço) para ignorar hora/fuso
  const datePart = dateISO.split(/[T ]/)[0];
  const parts = datePart.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateISO;
}

export default function EditarInscricaoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Inscricao>({
    id: '',
    nome: '',
    cpf: '',
    data_nascimento: '',
    data_consagracao: '',
    telefone: '',
    igreja: '',
    pastor: '',

    cargo: '',
    funcao: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    estado_civil: '',
    nome_conjuge: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchInscricao(params.id);
    }
  }, [params.id]);

  const fetchInscricao = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscricoes_batismo')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          id: data.id,
          nome: data.nome,
          cpf: data.cpf,
          data_nascimento: formatDateISOToBR(data.data_nascimento),
          data_consagracao: formatDateISOToBR(data.data_consagracao) || '',
          telefone: data.telefone,
          igreja: data.igreja,
          pastor: data.pastor,

          cargo: data.cargo || '',
          funcao: data.funcao || '',
          cep: data.cep || '',
          rua: data.rua || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          estado_civil: data.estado_civil || '',
          nome_conjuge: data.nome_conjuge || '',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = async (cepBuscado: string) => {
    const cepLimpo = cepBuscado.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            rua: (data.logradouro || prev.rua).toUpperCase(),
            bairro: (data.bairro || prev.bairro).toUpperCase(),
            cidade: (data.localidade || prev.cidade).toUpperCase(),
            estado: (data.uf || prev.estado).toUpperCase(),
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'igreja') {
      const selectedIgreja = igrejasData.find(i => i.nome === value);
      if (selectedIgreja) {
        setFormData((prev) => ({ ...prev, igreja: value, pastor: selectedIgreja.pastor }));
        return;
      }
    }

    if (name === 'cep') {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 5) processedValue = digits;
      else processedValue = `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
      
      if (digits.length === 8) {
        buscarCep(digits);
      }
    } else if (name === 'data_nascimento' || name === 'data_consagracao') {
      processedValue = formatData(value);
    } else if (name !== 'cpf' && name !== 'telefone') {
      processedValue = value.toUpperCase();
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('inscricoes_batismo')
        .update({
          nome: formData.nome,
          cpf: formData.cpf,
          data_nascimento: parseDateBRToISO(formData.data_nascimento),
          data_consagracao: formData.data_consagracao ? parseDateBRToISO(formData.data_consagracao) : null,
          telefone: formData.telefone,
          igreja: formData.igreja,
          pastor: formData.pastor,

          cargo: formData.cargo,
          funcao: formData.funcao,
          cep: formData.cep,
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          estado_civil: formData.estado_civil,
          nome_conjuge: formData.estado_civil === "Casado" ? (formData.nome_conjuge || null) : null,
        })
        .eq('id', formData.id);

      if (error) throw error;

      alert('Inscrição atualizada com sucesso!');
      router.push('/admin/inscricoes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editar Inscrição</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <Input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <Input
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento
            </label>
            <Input
              name="data_nascimento"
              type="text"
              value={formData.data_nascimento}
              onChange={handleChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Consagração {["Diácono", "Presbítero", "Evangelista", "Pastor"].includes(formData.cargo) ? "*" : "(Opcional)"}
            </label>
            <Input
              name="data_consagracao"
              type="text"
              value={formData.data_consagracao || ''}
              onChange={handleChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              required={["Diácono", "Presbítero", "Evangelista", "Pastor"].includes(formData.cargo)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <Input
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Igreja
            </label>
            <select
              name="igreja"
              value={formData.igreja}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione a igreja...</option>
              {igrejasData.map((i) => (
                <option key={i.nome} value={i.nome}>{i.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pastor
            </label>
            <Input
              name="pastor"
              value={formData.pastor}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select name="cargo" value={formData.cargo} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Selecione...</option>
                <option value="Membro">Membro</option>
                <option value="Auxiliar">Auxiliar</option>
                <option value="Diácono">Diácono</option>
                <option value="Presbítero">Presbítero</option>
                <option value="Evangelista">Evangelista</option>
                <option value="Pastor">Pastor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
              <select name="funcao" value={formData.funcao} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Selecione...</option>
                <option value="Apenas Membro">Apenas Membro</option>
                <option value="Superintendente">Superintendente</option>
                <option value="Vice">Vice</option>
                <option value="Porteiro">Porteiro</option>
                <option value="Dirg. Círculo de Oração">Dirg. Círculo de Oração</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
              <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Selecione...</option>
                <option value="Solteiro">Solteiro(a)</option>
                <option value="Casado">Casado(a)</option>
                <option value="Divorciado">Divorciado(a)</option>
                <option value="Viuvo">Viúvo(a)</option>
              </select>
            </div>
            {formData.estado_civil === "Casado" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cônjuge *</label>
                <Input name="nome_conjuge" value={formData.nome_conjuge || ''} onChange={handleChange} placeholder="Nome completo do cônjuge" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <Input name="cep" value={formData.cep} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <Input name="rua" value={formData.rua} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <Input name="numero" value={formData.numero} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <Input name="bairro" value={formData.bairro} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <Input name="cidade" value={formData.cidade} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Input name="estado" value={formData.estado} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/inscricoes')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
