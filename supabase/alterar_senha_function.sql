-- ==============================================================================
-- Função para permitir que usuários Master alterem a senha de qualquer usuário
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Cria ou atualiza a função de alteração de senha
CREATE OR REPLACE FUNCTION public.alterar_senha_usuario(usuario_id uuid, nova_senha text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_is_master BOOLEAN;
BEGIN
  -- 1. Verifica se quem está logado possui a role 'master'
  SELECT EXISTS (
    SELECT 1 FROM public.perfil_usuarios 
    WHERE id = auth.uid() AND role = 'master'
  ) INTO v_is_master;

  IF NOT v_is_master THEN
    RAISE EXCEPTION 'Acesso negado: Apenas usuários Master podem alterar senhas.';
  END IF;

  -- 2. Valida o tamanho da nova senha
  IF length(nova_senha) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
  END IF;

  -- 3. Atualiza o hash da senha diretamente na tabela auth.users do Supabase
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(nova_senha, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = usuario_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Senha alterada com sucesso.');
END;
$$;

-- 2. Concede permissão de execução aos usuários autenticados
GRANT EXECUTE ON FUNCTION public.alterar_senha_usuario(uuid, text) TO authenticated;
