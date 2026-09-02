import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado. Token de acesso não fornecido.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'ID do usuário e nova senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase incompleta no servidor.' },
        { status: 500 }
      );
    }

    // Cliente com o token do usuário requisitante
    const callerSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // 1. Validar quem está fazendo a requisição
    const { data: { user: callerUser }, error: authError } = await callerSupabase.auth.getUser(token);
    if (authError || !callerUser) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    // 2. Verificar se o chamador é Master
    const { data: perfil, error: perfilError } = await callerSupabase
      .from('perfil_usuarios')
      .select('role, status')
      .eq('id', callerUser.id)
      .single();

    const isMaster = perfil?.role === 'master' || callerUser.user_metadata?.role === 'master';
    if (perfilError || !isMaster || perfil?.status !== 'aprovado') {
      return NextResponse.json(
        { error: 'Acesso negado: Apenas usuários com perfil Master ativo podem alterar senhas.' },
        { status: 403 }
      );
    }

    // 3. Executar a alteração de senha
    // Opção A: Se a chave SUPABASE_SERVICE_ROLE_KEY estiver disponível
    if (supabaseServiceKey) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        return NextResponse.json(
          { error: `Erro ao atualizar senha: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Senha alterada com sucesso via Admin API!',
      });
    }

    // Opção B: Fallback via RPC PostgreSQL
    const { data: rpcData, error: rpcError } = await callerSupabase.rpc(
      'alterar_senha_usuario',
      {
        usuario_id: userId,
        nova_senha: newPassword,
      }
    );

    if (rpcError) {
      return NextResponse.json(
        { error: `Erro ao atualizar senha via banco: ${rpcError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso!',
      data: rpcData,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/admin/alterar-senha:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno do servidor ao alterar senha.' },
      { status: 500 }
    );
  }
}
