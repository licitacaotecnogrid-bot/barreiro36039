import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import {
  getEventos,
  createEvento as supabaseCreateEvento,
  updateEvento as supabaseUpdateEvento,
  deleteEvento as supabaseDeleteEvento,
  Evento,
  OdsEvento,
  AnexoEvento,
} from "@/lib/supabase-queries";
import { Status } from "@/data/mock";

export type { OdsEvento, AnexoEvento, Evento };

interface EventsContextType {
  eventos: Evento[];
  loading: boolean;
  error: string | null;
  addEvento: (evento: Omit<Evento, "id" | "criadoEm" | "atualizadoEm">) => Promise<void>;
  updateEvento: (id: number, evento: Partial<Evento>) => Promise<void>;
  deleteEvento: (id: number) => Promise<void>;
  refetchEventos: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEventos();
      setEventos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar eventos");
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const addEvento = async (evento: Omit<Evento, "id" | "criadoEm" | "atualizadoEm">) => {
    try {
      await supabaseCreateEvento(evento);
      await fetchEventos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar evento");
      throw err;
    }
  };

  const updateEvento = async (id: number, updates: Partial<Evento>) => {
    try {
      await supabaseUpdateEvento(id, updates);
      await fetchEventos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar evento");
      throw err;
    }
  };

  const deleteEvento = async (id: number) => {
    try {
      await supabaseDeleteEvento(id);
      await fetchEventos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar evento");
      throw err;
    }
  };

  return (
    <EventsContext.Provider value={{ eventos, loading, error, addEvento, updateEvento, deleteEvento, refetchEventos: fetchEventos }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within EventsProvider");
  }
  return context;
}
