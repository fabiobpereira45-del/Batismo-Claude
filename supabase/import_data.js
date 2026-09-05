const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwqfpoflkvfriyeqhdjw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cWZwb2Zsa3Zmcml5ZXFoZGp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3ODQyOSwiZXhwIjoyMDk0MjU0NDI5fQ.bhcavXrVXOxpqsAARLFhdn0cTGBoblUPnZ4KWtBgFl8';

const supabase = createClient(supabaseUrl, serviceKey);

function parseCSV(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell);
      cell = '';
      if (row.length > 0 && row.some(c => c.trim() !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some(c => c.trim() !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

async function importData() {
  const filePath = path.join(__dirname, 'inscricoes_batismo_rows.csv');
  console.log('Lendo arquivo CSV:', filePath);
  const rawContent = fs.readFileSync(filePath, 'utf8');

  const rows = parseCSV(rawContent);
  if (rows.length < 2) {
    console.error('CSV vazio ou sem dados!');
    return;
  }

  const headers = rows[0].map(h => h.trim());
  console.log(`Encontradas ${rows.length - 1} linhas para importar.`);
  console.log('Colunas:', headers);

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const record = {};
    headers.forEach((header, idx) => {
      let val = row[idx] !== undefined ? row[idx].trim() : '';
      if (val === '') {
        record[header] = null;
      } else {
        record[header] = val;
      }
    });

    // Tratar datas inválidas caso existam, ex: 0001-01-01
    if (record.data_batismo === '0001-01-01' || record.data_batismo === '') {
      record.data_batismo = null;
    }
    if (record.data_nascimento === '0001-01-01') {
      record.data_nascimento = null;
    }
    if (record.data_consagracao === '0001-01-01') {
      record.data_consagracao = null;
    }

    records.push(record);
  }

  console.log(`Processando inserção de ${records.length} registros em lotes...`);

  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('inscricoes_batismo')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Erro no lote ${i} a ${i + batch.length}:`, error.message);
    } else {
      successCount += batch.length;
      console.log(`Progresso: ${successCount}/${records.length} registros inseridos.`);
    }
  }

  console.log('--- Migração concluída com sucesso! ---');

  // Verificar contagem final
  const { count } = await supabase
    .from('inscricoes_batismo')
    .select('*', { count: 'exact', head: true });

  console.log(`Total de registros confirmados no novo banco: ${count}`);
}

importData().catch(err => {
  console.error('Erro inesperado:', err);
});
