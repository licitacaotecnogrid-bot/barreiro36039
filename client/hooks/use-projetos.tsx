import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import {
  getProjetosPesquisa,
  createProjetoPesquisa as supabaseCreateProjetoPesquisa,
  updateProjetoPesquisa as supabaseUpdateProjetoPesquisa,
  deleteProjetoPesquisa as supabaseDeleteProjetoPesquisa,
  getProjetosExtensao,
  createProjetoExtensao as supabaseCreateProjetoExtensao,
  updateProjetoExtensao as supabaseUpdateProjetoExtensao,
  deleteProjetoExtensao as supabaseDeleteProjetoExtensao,
  ProjetoPesquisa,
  ProjetoExtensao,
} from "@/lib/supabase-queries";

export type { ProjetoPesquisa, ProjetoExtensao };

interface ProjetosContextType {
  projetosPesquisa: ProjetoPesquisa[];
  projetosExtensao: ProjetoExtensao[];
  loading: boolean;
  error: string | null;
  addProjetoPesquisa: (projeto: Omit<ProjetoPesquisa, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateProjetoPesquisa: (id: number, projeto: Partial<ProjetoPesquisa>) => Promise<void>;
  deleteProjetoPesquisa: (id: number) => Promise<void>;
  addProjetoExtensao: (projeto: Omit<ProjetoExtensao, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateProjetoExtensao: (id: number, projeto: Partial<ProjetoExtensao>) => Promise<void>;
  deleteProjetoExtensao: (id: number) => Promise<void>;
  getProjetoPesquisaById: (id: number) => ProjetoPesquisa | undefined;
  getProjetoExtensaoById: (id: number) => ProjetoExtensao | undefined;
  getProjetosPesquisaByProfessor: (professorId: number) => ProjetoPesquisa[];
  getProjetosExtensaoByProfessor: (professorId: number) => ProjetoExtensao[];
  refetchProjetos: () => Promise<void>;
}

const ProjetosContext = createContext<ProjetosContextType | undefined>(undefined);

export function ProjetosProvider({ children }: { children: ReactNode }) {
  const [projetosPesquisa, setProjetosPesquisa] = useState<ProjetoPesquisa[]>([]);
  const [projetosExtensao, setProjetosExtensao] = useState<ProjetoExtensao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjetos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pesquisaData, extensaoData] = await Promise.all([
        getProjetosPesquisa(),
        getProjetosExtensao(),
      ]);

      setProjetosPesquisa(pesquisaData);
      setProjetosExtensao(extensaoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar projetos");
      setProjetosPesquisa([]);
      setProjetosExtensao([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjetos();
  }, []);

  const addProjetoPesquisa = async (projeto: Omit<ProjetoPesquisa, "id" | "createdAt" | "updatedAt">) => {
    try {
      await supabaseCreateProjetoPesquisa(projeto);
      await fetchProjetos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar projeto");
      throw err;
    }
  };

  const updateProjetoPesquisa = async (id: number, updates: Partial<ProjetoPesquisa>) => {
    try {
      await supabaseUpdateProjetoPesquisa(id, updates);
      await fetchProjetos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar projeto");
      throw err;
    }
  };

  const deleteProjetoPesquisa = async (id: number) => {
    try {
      await supabaseDeleteProjetoPesquisa(id);
      await fetchProjetos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar projeto");
      throw err;
    }
  };

  const addProjetoExtensao = async (projeto: Omit<ProjetoExtensao, "id" | "createdAt" | "updatedAt">) => {
    try {
      await supabaseCreateProjetoExtensao(projeto);
      await fetchProjetos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar projeto");
      throw err;
    }
  };

  const updateProjetoExtensao = async (id: number, updates: Partial<ProjetoExtensao>) => {
    try {
      await supabaseUpdateProjetoExtensao(id, updates);
      await fetchProjetos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar projeto");
      throw err;
    }
  };

  const deleteProjetoExtensao = async (id: number) => {
    try {
      await supabaseDeleteProjetoExtensao(id);
      await fetchProjetos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar projeto");
      throw err;
    }
  };

  const getProjetoPesquisaById = (id: number) => {
    return projetosPesquisa.find((p) => p.id === id);
  };

  const getProjetoExtensaoById = (id: number) => {
    return projetosExtensao.find((p) => p.id === id);
  };

  const getProjetosPesquisaByProfessor = (professorId: number) => {
    return projetosPesquisa.filter((p) => p.professorCoordenadorId === professorId);
  };

  const getProjetosExtensaoByProfessor = (professorId: number) => {
    return projetosExtensao.filter((p) => p.professorCoordenadorId === professorId);
  };

  return (
    <ProjetosContext.Provider
      value={{
        projetosPesquisa,
        projetosExtensao,
        loading,
        error,
        addProjetoPesquisa,
        updateProjetoPesquisa,
        deleteProjetoPesquisa,
        addProjetoExtensao,
        updateProjetoExtensao,
        deleteProjetoExtensao,
        getProjetoPesquisaById,
        getProjetoExtensaoById,
        getProjetosPesquisaByProfessor,
        getProjetosExtensaoByProfessor,
        refetchProjetos: fetchProjetos,
      }}
    >
      {children}
    </ProjetosContext.Provider>
  );
}

export function useProjetos() {
  const context = useContext(ProjetosContext);
  if (context === undefined) {
    throw new Error("useProjetos must be used within ProjetosProvider");
  }
  return context;
}
