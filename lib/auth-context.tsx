"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isMaster: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchPerfil(userId: string) {
  try {
    // Timeout de 8 segundos para evitar travamento se a rede/banco falhar
    const fetchPromise = supabase
      .from('perfil_usuarios')
      .select('role, status')
      .eq('id', userId)
      .single();

    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 8000)
    );

    const { data, error } = await Promise.race([
      fetchPromise,
      timeoutPromise
    ]);

    if (error) {
      console.warn('fetchPerfil:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.error('fetchPerfil error or timeout:', err.message || err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true apenas durante init
  const [isMaster, setIsMaster] = useState(false);

  // Quando true, o próximo evento do onAuthStateChange é ignorado.
  // Usado para evitar double-processing quando o próprio código dispara signIn/signOut.
  const skipNextEvent = useRef(false);

  // Evita concorrência e race condition entre initAuth e os primeiros eventos do listener
  const isInitializing = useRef(true);

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança global: desativa a tela de "Verificando autenticação..."
    // após 10 segundos, no pior cenário, para não deixar o usuário preso.
    const globalTimeout = setTimeout(() => {
      if (mounted && isInitializing.current) {
        console.warn('Timeout de segurança do AuthProvider disparado.');
        isInitializing.current = false;
        setLoading(false);
      }
    }, 10000);

    // ─── Inicialização: verifica sessão existente ───────────────────────────
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const perfil = await fetchPerfil(session.user.id);

          if (perfil && perfil.status !== 'aprovado') {
            // Sessão existente mas usuário não aprovado — derruba
            skipNextEvent.current = true;
            await supabase.auth.signOut();
            if (mounted) { setUser(null); setIsMaster(false); }
          } else if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: perfil?.role || 'padrao',
            });
            setIsMaster(
              perfil?.role === 'master' ||
              session.user.user_metadata?.role === 'master'
            );
          }
        } else if (mounted) {
          setUser(null);
          setIsMaster(false);
        }
      } catch (e) {
        console.error('initAuth error:', e);
        if (mounted) { setUser(null); setIsMaster(false); }
      } finally {
        isInitializing.current = false;
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // ─── Listener: mudanças externas de sessão ──────────────────────────────
    // Cobre: logout em outra aba, expiração de token, OAuth callback
    // NÃO é usado para o fluxo de login manual (gerenciado pelo signIn())
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Se ainda estiver no processo de inicialização, ignoramos eventos
        // porque initAuth() está cuidando do estado inicial.
        if (isInitializing.current) {
          if (event === 'SIGNED_OUT') {
            if (mounted) { setUser(null); setIsMaster(false); }
          }
          return;
        }

        // Pular evento que foi disparado pelo próprio código desta app
        if (skipNextEvent.current) {
          skipNextEvent.current = false;
          return;
        }

        if (event === 'SIGNED_OUT') {
          if (mounted) { setUser(null); setIsMaster(false); }
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          const perfil = await fetchPerfil(session.user.id);
          if (perfil && perfil.status !== 'aprovado') {
            skipNextEvent.current = true;
            await supabase.auth.signOut();
            if (mounted) { setUser(null); setIsMaster(false); }
          } else if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: perfil?.role || 'padrao',
            });
            setIsMaster(
              perfil?.role === 'master' ||
              session.user.user_metadata?.role === 'master'
            );
          }
          return;
        }

        // SIGNED_IN vindo de outra aba / OAuth (NÃO do login manual)
        if (event === 'SIGNED_IN' && session?.user) {
          const perfil = await fetchPerfil(session.user.id);
          if (perfil && perfil.status !== 'aprovado') {
            skipNextEvent.current = true;
            await supabase.auth.signOut();
            if (mounted) { setUser(null); setIsMaster(false); }
          } else if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: perfil?.role || 'padrao',
            });
            setIsMaster(
              perfil?.role === 'master' ||
              session.user.user_metadata?.role === 'master'
            );
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(globalTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  // ─── signIn: gerencia o fluxo completo de login manual ──────────────────
  // NÃO toca em loading (gerenciado pelo formulário).
  // Define skipNextEvent ANTES do signInWithPassword para o evento SIGNED_IN
  // não ser processado duas vezes pelo listener acima.
  const signIn = async (email: string, password: string): Promise<{ error: any }> => {
    // Marcar ANTES para o listener ignorar o SIGNED_IN que vai disparar
    skipNextEvent.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        skipNextEvent.current = false; // Nenhum evento vai disparar com erro
        return { error };
      }

      if (!data?.user) {
        skipNextEvent.current = false;
        return { error: { message: 'Resposta inesperada do servidor.' } };
      }

      // Verificar aprovação no banco
      const perfil = await fetchPerfil(data.user.id);

      if (perfil && perfil.status !== 'aprovado') {
        // Usuário não aprovado — derrubar sessão
        skipNextEvent.current = true; // Pular o SIGNED_OUT que vai disparar
        await supabase.auth.signOut();
        setUser(null);
        setIsMaster(false);
        return { error: { message: 'Sua conta ainda não foi aprovada por um administrador.' } };
      }

      // ✅ Sucesso — atualizar contexto
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        role: perfil?.role || 'padrao',
      });
      setIsMaster(
        perfil?.role === 'master' ||
        data.user.user_metadata?.role === 'master'
      );

      return { error: null };
    } catch (err: any) {
      skipNextEvent.current = false;
      return { error: { message: err.message || 'Erro inesperado ao fazer login.' } };
    }
  };

  const signOut = async () => {
    // 1. Limpar estado IMEDIATAMENTE — UI responde na hora
    setUser(null);
    setIsMaster(false);
    // 2. Avisar o listener para ignorar o SIGNED_OUT que vai disparar
    skipNextEvent.current = true;
    // 3. Revogar sessão no servidor em background (fire-and-forget)
    //    Se falhar na rede, o estado local já foi limpo
    supabase.auth.signOut().catch(console.error);
    // 4. Garantia extra: limpar o localStorage do Supabase
    //    (previne sessão "fantasma" se o signOut de rede falhar)
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
    } catch (e) {
      // localStorage pode não estar disponível em SSR
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isMaster, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}