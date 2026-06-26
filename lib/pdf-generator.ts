import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  doc.text('Ministério Tancredo Neves', 148, 30, { align: 'center' });
  
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
    const hoje = new Date();
    let idadeStr = '-';
    if (inscricao.data_nascimento) {
      const nascimento = new Date(inscricao.data_nascimento);
      if (!isNaN(nascimento.getTime())) {
        let idadeNum = hoje.getFullYear() - nascimento.getFullYear();
        const mesDiff = hoje.getMonth() - nascimento.getMonth();
        if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
          idadeNum--;
        }
        idadeStr = `${nascimento.toLocaleDateString('pt-BR')} (${idadeNum} ANOS)`;
      }
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
      const dataCons = new Date(inscricao.data_consagracao);
      if (!isNaN(dataCons.getTime())) {
        consagracao = `\nCONSAGRADO EM: ${dataCons.toLocaleDateString('pt-BR')}`;
      }
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

export function generateIndividualPDF(inscricao: Inscricao) {
  const doc = new jsPDF('portrait');
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('Igreja Assembléia de Deus', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Ministério Tancredo Neves', 105, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Ficha Individual de Membro/Obreiro', 105, 45, { align: 'center' });

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
  addField('CPF', inscricao.cpf);
  
  const hoje = new Date();
  let idadeInfo = '-';
  if (inscricao.data_nascimento) {
    const nascimento = new Date(inscricao.data_nascimento);
    if (!isNaN(nascimento.getTime())) {
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      idadeInfo = `${nascimento.toLocaleDateString('pt-BR')} (${idade} anos)`;
    }
  }

  addField('Data de Nascimento', idadeInfo);
  addField('Estado Civil', inscricao.estado_civil ? inscricao.estado_civil.toUpperCase() : '-');
  addField('Telefone', inscricao.telefone);

  y += 5;

  // Igreja e Ministério
  addSection('Igreja e Ministério');
  addField('Igreja', inscricao.igreja ? inscricao.igreja.toUpperCase() : '');
  addField('Pastor', inscricao.pastor ? inscricao.pastor.toUpperCase() : '');
  addField('Cargo', inscricao.cargo ? inscricao.cargo.toUpperCase() : '');
  addField('Função', inscricao.funcao ? inscricao.funcao.toUpperCase() : '');
  if (inscricao.data_consagracao) {
    const dataCons = new Date(inscricao.data_consagracao);
    if (!isNaN(dataCons.getTime())) {
      addField('Data Consagração', dataCons.toLocaleDateString('pt-BR'));
    } else {
      addField('Data Consagração', '-');
    }
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
