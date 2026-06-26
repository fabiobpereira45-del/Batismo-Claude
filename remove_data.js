const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    for (const { searchValue, replaceValue } of replacements) {
        content = content.replace(searchValue, replaceValue);
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
}

// 1. components/formulario-batismo.tsx
replaceInFile('scratch/Batismo/components/formulario-batismo.tsx', [
    { searchValue: /^\s*data_batismo:\s*string;\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*data_batismo\?:\s*string;\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*data_batismo:\s*"",\r?\n/gm, replaceValue: '' },
    { searchValue: /^\s*data_batismo:\s*formData\.data_batismo,\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*if \(!formData\.data_batismo\) \{[\s\S]*?\}\r?\n\s*\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*<div className=\{inputClass\("data_batismo"\)\}>[\s\S]*?<\/div>\r?\n\s*\r?\n/m, replaceValue: '' }
]);

// 2. app/admin/inscricoes/page.tsx
replaceInFile('scratch/Batismo/app/admin/inscricoes/page.tsx', [
    { searchValue: /^\s*data_batismo:\s*string;\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*if \(filtroDataInicio\) \{[\s\S]*?\}\r?\n\s*if \(filtroDataFim\) \{[\s\S]*?\}\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*<div>\r?\n\s*<label className="block text-sm font-medium text-gray-700 mb-1">\r?\n\s*Data Início[\s\S]*?<\/div>\r?\n\s*<div>\r?\n\s*<label className="block text-sm font-medium text-gray-700 mb-1">\r?\n\s*Data Fim[\s\S]*?<\/div>\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\r?\n\s*Data Batismo\r?\n\s*<\/th>\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\r?\n\s*\{new Date\(inscricao\.data_batismo\)\.toLocaleDateString\('pt-BR'\)\}\r?\n\s*<\/td>\r?\n/m, replaceValue: '' }
]);

// 3. app/admin/inscricoes/[id]/edit/page.tsx
replaceInFile('scratch/Batismo/app/admin/inscricoes/[id]/edit/page.tsx', [
    { searchValue: /^\s*data_batismo:\s*string;\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*data_batismo:\s*'',\r?\n/gm, replaceValue: '' },
    { searchValue: /^\s*data_batismo:\s*data\.data_batismo,\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*data_batismo:\s*formData\.data_batismo,\r?\n/m, replaceValue: '' },
    { searchValue: /^\s*<div>\r?\n\s*<label className="block text-sm font-medium text-gray-700 mb-1">\r?\n\s*Data do Batismo\r?\n\s*<\/label>\r?\n\s*<Input\r?\n\s*name="data_batismo"\r?\n\s*type="date"\r?\n\s*value=\{formData\.data_batismo\}\r?\n\s*onChange=\{handleChange\}\r?\n\s*required\r?\n\s*\/>\r?\n\s*<\/div>\r?\n\s*\r?\n/m, replaceValue: '' }
]);

// 4. lib/pdf-generator.ts
replaceInFile('scratch/Batismo/lib/pdf-generator.ts', [
    { searchValue: /^\s*data_batismo:\s*string;\r?\n/m, replaceValue: '' },
    { searchValue: /'Data Batismo'/m, replaceValue: '' }, // Need to remove it from the array
    { searchValue: /,\s*'Data Batismo'/m, replaceValue: '' },
    { searchValue: /^\s*new Date\(inscricao\.data_batismo\)\.toLocaleDateString\('pt-BR'\),\r?\n/m, replaceValue: '' }
]);

// 5. supabase/create_table_completa.sql
replaceInFile('scratch/Batismo/supabase/create_table_completa.sql', [
    { searchValue: /^\s*data_batismo\s*DATE\s*NOT\s*NULL,\r?\n/m, replaceValue: '' }
]);
