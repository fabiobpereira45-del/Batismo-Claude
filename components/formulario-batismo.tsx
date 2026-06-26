"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface FormData {
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
}

interface FormErrors {
  nome?: string;
  cpf?: string;
  data_nascimento?: string;
  data_consagracao?: string;
  telefone?: string;
  igreja?: string;
  pastor?: string;

  cargo?: string;
  funcao?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  estado_civil?: string;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}-${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

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

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  if (parseInt(digits[9]) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return parseInt(digits[10]) === digit2;
}

const igrejasData = [
  { nome: "ADMTN - ARENOSO I", pastor: "PR. Nicodemos Glória" },
  { nome: "ADMTN - ARENOSO II", pastor: "PB. NATANAEL SANTANA" },
  { nome: "ADMTN - ARENOSO III", pastor: "BP. Marcelo da Paixão" },
  { nome: "ADMTN - CABULA VII", pastor: "Pb. Jeferson Guedes" },
  { nome: "ADMTN - CONJUNTO ACM", pastor: "PB. ISAC SOUZA" },
  { nome: "ADMTN - EDGARD SANTOS", pastor: "Pb. Marcos Almeida" },
  { nome: "ADMTN - FINAL DE LINHA", pastor: "Pb. Ezequeil Mendes" },
  { nome: "ADMTN - NOVA VILA", pastor: "Pb. Francisco Marinho" },
  { nome: "ADMTN - RÓTULA I", pastor: "Pr. Joval Barreto" },
  { nome: "ADMTN - RÓTULA II", pastor: "Pb. Robison Adorno" },
  { nome: "ADMTN - RÓTULA III", pastor: "PB. SANDIVAL PASSOS" },
  { nome: "ADMTN - RUA SÃO GERÔNIMO", pastor: "Pr. Samuel Miranda" },
  { nome: "ADMTN - TANCREDO NEVES II", pastor: "Pr. Domingos Prado" },
  { nome: "ADMTN - TANCREDO NEVES III", pastor: "PB. Claudio de Jesus Silva" },
  { nome: "ADMTN - TEMPLO CENTRAL", pastor: "Pr. Felipe Carvalho das Virgens" },
  { nome: "ADMTN - VILA DOIS IRMÃOS", pastor: "PB. JONATAS FERREIRA" },
  { nome: "ADMTN - VILA MOISÉS", pastor: "Pb. Augusto Spinola" }
];

export default function FormularioBatismo() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cpf: "",
    data_nascimento: "",
    data_consagracao: "",
    telefone: "",
    igreja: "",
    pastor: "",

    cargo: "",
    funcao: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    estado_civil: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === "igreja") {
      const selectedIgreja = igrejasData.find(i => i.nome === value);
      if (selectedIgreja) {
        setFormData((prev) => ({ ...prev, igreja: value, pastor: selectedIgreja.pastor }));
        if (errors.igreja) setErrors((prev) => ({ ...prev, igreja: undefined }));
        if (errors.pastor) setErrors((prev) => ({ ...prev, pastor: undefined }));
        return;
      }
    }

    if (name === "cpf") {
      processedValue = formatCPF(value);
    } else if (name === "telefone") {
      processedValue = formatTelefone(value);
    } else if (name === "cep") {
      processedValue = formatCEP(value);
      const cepLimpo = processedValue.replace(/\D/g, "");
      if (cepLimpo.length === 8) {
        buscarCep(cepLimpo);
      }
    } else if (name === "data_nascimento" || name === "data_consagracao") {
      processedValue = formatData(value);
    } else if (name === "cargo" || name === "funcao" || name === "estado_civil") {
      processedValue = value;
    } else {
      processedValue = value.toUpperCase();
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const today = new Date();
    
    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "Nome deve ter pelo menos 3 caracteres";
    }
    
    if (!formData.cpf) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }
    
    if (!formData.data_nascimento || formData.data_nascimento.length !== 10) {
      newErrors.data_nascimento = "Data de nascimento inválida";
    } else {
      const birthDate = new Date(parseDateBRToISO(formData.data_nascimento) + "T00:00:00");
      if (birthDate >= today) {
        newErrors.data_nascimento = "Data de nascimento deve ser anterior a hoje";
      }
    }

    if (!formData.data_consagracao || formData.data_consagracao.length !== 10) {
      newErrors.data_consagracao = "Data de consagração é obrigatória";
    }
    
    if (!formData.telefone || formData.telefone.replace(/\D/g, "").length < 10) {
      newErrors.telefone = "Telefone inválido";
    }
    
    if (!formData.igreja || formData.igreja.trim().length < 2) {
      newErrors.igreja = "Igreja é obrigatória";
    }
    
    if (!formData.pastor || formData.pastor.trim().length < 2) {
      newErrors.pastor = "Pastor é obrigatório";
    }

    if (!formData.cargo) newErrors.cargo = "Cargo é obrigatório";
    if (!formData.funcao) newErrors.funcao = "Função é obrigatória";
    if (!formData.estado_civil) newErrors.estado_civil = "Estado civil é obrigatório";
    
    if (!formData.cep || formData.cep.length !== 9) newErrors.cep = "CEP inválido";
    if (!formData.rua || formData.rua.trim().length < 2) newErrors.rua = "Rua é obrigatória";
    if (!formData.numero) newErrors.numero = "Número é obrigatório";
    if (!formData.bairro || formData.bairro.trim().length < 2) newErrors.bairro = "Bairro é obrigatório";
    if (!formData.cidade || formData.cidade.trim().length < 2) newErrors.cidade = "Cidade é obrigatória";
    if (!formData.estado || formData.estado.length !== 2) newErrors.estado = "Estado inválido";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buscarCep = async (cepBuscado: string) => {
    if (cepBuscado.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepBuscado}/json/`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { error: supabaseError } = await supabase
        .from("inscricoes_batismo")
        .insert([
          {
            nome: formData.nome.trim(),
            cpf: formData.cpf.replace(/\D/g, ""),
            data_nascimento: parseDateBRToISO(formData.data_nascimento),
            data_consagracao: formData.data_consagracao ? parseDateBRToISO(formData.data_consagracao) : null,
            telefone: formData.telefone,
            igreja: formData.igreja.trim(),
            pastor: formData.pastor.trim(),

            cargo: formData.cargo,
            funcao: formData.funcao,
            cep: formData.cep.replace(/\D/g, ""),
            rua: formData.rua.trim(),
            numero: formData.numero.trim(),
            bairro: formData.bairro.trim(),
            cidade: formData.cidade.trim(),
            estado: formData.estado.trim(),
            estado_civil: formData.estado_civil,
          },
        ]);
      
      if (supabaseError) {
        if (supabaseError.message.includes("duplicate key")) {
          setError("Este CPF já está cadastrado.");
        } else {
          setError("Erro ao salvar inscrição. Tente novamente.");
        }
        return;
      }
      
      setSuccess(true);
      setFormData({
        nome: "",
        cpf: "",
        data_nascimento: "",
        data_consagracao: "",
        telefone: "",
        igreja: "",
        pastor: "",

        cargo: "",
        funcao: "",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        estado_civil: "",
      });
    } catch {
      setError("Erro ao conectar com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">
              Inscrição Realizada!
            </h2>
            <p className="text-gray-600 mb-6">
              Seus dados foram enviados com sucesso. Em breve entraremos em contato.
            </p>
            <Button onClick={() => setSuccess(false)} variant="outline">
              Fazer Nova Inscrição
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const inputClass = (field: keyof FormErrors) =>
    `space-y-2 transition-all ${errors[field] ? "[&_input]:border-red-500 [&_select]:border-red-500 [&_label]:text-red-600 [&_input]:ring-red-200 [&_select]:ring-red-200" : ""}`;

  return (
    <Card className="border-0 shadow-2xl shadow-indigo-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
      <CardContent className="p-5 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className={inputClass("nome")}>
            <label htmlFor="nome" className="text-sm font-medium text-gray-700">
              Nome Completo *
            </label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu nome completo"
              required
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome}</p>
            )}
          </div>
          
          <div className={inputClass("cpf")}>
            <label htmlFor="cpf" className="text-sm font-medium text-gray-700">
              CPF *
            </label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
            {errors.cpf && (
              <p className="text-sm text-red-600">{errors.cpf}</p>
            )}
          </div>
          
          <div className={inputClass("data_nascimento")}>
            <label
              htmlFor="data_nascimento"
              className="text-sm font-medium text-gray-700"
            >
              Data de Nascimento *
            </label>
            <Input
              id="data_nascimento"
              name="data_nascimento"
              type="text"
              value={formData.data_nascimento}
              onChange={handleChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              required
            />
            {errors.data_nascimento && (
              <p className="text-sm text-red-600">{errors.data_nascimento}</p>
            )}
          </div>
          
          <div className={inputClass("data_consagracao")}>
            <label
              htmlFor="data_consagracao"
              className="text-sm font-medium text-gray-700"
            >
              Data de Consagração *
            </label>
            <Input
              id="data_consagracao"
              name="data_consagracao"
              type="text"
              value={formData.data_consagracao || ""}
              onChange={handleChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              required
            />
            {errors.data_consagracao && (
              <p className="text-sm text-red-600">{errors.data_consagracao}</p>
            )}
          </div>
          
          <div className={inputClass("telefone")}>
            <label htmlFor="telefone" className="text-sm font-medium text-gray-700">
              Telefone *
            </label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
            />
            {errors.telefone && (
              <p className="text-sm text-red-600">{errors.telefone}</p>
            )}
          </div>
          
          <div className={inputClass("igreja")}>
            <label htmlFor="igreja" className="text-sm font-medium text-gray-700">
              Igreja *
            </label>
            <select
              id="igreja"
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
            {errors.igreja && (
              <p className="text-sm text-red-600">{errors.igreja}</p>
            )}
          </div>
          
          <div className={inputClass("pastor")}>
            <label htmlFor="pastor" className="text-sm font-medium text-gray-700">
              Seu Pastor *
            </label>
            <Input
              id="pastor"
              name="pastor"
              value={formData.pastor}
              onChange={handleChange}
              placeholder="Nome do pastor"
              required
            />
            {errors.pastor && (
              <p className="text-sm text-red-600">{errors.pastor}</p>
            )}
          </div>
          

          
          <div className={inputClass("cargo")}>
            <label htmlFor="cargo" className="text-sm font-medium text-gray-700">
              Cargo *
            </label>
            <select
              id="cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              <option value="Membro">Membro</option>
              <option value="Auxiliar">Auxiliar</option>
              <option value="Diácono">Diácono</option>
              <option value="Presbítero">Presbítero</option>
              <option value="Evangelista">Evangelista</option>
              <option value="Pastor">Pastor</option>
            </select>
            {errors.cargo && (
              <p className="text-sm text-red-600">{errors.cargo}</p>
            )}
          </div>

          <div className={inputClass("funcao")}>
            <label htmlFor="funcao" className="text-sm font-medium text-gray-700">
              Função *
            </label>
            <select
              id="funcao"
              name="funcao"
              value={formData.funcao}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              <option value="Superintendente">Superintendente</option>
              <option value="Vice">Vice</option>
              <option value="Porteiro">Porteiro</option>
              <option value="Dirg. Círculo de Oração">Dirg. Círculo de Oração</option>
              <option value="Outros">Outros</option>
            </select>
            {errors.funcao && (
              <p className="text-sm text-red-600">{errors.funcao}</p>
            )}
          </div>

          <div className={inputClass("estado_civil")}>
            <label htmlFor="estado_civil" className="text-sm font-medium text-gray-700">
              Estado Civil *
            </label>
            <select
              id="estado_civil"
              name="estado_civil"
              value={formData.estado_civil}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              <option value="Solteiro">Solteiro(a)</option>
              <option value="Casado">Casado(a)</option>
              <option value="Divorciado">Divorciado(a)</option>
              <option value="Viuvo">Viúvo(a)</option>
            </select>
            {errors.estado_civil && (
              <p className="text-sm text-red-600">{errors.estado_civil}</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={inputClass("cep")}>
                <label htmlFor="cep" className="text-sm font-medium text-gray-700">CEP *</label>
                <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" maxLength={9} required />
                {errors.cep && <p className="text-sm text-red-600">{errors.cep}</p>}
              </div>
              <div className={inputClass("rua")}>
                <label htmlFor="rua" className="text-sm font-medium text-gray-700">Rua *</label>
                <Input id="rua" name="rua" value={formData.rua} onChange={handleChange} placeholder="Nome da rua" required />
                {errors.rua && <p className="text-sm text-red-600">{errors.rua}</p>}
              </div>
              <div className={inputClass("numero")}>
                <label htmlFor="numero" className="text-sm font-medium text-gray-700">Número *</label>
                <Input id="numero" name="numero" value={formData.numero} onChange={handleChange} placeholder="123" required />
                {errors.numero && <p className="text-sm text-red-600">{errors.numero}</p>}
              </div>
              <div className={inputClass("bairro")}>
                <label htmlFor="bairro" className="text-sm font-medium text-gray-700">Bairro *</label>
                <Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Bairro" required />
                {errors.bairro && <p className="text-sm text-red-600">{errors.bairro}</p>}
              </div>
              <div className={inputClass("cidade")}>
                <label htmlFor="cidade" className="text-sm font-medium text-gray-700">Cidade *</label>
                <Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Cidade" required />
                {errors.cidade && <p className="text-sm text-red-600">{errors.cidade}</p>}
              </div>
              <div className={inputClass("estado")}>
                <label htmlFor="estado" className="text-sm font-medium text-gray-700">Estado *</label>
                <Input id="estado" name="estado" value={formData.estado} onChange={handleChange} placeholder="UF" maxLength={2} required />
                {errors.estado && <p className="text-sm text-red-600">{errors.estado}</p>}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full mt-8 h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all rounded-xl" disabled={loading}>
            {loading ? "Enviando..." : "Finalizar Inscrição"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}