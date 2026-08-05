import * as XLSX from 'xlsx';
import { formatDateISOToBR, calcularIdade } from './utils';

interface Inscricao {
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
  nome_pai?: string;
  nome_mae?: string;
  naturalidade?: string;
  rg?: string;
  data_batismo?: string;
  created_at?: string;
}

export function generateExcel(inscricoes: Inscricao[]) {
  const headers = [
    'Nome Completo',
    'CPF',
    'RG',
    'Data de Nascimento',
    'Idade',
    'Estado Civil',
    'Nome do Cônjuge',
    'Telefone',
    'Nome do Pai',
    'Nome da Mãe',
    'Naturalidade',
    'CEP',
    'Rua',
    'Número',
    'Bairro',
    'Cidade',
    'Estado (UF)',
    'Igreja',
    'Pastor',
    'Cargo',
    'Função',
    'Data de Batismo',
    'Data de Consagração',
    'Data de Cadastro'
  ];

  const rows = inscricoes.map((inscricao) => {
    const idadeVal = calcularIdade(inscricao.data_nascimento);

    return {
      'Nome Completo': inscricao.nome?.toUpperCase() || '',
      'CPF': inscricao.cpf || '',
      'RG': inscricao.rg?.toUpperCase() || '',
      'Data de Nascimento': formatDateISOToBR(inscricao.data_nascimento),
      'Idade': idadeVal !== '' ? Number(idadeVal) : '',
      'Estado Civil': inscricao.estado_civil?.toUpperCase() || '',
      'Nome do Cônjuge': inscricao.nome_conjuge?.toUpperCase() || '',
      'Telefone': inscricao.telefone || '',
      'Nome do Pai': inscricao.nome_pai?.toUpperCase() || '',
      'Nome da Mãe': inscricao.nome_mae?.toUpperCase() || '',
      'Naturalidade': inscricao.naturalidade?.toUpperCase() || '',
      'CEP': inscricao.cep || '',
      'Rua': inscricao.rua?.toUpperCase() || '',
      'Número': inscricao.numero || '',
      'Bairro': inscricao.bairro?.toUpperCase() || '',
      'Cidade': inscricao.cidade?.toUpperCase() || '',
      'Estado (UF)': inscricao.estado?.toUpperCase() || '',
      'Igreja': inscricao.igreja?.toUpperCase() || '',
      'Pastor': inscricao.pastor?.toUpperCase() || '',
      'Cargo': inscricao.cargo?.toUpperCase() || '',
      'Função': inscricao.funcao?.toUpperCase() || '',
      'Data de Batismo': formatDateISOToBR(inscricao.data_batismo),
      'Data de Consagração': formatDateISOToBR(inscricao.data_consagracao),
      'Data de Cadastro': formatDateISOToBR(inscricao.created_at),
    };
  });

  // Criar planilha
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscrições');

  // Ajustar largura das colunas automaticamente
  const maxProps = headers.map(header => {
    let maxLen = header.length;
    rows.forEach(row => {
      const val = row[header as keyof typeof row];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    });
    return { wch: maxLen + 3 }; // Margem extra para não cortar
  });
  worksheet['!cols'] = maxProps;

  // Gerar arquivo e iniciar download
  XLSX.writeFile(workbook, `inscricoes-batismo-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
