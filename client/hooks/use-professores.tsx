import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import {
  getProfessores,
  createProfessor as supabaseCreateProfessor,
  updateProfessor as supabaseUpdateProfessor,
  deleteProfessor as supabaseDeleteProfessor,
  ProfessorCoordenador,
} from "@/lib/supabase-queries";

export type { ProfessorCoordenador };

interface ProfessoresContextType {
  professores: ProfessorCoordenador[];
  loading: boolean;
  error: string | null;
  addProfessor: (professor: Omit<ProfessorCoordenador, "id">) => Promise<void>;
  updateProfessor: (id: number, professor: Partial<ProfessorCoordenador>) => Promise<void>;
  deleteProfessor: (id: number) => Promise<void>;
  getProfessorById: (id: number) => ProfessorCoordenador | undefined;
  refetchProfessores: () => Promise<void>;
}

const ProfessoresContext = createContext<ProfessoresContextType | undefined>(undefined);

export function ProfessoresProvider({ children }: { children: ReactNode }) {
  const [professores, setProfessores] = useState<ProfessorCoordenador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfessores();
      setProfessores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar professores");
      setProfessores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessores();
  }, []);

  const addProfessor = async (professor: Omit<ProfessorCoordenador, "id">) => {
    try {
      await supabaseCreateProfessor(professor);
      await fetchProfessores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar professor");
      throw err;
    }
  };

  const updateProfessor = async (id: number, updates: Partial<ProfessorCoordenador>) => {
    try {
      await supabaseUpdateProfessor(id, updates);
      await fetchProfessores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar professor");
      throw err;
    }
  };

  const deleteProfessor = async (id: number) => {
    try {
      await supabaseDeleteProfessor(id);
      await fetchProfessores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar professor");
      throw err;
    }
  };

  const getProfessorById = (id: number) => {
    return professores.find((p) => p.id === id);
  };

  return (
    <ProfessoresContext.Provider value={{ professores, loading, error, addProfessor, updateProfessor, deleteProfessor, getProfessorById, refetchProfessores: fetchProfessores }}>
      {children}
    </ProfessoresContext.Provider>
  );
}

export function useProfessores() {
  const context = useContext(ProfessoresContext);
  if (context === undefined) {
    throw new Error("useProfessores must be used within ProfessoresProvider");
  }
  return context;
}
