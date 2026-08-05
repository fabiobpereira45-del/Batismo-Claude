import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  // Novos campos
  nome_pai?: string;
  nome_mae?: string;
  naturalidade?: string;
  rg?: string;
  data_batismo?: string;
  foto_url?: string;
  nome_conjuge?: string;
}

export function generatePDF(inscricoes: Inscricao[], filtros?: {
  nome?: string;
  cpf?: string;
  igreja?: string;
  pastor?: string;
  cargo?: string;
  funcao?: string;
}, colunasVisiveis?: {
  nome?: boolean;
  cpf?: boolean;
  idade?: boolean;
  telefone?: boolean;
  cargoFuncao?: boolean;
  estadoCivil?: boolean;
  endereco?: boolean;
  igrejaPastor?: boolean;
}) {
  const doc = new jsPDF('landscape');
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('Igreja Assembléia de Deus', 148, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Setor Tancredo Neves', 148, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Relatório - Cadastro de Membros e Obreiros', 148, 45, { align: 'center' });
  
  // Informações dos filtros aplicados
  if (filtros) {
    let filtrosTexto = 'Filtros: ';
    if (filtros.nome) filtrosTexto += `Nome: ${filtros.nome} | `;
    if (filtros.cpf) filtrosTexto += `CPF: ${filtros.cpf} | `;
    if (filtros.igreja) filtrosTexto += `Igreja: ${filtros.igreja} | `;
    if (filtros.pastor) filtrosTexto += `Pastor: ${filtros.pastor} | `;
    if (filtros.cargo) filtrosTexto += `Cargo: ${filtros.cargo} | `;
    if (filtros.funcao) filtrosTexto += `Função: ${filtros.funcao} | `;
    
    if (filtrosTexto !== 'Filtros: ') {
      doc.setFontSize(10);
      doc.text(filtrosTexto.slice(0, -3), 148, 55, { align: 'center' });
    }
  }
  
  // Data de geração
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(10);
  doc.text(`Gerado em: ${dataGeracao}`, 148, 65, { align: 'center' });
  
  // Tabela
  const todasColunas = [
    { label: 'Nome', key: 'nome' },
    { label: 'CPF', key: 'cpf' },
    { label: 'Idade', key: 'idade' },
    { label: 'Tel.', key: 'telefone' },
    { label: 'Cargo/Função', key: 'cargoFuncao' },
    { label: 'Est. Civil', key: 'estadoCivil' },
    { label: 'Endereço', key: 'endereco' },
    { label: 'Igreja/Pastor', key: 'igrejaPastor' },
  ];

  const headers = [
    todasColunas
      .filter(c => colunasVisiveis?.[c.key as keyof typeof colunasVisiveis] !== false)
      .map(c => c.label)
  ];
  
  const data = inscricoes.map((inscricao) => {
    let idadeStr = '-';
    if (inscricao.data_nascimento) {
      const idadeNum = calcularIdade(inscricao.data_nascimento);
      idadeStr = `${formatDateISOToBR(inscricao.data_nascimento)} (${idadeNum} ANOS)`;
    }
    
    const enderecoFormatado = inscricao.cidade ? `${inscricao.cidade}/${inscricao.estado}`.toUpperCase() : '';
    let nomeFormatado = inscricao.nome ? inscricao.nome.toUpperCase() : '';
    let igrejaFormatada = inscricao.igreja ? inscricao.igreja.toUpperCase() : '';
    let pastorFormatado = inscricao.pastor ? inscricao.pastor.toUpperCase() : '';
    let cargoFormatado = inscricao.cargo ? inscricao.cargo.toUpperCase() : '';
    let funcaoFormatada = inscricao.funcao ? inscricao.funcao.toUpperCase() : '';
    
    const cargoFuncaoTexto = [cargoFormatado, funcaoFormatada].filter(Boolean).join(' - ') || '-';
    let consagracao = '';
    if (inscricao.data_consagracao) {
      consagracao = `\nCONSAGRADO EM: ${formatDateISOToBR(inscricao.data_consagracao)}`;
    }
    const cargoEFuncaoEConsagracao = cargoFuncaoTexto + consagracao;
    const igrejaPastor = [igrejaFormatada, pastorFormatado].filter(Boolean).join('\n');
    
    const rowData = {
      nome: nomeFormatado,
      cpf: inscricao.cpf,
      idade: idadeStr,
      telefone: inscricao.telefone,
      cargoFuncao: cargoEFuncaoEConsagracao,
      estadoCivil: inscricao.estado_civil ? inscricao.estado_civil.toUpperCase() : '-',
      endereco: enderecoFormatado,
      igrejaPastor: igrejaPastor,
    };

    return todasColunas
      .filter(c => colunasVisiveis?.[c.key as keyof typeof colunasVisiveis] !== false)
      .map(c => rowData[c.key as keyof typeof rowData]);
  });
  
  autoTable(doc, {
    head: headers,
    body: data,
    startY: 75,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { top: 75 },
  });
  
  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      148,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Salvar o PDF
  doc.save(`cadastro-membros-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

export async function generateIndividualPDF(inscricao: Inscricao) {
  const doc = new jsPDF('portrait');
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('Igreja Assembléia de Deus', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Setor Tancredo Neves', 105, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Ficha Individual de Membro/Obreiro', 105, 45, { align: 'center' });

  // Moldura e foto 3x4 no canto superior direito
  const photoX = 155;
  const photoY = 12;
  const photoW = 35;
  const photoH = 42;

  if (inscricao.foto_url) {
    try {
      const img = await loadImage(inscricao.foto_url);
      doc.addImage(img, 'JPEG', photoX, photoY, photoW, photoH);
      doc.setDrawColor(200, 200, 200);
      doc.rect(photoX, photoY, photoW, photoH);
    } catch (err) {
      console.warn("Falha ao carregar foto para o PDF:", err);
      doc.setDrawColor(220, 220, 220);
      doc.rect(photoX, photoY, photoW, photoH);
      doc.setFontSize(8);
      doc.text('Sem Foto', photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
    }
  } else {
    doc.setDrawColor(220, 220, 220);
    doc.rect(photoX, photoY, photoW, photoH);
    doc.setFontSize(8);
    doc.text('Sem Foto', photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
  }

  doc.setFontSize(12);
  let y = 60;
  const lineSpacing = 8;

  const addSection = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y);
    y += lineSpacing;
    doc.line(20, y - 2, 190, y - 2);
    y += lineSpacing;
  };

  const addField = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 70, y);
    y += lineSpacing;
  };

  // Informações Pessoais
  addSection('Informações Pessoais');
  addField('Nome', inscricao.nome ? inscricao.nome.toUpperCase() : '');
  addField('Pai', inscricao.nome_pai ? inscricao.nome_pai.toUpperCase() : '-');
  addField('Mãe', inscricao.nome_mae ? inscricao.nome_mae.toUpperCase() : '-');
  addField('CPF', inscricao.cpf);
  addField('RG', inscricao.rg ? inscricao.rg.toUpperCase() : '-');
  
  let idadeInfo = '-';
  if (inscricao.data_nascimento) {
    const idade = calcularIdade(inscricao.data_nascimento);
    idadeInfo = `${formatDateISOToBR(inscricao.data_nascimento)} (${idade} anos)`;
  }

  addField('Data de Nascimento', idadeInfo);
  addField('Naturalidade', inscricao.naturalidade ? inscricao.naturalidade.toUpperCase() : '-');
  addField('Estado Civil', inscricao.estado_civil ? inscricao.estado_civil.toUpperCase() : '-');
  if (inscricao.estado_civil === 'Casado' || inscricao.nome_conjuge) {
    addField('Cônjuge', inscricao.nome_conjuge ? inscricao.nome_conjuge.toUpperCase() : '-');
  }
  addField('Telefone', inscricao.telefone);

  y += 5;

  // Igreja e Ministério
  addSection('Igreja e Ministério');
  addField('Igreja', inscricao.igreja ? inscricao.igreja.toUpperCase() : '');
  addField('Pastor', inscricao.pastor ? inscricao.pastor.toUpperCase() : '');
  addField('Cargo', inscricao.cargo ? inscricao.cargo.toUpperCase() : '');
  addField('Função', inscricao.funcao ? inscricao.funcao.toUpperCase() : '');
  
  addField('Data de Batismo', formatDateISOToBR(inscricao.data_batismo) || '-');

  if (inscricao.data_consagracao) {
    addField('Data Consagração', formatDateISOToBR(inscricao.data_consagracao) || '-');
  }

  y += 5;

  // Endereço
  addSection('Endereço');
  addField('Rua', inscricao.rua ? inscricao.rua.toUpperCase() : '');
  addField('Número', inscricao.numero ? inscricao.numero.toUpperCase() : '');
  addField('Bairro', inscricao.bairro ? inscricao.bairro.toUpperCase() : '');
  addField('Cidade/UF', `${inscricao.cidade ? inscricao.cidade.toUpperCase() : ''}/${inscricao.estado ? inscricao.estado.toUpperCase() : ''}`);
  addField('CEP', inscricao.cep || '');

  // Salvar
  const safeName = inscricao.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`ficha-${safeName}.pdf`);
}
