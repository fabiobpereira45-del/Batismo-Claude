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

// Busca o perfil e retorna null se não encontrado (sem lançar erro)
async function fetchPerfil(userId: string) {
  const { data, error } = await supabase
    .from('perfil_usuarios')
    .select('role, status')
    .eq('id', userId)
    .single();
  if (error) {
    console.warn('fetchPerfil error:', error.message);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  // Flag para evitar que o onAuthStateChange processe eventos enquanto o signIn/signOut interno já está em andamento
  const skipNextAuthEvent = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Inicializa a sessão existente UMA única vez
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const perfil = await fetchPerfil(session.user.id);

          if (perfil && perfil.status !== 'aprovado') {
            // Usuário não aprovado — faz logout silencioso
            skipNextAuthEvent.current = true;
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setIsMaster(false);
            }
          } else {
            if (mounted) {
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
        } else {
          if (mounted) {
            setUser(null);
            setIsMaster(false);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setUser(null);
          setIsMaster(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // O onAuthStateChange lida apenas com mudanças APÓS a inicialização
    // (ex: expiração de token, login em outra aba, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorar eventos disparados por ações internas (signIn/signOut que já tratamos)
        if (skipNextAuthEvent.current) {
          skipNextAuthEvent.current = false;
          return;
        }

        // Só reagir a eventos SIGNED_OUT ou TOKEN_REFRESHED, não a SIGNED_IN
        // pois o signIn já trata o estado diretamente
        if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            setIsMaster(false);
            setLoading(false);
          }
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Revalidar perfil quando o token é renovado
          const perfil = await fetchPerfil(session.user.id);
          if (perfil && perfil.status !== 'aprovado') {
            skipNextAuthEvent.current = true;
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setIsMaster(false);
              setLoading(false);
            }
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

        // Para SIGNED_IN vindo de outra aba ou refresh externo
        if (event === 'SIGNED_IN' && session?.user) {
          const perfil = await fetchPerfil(session.user.id);
          if (perfil && perfil.status !== 'aprovado') {
            skipNextAuthEvent.current = true;
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setIsMaster(false);
              setLoading(false);
            }
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
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      if (data?.user) {
        const perfil = await fetchPerfil(data.user.id);

        if (perfil && perfil.status !== 'aprovado') {
          // Bloquear acesso — faz logout e informa
          skipNextAuthEvent.current = true;
          await supabase.auth.signOut();
          setUser(null);
          setIsMaster(false);
          setLoading(false);
          return { error: { message: 'Sua conta ainda não foi aprovada por um administrador.' } };
        }

        // Sucesso — atualizar contexto antes de redirecionar
        // Marcar para o onAuthStateChange ignorar o SIGNED_IN que vai disparar
        skipNextAuthEvent.current = true;
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: perfil?.role || 'padrao',
        });
        setIsMaster(
          perfil?.role === 'master' ||
          data.user.user_metadata?.role === 'master'
        );
        setLoading(false);
      } else {
        setLoading(false);
      }

      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: { message: err.message || 'Erro ao fazer login.' } };
    }
  };

  const signOut = async () => {
    skipNextAuthEvent.current = true;
    await supabase.auth.signOut();
    setUser(null);
    setIsMaster(false);
    setLoading(false);
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