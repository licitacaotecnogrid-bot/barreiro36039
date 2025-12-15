import { supabase } from "./supabase";
import type { Status } from "@/data/mock";

export interface OdsEvento {
  id: number;
  eventoId: number;
  odsNumero: number;
  criadoEm: string;
}

export interface AnexoEvento {
  id: number;
  eventoId: number;
  nome: string;
  criadoEm: string;
}

export interface Evento {
  id: number;
  titulo: string;
  data: string;
  responsavel: string;
  status: Status;
  local?: string | null;
  curso: string;
  tipoEvento: string;
  modalidade: string;
  descricao?: string | null;
  imagem?: string | null;
  documento?: string | null;
  link?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  odsAssociadas?: OdsEvento[] | number[];
  anexos?: AnexoEvento[] | string[];
}

export interface ComentarioEvento {
  id: number;
  eventoId: number;
  usuarioId: number | null;
  autor: string;
  conteudo: string;
  criadoEm: string;
  atualizadoEm: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
  };
}

export interface Materia {
  id: number;
  nome: string;
  descricao: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ProfessorCoordenador {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
  curso?: string;
  senha?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ProjetoPesquisa {
  id: number;
  titulo: string;
  areaTematica: string;
  descricao: string;
  momentoOcorre: string;
  problemaPesquisa: string;
  metodologia: string;
  resultadosEsperados: string;
  imagem?: string | null;
  professorCoordenadorId: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface ProjetoExtensao {
  id: number;
  titulo: string;
  areaTematica: string;
  descricao: string;
  momentoOcorre: string;
  tipoPessoasProcuram: string;
  comunidadeEnvolvida: string;
  imagem?: string | null;
  professorCoordenadorId: number;
  updatedAt?: string;
  createdAt?: string;
}

// ============================================================================
// EVENTOS
// ============================================================================

export async function getEventos(): Promise<Evento[]> {
  try {
    const { data: eventos, error } = await supabase
      .from("Evento")
      .select("*")
      .order("data", { ascending: false });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Supabase error: ${errorMsg}`);
    }

    const eventosComDetalhes = await Promise.all(
      (eventos || []).map(async (evento) => {
        const [odsData, anexosData] = await Promise.all([
          supabase
            .from("OdsEvento")
            .select("*")
            .eq("eventoId", evento.id),
          supabase
            .from("AnexoEvento")
            .select("*")
            .eq("eventoId", evento.id),
        ]);

        return {
          ...evento,
          odsAssociadas: (odsData.data || []).map((ods: any) => ({
            id: ods.id,
            eventoId: ods.eventoId,
            odsNumero: ods.odsNumero,
            criadoEm: ods.criadoEm,
          })),
          anexos: (anexosData.data || []).map((anexo: any) => ({
            id: anexo.id,
            eventoId: anexo.eventoId,
            nome: anexo.nome,
            criadoEm: anexo.criadoEm,
          })),
        };
      })
    );

    return eventosComDetalhes;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Erro ao buscar eventos:", errorMsg);
    throw error;
  }
}

export async function getEventoById(id: number): Promise<Evento> {
  try {
    const { data: evento, error: eventoError } = await supabase
      .from("Evento")
      .select("*")
      .eq("id", id)
      .single();

    if (eventoError) throw eventoError;

    const [odsData, anexosData] = await Promise.all([
      supabase.from("OdsEvento").select("*").eq("eventoId", id),
      supabase.from("AnexoEvento").select("*").eq("eventoId", id),
    ]);

    return {
      ...evento,
      odsAssociadas: (odsData.data || []).map((ods: any) => ({
        id: ods.id,
        eventoId: ods.eventoId,
        odsNumero: ods.odsNumero,
        criadoEm: ods.criadoEm,
      })),
      anexos: (anexosData.data || []).map((anexo: any) => ({
        id: anexo.id,
        eventoId: anexo.eventoId,
        nome: anexo.nome,
        criadoEm: anexo.criadoEm,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    throw error;
  }
}

export async function createEvento(
  evento: Omit<Evento, "id" | "criadoEm" | "atualizadoEm">
): Promise<Evento> {
  try {
    const { data: newEvento, error: eventoError } = await supabase
      .from("Evento")
      .insert([
        {
          titulo: evento.titulo,
          data: evento.data,
          responsavel: evento.responsavel,
          status: evento.status,
          local: evento.local,
          curso: evento.curso,
          tipoEvento: evento.tipoEvento,
          modalidade: evento.modalidade,
          descricao: evento.descricao,
          imagem: evento.imagem,
          documento: evento.documento,
          link: evento.link,
        },
      ])
      .select()
      .single();

    if (eventoError) {
      const errorMsg = eventoError instanceof Error ? eventoError.message : JSON.stringify(eventoError);
      throw new Error(`Supabase error: ${errorMsg}`);
    }

    const eventoId = newEvento.id;

    if (evento.odsAssociadas && evento.odsAssociadas.length > 0) {
      const odsRecords = evento.odsAssociadas.map((ods: any) => ({
        eventoId: eventoId,
        odsNumero: typeof ods === "number" ? ods : (ods.odsNumero || ods.id),
      }));
      await supabase.from("OdsEvento").insert(odsRecords);
    }

    if (evento.anexos && evento.anexos.length > 0) {
      const anexoRecords = evento.anexos.map((anexo: any) => ({
        eventoId: eventoId,
        nome: typeof anexo === "string" ? anexo : anexo.nome,
      }));
      await supabase.from("AnexoEvento").insert(anexoRecords);
    }

    return getEventoById(eventoId);
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    throw error;
  }
}

export async function updateEvento(
  id: number,
  updates: Partial<Evento>
): Promise<Evento> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.titulo) updateData.titulo = updates.titulo;
    if (updates.data) updateData.data = updates.data;
    if (updates.responsavel) updateData.responsavel = updates.responsavel;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.local !== undefined) updateData.local = updates.local;
    if (updates.curso) updateData.curso = updates.curso;
    if (updates.tipoEvento) updateData.tipoEvento = updates.tipoEvento;
    if (updates.modalidade) updateData.modalidade = updates.modalidade;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.imagem) updateData.imagem = updates.imagem;
    if (updates.documento) updateData.documento = updates.documento;
    if (updates.link !== undefined) updateData.link = updates.link;

    const { error: updateError } = await supabase
      .from("Evento")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw updateError;

    if (updates.odsAssociadas) {
      await supabase.from("OdsEvento").delete().eq("eventoId", id);
      const odsRecords = updates.odsAssociadas.map((ods: any) => ({
        eventoId: id,
        odsNumero: typeof ods === "number" ? ods : (ods.odsNumero || ods.id),
      }));
      if (odsRecords.length > 0) {
        await supabase.from("OdsEvento").insert(odsRecords);
      }
    }

    if (updates.anexos) {
      await supabase.from("AnexoEvento").delete().eq("eventoId", id);
      const anexoRecords = updates.anexos.map((anexo: any) => ({
        eventoId: id,
        nome: typeof anexo === "string" ? anexo : anexo.nome,
      }));
      if (anexoRecords.length > 0) {
        await supabase.from("AnexoEvento").insert(anexoRecords);
      }
    }

    return getEventoById(id);
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    throw error;
  }
}

export async function deleteEvento(id: number): Promise<void> {
  try {
    await supabase.from("OdsEvento").delete().eq("eventoId", id);
    await supabase.from("AnexoEvento").delete().eq("eventoId", id);
    const { error } = await supabase.from("Evento").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    throw error;
  }
}

// ============================================================================
// COMENTARIOS
// ============================================================================

export async function getComentariosByEvento(
  eventoId: number
): Promise<ComentarioEvento[]> {
  try {
    const { data: comentarios, error } = await supabase
      .from("ComentarioEvento")
      .select(
        `
        *,
        usuario:usuarioId(id, nome, email)
      `
      )
      .eq("eventoId", eventoId)
      .order("criadoEm", { ascending: false });

    if (error) throw error;

    return (comentarios || []).map((c: any) => ({
      id: c.id,
      eventoId: c.eventoId,
      usuarioId: c.usuarioId,
      autor: c.autor,
      conteudo: c.conteudo,
      criadoEm: c.criadoEm,
      atualizadoEm: c.atualizadoEm,
      usuario: c.usuario ? c.usuario : null,
    }));
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    throw error;
  }
}

export async function createComentario(
  eventoId: number,
  autor: string,
  conteudo: string,
  usuarioId?: number
): Promise<ComentarioEvento> {
  try {
    const { data: newComentario, error } = await supabase
      .from("ComentarioEvento")
      .insert([
        {
          eventoId: eventoId,
          usuarioId: usuarioId || null,
          autor,
          conteudo,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: newComentario.id,
      eventoId: newComentario.eventoId,
      usuarioId: newComentario.usuarioId,
      autor: newComentario.autor,
      conteudo: newComentario.conteudo,
      criadoEm: newComentario.criadoEm,
      atualizadoEm: newComentario.atualizadoEm,
    };
  } catch (error) {
    console.error("Erro ao criar comentário:", error);
    throw error;
  }
}

export async function updateComentario(
  comentarioId: number,
  conteudo: string
): Promise<ComentarioEvento> {
  try {
    const { data: updated, error } = await supabase
      .from("ComentarioEvento")
      .update({ conteudo })
      .eq("id", comentarioId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      eventoId: updated.eventoId,
      usuarioId: updated.usuarioId,
      autor: updated.autor,
      conteudo: updated.conteudo,
      criadoEm: updated.criadoEm,
      atualizadoEm: updated.atualizadoEm,
    };
  } catch (error) {
    console.error("Erro ao atualizar comentário:", error);
    throw error;
  }
}

export async function deleteComentario(comentarioId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("ComentarioEvento")
      .delete()
      .eq("id", comentarioId);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar comentário:", error);
    throw error;
  }
}

// ============================================================================
// MATERIAS
// ============================================================================

export async function getMaterias(): Promise<Materia[]> {
  try {
    const { data, error } = await supabase
      .from("Materia")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Supabase error: ${errorMsg}`);
    }

    return data || [];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Erro ao buscar matérias:", errorMsg);
    throw error;
  }
}

export async function getMateriaById(id: number): Promise<Materia> {
  try {
    const { data, error } = await supabase
      .from("Materia")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Erro ao buscar matéria:", error);
    throw error;
  }
}

export async function createMateria(
  materia: Omit<Materia, "id">
): Promise<Materia> {
  try {
    const { data, error } = await supabase
      .from("Materia")
      .insert([{ nome: materia.nome, descricao: materia.descricao }])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Erro ao criar matéria:", error);
    throw error;
  }
}

export async function updateMateria(
  id: number,
  updates: Partial<Materia>
): Promise<Materia> {
  try {
    const { data, error } = await supabase
      .from("Materia")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Erro ao atualizar matéria:", error);
    throw error;
  }
}

export async function deleteMateria(id: number): Promise<void> {
  try {
    const { error } = await supabase.from("Materia").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar matéria:", error);
    throw error;
  }
}

// ============================================================================
// PROFESSORES (ProfessorCoordenador)
// ============================================================================

export async function getProfessores(): Promise<ProfessorCoordenador[]> {
  try {
    const { data, error } = await supabase
      .from("Usuario")
      .select("id, nome, email, cargo, curso")
      .eq("cargo", "Coordenador")
      .order("nome", { ascending: true });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Supabase error: ${errorMsg}`);
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      cargo: p.cargo,
      curso: p.curso,
    }));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Erro ao buscar professores:", errorMsg);
    throw error;
  }
}

export async function getProfessorById(
  id: number
): Promise<ProfessorCoordenador> {
  try {
    const { data, error } = await supabase
      .from("Usuario")
      .select("id, nome, email, cargo, curso")
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      cargo: data.cargo,
      curso: data.curso,
    };
  } catch (error) {
    console.error("Erro ao buscar professor:", error);
    throw error;
  }
}

export async function createProfessor(
  professor: Omit<ProfessorCoordenador, "id">
): Promise<ProfessorCoordenador> {
  try {
    const { data, error } = await supabase
      .from("Usuario")
      .insert([
        {
          nome: professor.nome,
          email: professor.email,
          senha: professor.senha,
          cargo: "Coordenador",
          curso: professor.curso,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      cargo: data.cargo,
      curso: data.curso,
    };
  } catch (error) {
    console.error("Erro ao criar professor:", error);
    throw error;
  }
}

export async function updateProfessor(
  id: number,
  updates: Partial<ProfessorCoordenador>
): Promise<ProfessorCoordenador> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.nome) updateData.nome = updates.nome;
    if (updates.email) updateData.email = updates.email;
    if (updates.senha) updateData.senha = updates.senha;
    if (updates.curso) updateData.curso = updates.curso;

    const { data, error } = await supabase
      .from("Usuario")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      cargo: data.cargo,
      curso: data.curso,
    };
  } catch (error) {
    console.error("Erro ao atualizar professor:", error);
    throw error;
  }
}

export async function deleteProfessor(id: number): Promise<void> {
  try {
    const { error } = await supabase.from("Usuario").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar professor:", error);
    throw error;
  }
}

// ============================================================================
// PROJETOS PESQUISA
// ============================================================================

export async function getProjetosPesquisa(): Promise<ProjetoPesquisa[]> {
  try {
    const { data, error } = await supabase
      .from("ProjetoPesquisa")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Supabase error: ${errorMsg}`);
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      titulo: p.titulo,
      areaTematica: p.areaTematica,
      descricao: p.descricao,
      momentoOcorre: p.momentoOcorre,
      problemaPesquisa: p.problemaPesquisa,
      metodologia: p.metodologia,
      resultadosEsperados: p.resultadosEsperados,
      imagem: p.imagem,
      professorCoordenadorId: p.professorCoordenadorId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Erro ao buscar projetos de pesquisa:", errorMsg);
    throw error;
  }
}

export async function getProjetoPesquisaById(
  id: number
): Promise<ProjetoPesquisa> {
  try {
    const { data, error } = await supabase
      .from("ProjetoPesquisa")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.areaTematica,
      descricao: data.descricao,
      momentoOcorre: data.momentoOcorre,
      problemaPesquisa: data.problemaPesquisa,
      metodologia: data.metodologia,
      resultadosEsperados: data.resultadosEsperados,
      imagem: data.imagem,
      professorCoordenadorId: data.professorCoordenadorId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao buscar projeto de pesquisa:", error);
    throw error;
  }
}

export async function createProjetoPesquisa(
  projeto: Omit<ProjetoPesquisa, "id" | "createdAt" | "updatedAt">
): Promise<ProjetoPesquisa> {
  try {
    const { data, error } = await supabase
      .from("ProjetoPesquisa")
      .insert([
        {
          titulo: projeto.titulo,
          areaTematica: projeto.areaTematica,
          descricao: projeto.descricao,
          momentoOcorre: projeto.momentoOcorre,
          problemaPesquisa: projeto.problemaPesquisa,
          metodologia: projeto.metodologia,
          resultadosEsperados: projeto.resultadosEsperados,
          imagem: projeto.imagem,
          professorCoordenadorId: projeto.professorCoordenadorId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.areaTematica,
      descricao: data.descricao,
      momentoOcorre: data.momentoOcorre,
      problemaPesquisa: data.problemaPesquisa,
      metodologia: data.metodologia,
      resultadosEsperados: data.resultadosEsperados,
      imagem: data.imagem,
      professorCoordenadorId: data.professorCoordenadorId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao criar projeto de pesquisa:", error);
    throw error;
  }
}

export async function updateProjetoPesquisa(
  id: number,
  updates: Partial<ProjetoPesquisa>
): Promise<ProjetoPesquisa> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.titulo) updateData.titulo = updates.titulo;
    if (updates.areaTematica) updateData.areaTematica = updates.areaTematica;
    if (updates.descricao) updateData.descricao = updates.descricao;
    if (updates.momentoOcorre) updateData.momentoOcorre = updates.momentoOcorre;
    if (updates.problemaPesquisa)
      updateData.problemaPesquisa = updates.problemaPesquisa;
    if (updates.metodologia) updateData.metodologia = updates.metodologia;
    if (updates.resultadosEsperados)
      updateData.resultadosEsperados = updates.resultadosEsperados;
    if (updates.imagem) updateData.imagem = updates.imagem;

    const { data, error } = await supabase
      .from("ProjetoPesquisa")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.areaTematica,
      descricao: data.descricao,
      momentoOcorre: data.momentoOcorre,
      problemaPesquisa: data.problemaPesquisa,
      metodologia: data.metodologia,
      resultadosEsperados: data.resultadosEsperados,
      imagem: data.imagem,
      professorCoordenadorId: data.professorCoordenadorId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao atualizar projeto de pesquisa:", error);
    throw error;
  }
}

export async function deleteProjetoPesquisa(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("ProjetoPesquisa")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar projeto de pesquisa:", error);
    throw error;
  }
}

// ============================================================================
// PROJETOS EXTENSAO
// ============================================================================

export async function getProjetosExtensao(): Promise<ProjetoExtensao[]> {
  try {
    const { data, error } = await supabase
      .from("ProjetoExtensao")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Supabase error: ${errorMsg}`);
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      titulo: p.titulo,
      areaTematica: p.areaTematica,
      descricao: p.descricao,
      momentoOcorre: p.momentoOcorre,
      tipoPessoasProcuram: p.tipoPessoasProcuram,
      comunidadeEnvolvida: p.comunidadeEnvolvida,
      imagem: p.imagem,
      professorCoordenadorId: p.professorCoordenadorId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Erro ao buscar projetos de extensão:", errorMsg);
    throw error;
  }
}

export async function getProjetoExtensaoById(
  id: number
): Promise<ProjetoExtensao> {
  try {
    const { data, error } = await supabase
      .from("ProjetoExtensao")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.areaTematica,
      descricao: data.descricao,
      momentoOcorre: data.momentoOcorre,
      tipoPessoasProcuram: data.tipoPessoasProcuram,
      comunidadeEnvolvida: data.comunidadeEnvolvida,
      imagem: data.imagem,
      professorCoordenadorId: data.professorCoordenadorId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao buscar projeto de extensão:", error);
    throw error;
  }
}

export async function createProjetoExtensao(
  projeto: Omit<ProjetoExtensao, "id" | "createdAt" | "updatedAt">
): Promise<ProjetoExtensao> {
  try {
    const { data, error } = await supabase
      .from("ProjetoExtensao")
      .insert([
        {
          titulo: projeto.titulo,
          areaTematica: projeto.areaTematica,
          descricao: projeto.descricao,
          momentoOcorre: projeto.momentoOcorre,
          tipoPessoasProcuram: projeto.tipoPessoasProcuram,
          comunidadeEnvolvida: projeto.comunidadeEnvolvida,
          imagem: projeto.imagem,
          professorCoordenadorId: projeto.professorCoordenadorId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.areaTematica,
      descricao: data.descricao,
      momentoOcorre: data.momentoOcorre,
      tipoPessoasProcuram: data.tipoPessoasProcuram,
      comunidadeEnvolvida: data.comunidadeEnvolvida,
      imagem: data.imagem,
      professorCoordenadorId: data.professorCoordenadorId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao criar projeto de extensão:", error);
    throw error;
  }
}

export async function updateProjetoExtensao(
  id: number,
  updates: Partial<ProjetoExtensao>
): Promise<ProjetoExtensao> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.titulo) updateData.titulo = updates.titulo;
    if (updates.areaTematica) updateData.areaTematica = updates.areaTematica;
    if (updates.descricao) updateData.descricao = updates.descricao;
    if (updates.momentoOcorre) updateData.momentoOcorre = updates.momentoOcorre;
    if (updates.tipoPessoasProcuram)
      updateData.tipoPessoasProcuram = updates.tipoPessoasProcuram;
    if (updates.comunidadeEnvolvida)
      updateData.comunidadeEnvolvida = updates.comunidadeEnvolvida;
    if (updates.imagem) updateData.imagem = updates.imagem;

    const { data, error } = await supabase
      .from("ProjetoExtensao")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.areaTematica,
      descricao: data.descricao,
      momentoOcorre: data.momentoOcorre,
      tipoPessoasProcuram: data.tipoPessoasProcuram,
      comunidadeEnvolvida: data.comunidadeEnvolvida,
      imagem: data.imagem,
      professorCoordenadorId: data.professorCoordenadorId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao atualizar projeto de extensão:", error);
    throw error;
  }
}

export async function deleteProjetoExtensao(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("ProjetoExtensao")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar projeto de extensão:", error);
    throw error;
  }
}
