import React, { createContext, useState, useContext, ReactNode } from "react";
import {
  getComentariosByEvento,
  createComentario as supabaseCreateComentario,
  deleteComentario as supabaseDeleteComentario,
  ComentarioEvento,
} from "@/lib/supabase-queries";

export type { ComentarioEvento };

interface ComentariosContextType {
  comentarios: ComentarioEvento[];
  loading: boolean;
  error: string | null;
  addComentario: (eventoId: number, autor: string, conteudo: string, usuarioId?: number) => Promise<void>;
  deleteComentario: (eventoId: number, comentarioId: number) => Promise<void>;
  refetchComentarios: (eventoId: number) => Promise<void>;
}

const ComentariosContext = createContext<ComentariosContextType | undefined>(undefined);

export function ComentariosProvider({ children }: { children: ReactNode }) {
  const [comentarios, setComentarios] = useState<ComentarioEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComentarios = async (eventoId: number) => {
    if (!eventoId || eventoId <= 0) {
      setComentarios([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getComentariosByEvento(eventoId);
      setComentarios(data || []);
    } catch (err) {
      console.error("Erro ao buscar comentários:", err);
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  };

  const addComentario = async (eventoId: number, autor: string, conteudo: string, usuarioId?: number) => {
    if (!eventoId || eventoId <= 0) {
      throw new Error("ID do evento inválido");
    }

    try {
      await supabaseCreateComentario(eventoId, autor, conteudo, usuarioId);
      await fetchComentarios(eventoId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar comentário";
      console.error("Erro ao criar comentário:", err);
      setError(errorMessage);
      throw err;
    }
  };

  const deleteComentario = async (eventoId: number, comentarioId: number) => {
    if (!eventoId || eventoId <= 0) {
      throw new Error("ID do evento inválido");
    }

    try {
      await supabaseDeleteComentario(comentarioId);
      await fetchComentarios(eventoId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar comentário";
      console.error("Erro ao deletar comentário:", err);
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <ComentariosContext.Provider value={{ comentarios, loading, error, addComentario, deleteComentario, refetchComentarios: fetchComentarios }}>
      {children}
    </ComentariosContext.Provider>
  );
}

export function useComentarios() {
  const context = useContext(ComentariosContext);
  if (context === undefined) {
    throw new Error("useComentarios must be used within ComentariosProvider");
  }
  return context;
}
