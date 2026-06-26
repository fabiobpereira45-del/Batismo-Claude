"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LoginForm = () => {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já estiver logado ao carregar a página (sessão existente)
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
  );

  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro
        const { supabase: sb } = await import('@/lib/supabase');
        const { error: signUpError } = await sb.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccessMessage('Cadastro realizado com sucesso! Aguarde a aprovação de um administrador.');
          setIsSignUp(false);
          setPassword('');
        }
        setLoading(false);
      } else {
        // Fluxo de Login
        const { error: signInError } = await signIn(email.trim(), password);

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
        } else {
          // Login bem-sucedido: o signIn() já verificou o perfil e atualizou o contexto.
          // Redirecionar para o dashboard.
          router.push('/admin/dashboard');
          // Não chamamos setLoading(false) pois a navegação vai ocorrer
        }
      }
    } catch (err) {
      setError(`Erro ao tentar ${isSignUp ? 'cadastrar' : 'fazer login'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Criar Nova Conta' : 'Login Admin'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Crie uma senha (mínimo 6 chars)" : "Sua senha"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar'}
            </Button>
            
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
            
            <Link href="/" className="w-full mt-2">
              <Button type="button" variant="outline" className="w-full">
                Voltar ao formulário inicial
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
