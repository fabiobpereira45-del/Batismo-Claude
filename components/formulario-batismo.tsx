"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CIDADES_BAHIA } from "@/lib/cidades-bahia";

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

  // Novos campos
  nome_pai?: string;
  nome_mae: string;
  naturalidade: string;
  rg: string;
  data_batismo: string;
  foto_url?: string;
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

  // Novos campos
  nome_pai?: string;
  nome_mae?: string;
  naturalidade?: string;
  rg?: string;
  data_batismo?: string;
  foto?: string;
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

function formatDateISOToBR(dateISO: string | null | undefined): string {
  if (!dateISO) return "";
  const parts = dateISO.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateISO;
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
  
  const [modoBusca, setModoBusca] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [cpfBusca, setCpfBusca] = useState("");
  const [errorBusca, setErrorBusca] = useState<string | null>(null);
  const [submittedMode, setSubmittedMode] = useState<"cadastro" | "edicao">("cadastro");
  
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

    nome_pai: "",
    nome_mae: "",
    naturalidade: "",
    rg: "",
    data_batismo: "",
    foto_url: "",
  });

  // Controle de Câmera/Foto
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fotoFile, setFotoFile] = useState<File | Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const ligarCamera = async (mode: 'user' | 'environment' = 'user') => {
    setCameraError(null);
    setCameraAtiva(true);
    setFacingMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn(`Câmera (${mode}) falhou, tentando câmera padrão...`, err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (fallbackErr: any) {
        setCameraError("Não foi possível acessar a câmera. Use a opção de carregar arquivo.");
        setCameraAtiva(false);
      }
    }
  };

  const alternarCamera = async () => {
    const novoModo = facingMode === 'user' ? 'environment' : 'user';
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    await ligarCamera(novoModo);
  };

  const desligarCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraAtiva(false);
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Inverter para efeito espelho apenas na visualização de selfie
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        if (facingMode === 'user') {
          ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFotoFile(file);
            setFotoPreview(canvas.toDataURL('image/jpeg'));
          }
        }, 'image/jpeg', 0.95);
        
        desligarCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    } else if (name === "data_nascimento" || name === "data_consagracao" || name === "data_batismo") {
      processedValue = formatData(value);
    } else if (name === "cargo" || name === "funcao" || name === "estado_civil" || name === "naturalidade") {
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

    if (formData.cargo !== "Membro") {
      if (!formData.data_consagracao || formData.data_consagracao.length !== 10) {
        newErrors.data_consagracao = "Data de consagração é obrigatória";
      }
    } else {
      if (formData.data_consagracao && formData.data_consagracao.length !== 10) {
        newErrors.data_consagracao = "Data de consagração inválida";
      }
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

    // Validações dos novos campos
    if (!formData.nome_mae || formData.nome_mae.trim().length < 3) {
      newErrors.nome_mae = "Nome da mãe é obrigatório";
    }
    if (!formData.naturalidade) {
      newErrors.naturalidade = "Naturalidade é obrigatória";
    }
    if (!formData.rg || formData.rg.trim().length < 4) {
      newErrors.rg = "RG é obrigatório";
    }
    if (!formData.data_batismo || formData.data_batismo.length !== 10) {
      newErrors.data_batismo = "Data de batismo é obrigatória";
    }
    if (!fotoPreview) {
      newErrors.foto = "Foto do membro é obrigatória";
    }
    
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

  const resetForm = () => {
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
      nome_pai: "",
      nome_mae: "",
      naturalidade: "",
      rg: "",
      data_batismo: "",
      foto_url: "",
    });
    setFotoFile(null);
    setFotoPreview(null);
    setErrors({});
    setError(null);
    setEditId(null);
    setModoEdicao(false);
    setModoBusca(false);
    setCpfBusca("");
    setErrorBusca(null);
  };

  const handleBuscarCadastro = async () => {
    setErrorBusca(null);
    const cpfLimpo = cpfBusca.replace(/\D/g, "");
    if (!cpfLimpo) {
      setErrorBusca("CPF é obrigatório");
      return;
    }
    if (!validateCPF(cpfBusca)) {
      setErrorBusca("CPF inválido");
      return;
    }

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("inscricoes_batismo")
        .select("*")
        .eq("cpf", cpfLimpo)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data) {
        setErrorBusca("CPF inválido ou não há cadastro");
        return;
      }

      setFormData({
        nome: data.nome || "",
        cpf: formatCPF(data.cpf || ""),
        data_nascimento: formatDateISOToBR(data.data_nascimento),
        data_consagracao: data.data_consagracao ? formatDateISOToBR(data.data_consagracao) : "",
        telefone: formatTelefone(data.telefone || ""),
        igreja: data.igreja || "",
        pastor: data.pastor || "",
        cargo: data.cargo || "",
        funcao: data.funcao || "",
        cep: formatCEP(data.cep || ""),
        rua: data.rua || "",
        numero: data.numero || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        estado_civil: data.estado_civil || "",
        nome_pai: data.nome_pai || "",
        nome_mae: data.nome_mae || "",
        naturalidade: data.naturalidade || "",
        rg: data.rg || "",
        data_batismo: data.data_batismo ? formatDateISOToBR(data.data_batismo) : "",
        foto_url: data.foto_url || "",
      });

      if (data.foto_url) {
        setFotoPreview(data.foto_url);
      } else {
        setFotoPreview(null);
      }
      setFotoFile(null);

      setEditId(data.id);
      setModoEdicao(true);
      setModoBusca(false);
    } catch (err: any) {
      setErrorBusca("Erro ao buscar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    setSubmittedMode(modoEdicao ? "edicao" : "cadastro");
    
    try {
      let uploadedFotoUrl = formData.foto_url || "";
      if (fotoFile) {
        const cpfLimpo = formData.cpf.replace(/\D/g, "");
        let fileExt = "jpg";
        let contentType = "image/jpeg";
        if (fotoFile instanceof File) {
          const parts = fotoFile.name.split('.');
          if (parts.length > 1) {
            fileExt = parts.pop()?.toLowerCase() || "jpg";
          }
          contentType = fotoFile.type || "image/jpeg";
        }
        const fileName = `${cpfLimpo}-${Date.now()}.${fileExt}`;
        const filePath = `membros/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fotos-membros')
          .upload(filePath, fotoFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: contentType
          });
          
        if (uploadError) {
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-membros')
          .getPublicUrl(filePath);
          
        uploadedFotoUrl = publicUrl;
      }

      if (modoEdicao) {
        const { error: supabaseError } = await supabase
          .from("inscricoes_batismo")
          .update({
            nome: formData.nome.trim(),
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
            nome_pai: formData.nome_pai?.trim() || null,
            nome_mae: formData.nome_mae.trim(),
            naturalidade: formData.naturalidade,
            rg: formData.rg.trim(),
            data_batismo: parseDateBRToISO(formData.data_batismo),
            foto_url: uploadedFotoUrl || null,
          })
          .eq("id", editId);

        if (supabaseError) {
          throw supabaseError;
        }
      } else {
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
              nome_pai: formData.nome_pai?.trim() || null,
              nome_mae: formData.nome_mae.trim(),
              naturalidade: formData.naturalidade,
              rg: formData.rg.trim(),
              data_batismo: parseDateBRToISO(formData.data_batismo),
              foto_url: uploadedFotoUrl || null,
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
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-0 shadow-2xl shadow-indigo-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-10">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">
              {submittedMode === "edicao" ? "Inscrição Atualizada!" : "Inscrição Realizada!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {submittedMode === "edicao"
                ? "Seus dados foram atualizados com sucesso."
                : "Seus dados foram enviados com sucesso. Em breve entraremos em contato."}
            </p>
            <Button onClick={() => { setSuccess(false); resetForm(); }} variant="outline" className="rounded-xl px-6">
              Voltar ao Início
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
      {/* Alternância de Modo */}
      {!modoEdicao && (
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => { setModoBusca(false); resetForm(); }}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-2xl transition-all ${
              !modoBusca
                ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            Novo Cadastro
          </button>
          <button
            type="button"
            onClick={() => { setModoBusca(true); setErrorBusca(null); setCpfBusca(""); }}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-2xl transition-all ${
              modoBusca
                ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            Editar Cadastro
          </button>
        </div>
      )}

      <CardContent className="p-4 sm:p-10">
        {modoBusca ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBuscarCadastro();
            }}
            className="space-y-6"
          >
            <div className="text-center py-2">
              <h3 className="text-xl font-bold text-slate-800">Buscar Cadastro</h3>
              <p className="text-sm text-slate-500 mt-1">
                Informe seu CPF para consultar e atualizar seu cadastro ou enviar sua foto.
              </p>
            </div>

            {errorBusca && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                {errorBusca}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="cpfBusca" className="text-sm font-medium text-gray-700">
                Digite seu CPF *
              </label>
              <Input
                id="cpfBusca"
                name="cpfBusca"
                value={cpfBusca}
                onChange={(e) => setCpfBusca(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="h-12 text-lg text-center font-medium tracking-wide rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all rounded-xl"
              disabled={loading}
            >
              {loading ? "Buscando..." : "Buscar Cadastro"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {modoEdicao && (
              <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm shadow-sm mb-4">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                  <span>Você está editando o cadastro de <strong>{formData.nome}</strong>.</span>
                </div>
                <Button type="button" onClick={resetForm} variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 text-xs px-3 h-8 rounded-lg font-semibold">
                  Cancelar Edição
                </Button>
              </div>
            )}

          
          {/* Sessão de Foto do Membro */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-gray-700 block">
              Foto do Membro * (Selfie ou Câmera)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="relative w-40 h-48 bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview do Membro" className="w-full h-full object-cover" />
                ) : cameraAtiva ? (
                  <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs mt-1 block">Sem foto</span>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                <p className="text-xs text-slate-500 max-w-sm mx-auto sm:mx-0">
                  Tire uma foto nítida do rosto (estilo documento). Se estiver no celular, você pode tirar a selfie diretamente ou carregar um arquivo da galeria.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center sm:justify-start">
                  {cameraAtiva ? (
                    <>
                      <Button type="button" onClick={capturarFoto} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                        Tirar Foto
                      </Button>
                      <Button type="button" onClick={alternarCamera} variant="outline" className="w-full sm:w-auto gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        Alternar Câmera
                      </Button>
                      <Button type="button" onClick={desligarCamera} variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 border-red-200">
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" onClick={() => ligarCamera('user')} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                        Usar Câmera
                      </Button>
                      <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        Carregar Arquivo
                      </Button>
                    </>
                  )}
                  {fotoPreview && (
                    <Button type="button" onClick={() => { setFotoPreview(null); setFotoFile(null); }} variant="secondary" className="w-full sm:w-auto text-slate-600">
                      Remover Foto
                    </Button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                {cameraError && <p className="text-xs text-red-600 font-medium">{cameraError}</p>}
                {errors.foto && <p className="text-xs text-red-600 font-medium">{errors.foto}</p>}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={inputClass("nome_pai")}>
                  <label htmlFor="nome_pai" className="text-sm font-medium text-gray-700">
                    Nome do Pai (Opcional)
                  </label>
                  <Input
                    id="nome_pai"
                    name="nome_pai"
                    value={formData.nome_pai}
                    onChange={handleChange}
                    placeholder="Nome completo do pai"
                  />
                </div>

                <div className={inputClass("nome_mae")}>
                  <label htmlFor="nome_mae" className="text-sm font-medium text-gray-700">
                    Nome da Mãe *
                  </label>
                  <Input
                    id="nome_mae"
                    name="nome_mae"
                    value={formData.nome_mae}
                    onChange={handleChange}
                    placeholder="Nome completo da mãe"
                    required
                  />
                  {errors.nome_mae && (
                    <p className="text-sm text-red-600">{errors.nome_mae}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    disabled={modoEdicao}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-red-600">{errors.cpf}</p>
                  )}
                </div>

                <div className={inputClass("rg")}>
                  <label htmlFor="rg" className="text-sm font-medium text-gray-700">
                    RG *
                  </label>
                  <Input
                    id="rg"
                    name="rg"
                    type="text"
                    value={formData.rg}
                    onChange={handleChange}
                    placeholder="Número do RG"
                    required
                  />
                  {errors.rg && (
                    <p className="text-sm text-red-600">{errors.rg}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className={inputClass("naturalidade")}>
                  <label htmlFor="naturalidade" className="text-sm font-medium text-gray-700">
                    Naturalidade (Cidade da Bahia) *
                  </label>
                  <select
                    id="naturalidade"
                    name="naturalidade"
                    value={formData.naturalidade}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione a cidade...</option>
                    {CIDADES_BAHIA.map((cidade) => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))}
                  </select>
                  {errors.naturalidade && (
                    <p className="text-sm text-red-600">{errors.naturalidade}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Igreja e Ministério</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={inputClass("data_batismo")}>
                  <label
                    htmlFor="data_batismo"
                    className="text-sm font-medium text-gray-700"
                  >
                    Data de Batismo *
                  </label>
                  <Input
                    id="data_batismo"
                    name="data_batismo"
                    type="text"
                    value={formData.data_batismo}
                    onChange={handleChange}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    required
                  />
                  {errors.data_batismo && (
                    <p className="text-sm text-red-600">{errors.data_batismo}</p>
                  )}
                </div>

                <div className={inputClass("data_consagracao")}>
                  <label
                    htmlFor="data_consagracao"
                    className="text-sm font-medium text-gray-700"
                  >
                    Data de Consagração {formData.cargo !== "Membro" ? "*" : ""}
                  </label>
                  <Input
                    id="data_consagracao"
                    name="data_consagracao"
                    type="text"
                    value={formData.data_consagracao || ""}
                    onChange={handleChange}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    required={formData.cargo !== "Membro"}
                  />
                  {errors.data_consagracao && (
                    <p className="text-sm text-red-600">{errors.data_consagracao}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contato e Endereço</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

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
          </div>

          <Button type="submit" className="w-full mt-8 h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all rounded-xl" disabled={loading}>
            {loading ? "Enviando..." : (modoEdicao ? "Salvar Alterações" : "Finalizar Inscrição")}
          </Button>
        </form>
      )}
      </CardContent>
    </Card>
  );
}