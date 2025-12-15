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
  status: string;
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
  odsAssociadas: OdsEvento[] | number[];
  anexos: AnexoEvento[] | string[];
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
      .from("evento")
      .select("*")
      .order("data", { ascending: false });

    if (error) throw error;

    const eventosComDetalhes = await Promise.all(
      (eventos || []).map(async (evento) => {
        const [odsData, anexosData] = await Promise.all([
          supabase
            .from("ods_evento")
            .select("*")
            .eq("evento_id", evento.id),
          supabase
            .from("anexo_evento")
            .select("*")
            .eq("evento_id", evento.id),
        ]);

        return {
          ...evento,
          odsAssociadas: odsData.data || [],
          anexos: anexosData.data || [],
        };
      })
    );

    return eventosComDetalhes;
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    throw error;
  }
}

export async function getEventoById(id: number): Promise<Evento> {
  try {
    const { data: evento, error: eventoError } = await supabase
      .from("evento")
      .select("*")
      .eq("id", id)
      .single();

    if (eventoError) throw eventoError;

    const [odsData, anexosData] = await Promise.all([
      supabase.from("ods_evento").select("*").eq("evento_id", id),
      supabase.from("anexo_evento").select("*").eq("evento_id", id),
    ]);

    return {
      ...evento,
      odsAssociadas: odsData.data || [],
      anexos: anexosData.data || [],
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
      .from("evento")
      .insert([
        {
          titulo: evento.titulo,
          data: evento.data,
          responsavel: evento.responsavel,
          status: evento.status,
          local: evento.local,
          curso: evento.curso,
          tipo_evento: evento.tipoEvento,
          modalidade: evento.modalidade,
          descricao: evento.descricao,
          imagem: evento.imagem,
          documento: evento.documento,
          link: evento.link,
        },
      ])
      .select()
      .single();

    if (eventoError) throw eventoError;

    const eventoId = newEvento.id;

    if (evento.odsAssociadas && evento.odsAssociadas.length > 0) {
      const odsRecords = evento.odsAssociadas.map((ods) => ({
        evento_id: eventoId,
        ods_numero: ods.odsNumero || ods.id,
      }));
      await supabase.from("ods_evento").insert(odsRecords);
    }

    if (evento.anexos && evento.anexos.length > 0) {
      const anexoRecords = evento.anexos.map((anexo) => ({
        evento_id: eventoId,
        nome: anexo.nome,
      }));
      await supabase.from("anexo_evento").insert(anexoRecords);
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
    if (updates.tipoEvento) updateData.tipo_evento = updates.tipoEvento;
    if (updates.modalidade) updateData.modalidade = updates.modalidade;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.imagem) updateData.imagem = updates.imagem;
    if (updates.documento) updateData.documento = updates.documento;
    if (updates.link !== undefined) updateData.link = updates.link;

    const { error: updateError } = await supabase
      .from("evento")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw updateError;

    if (updates.odsAssociadas) {
      await supabase.from("ods_evento").delete().eq("evento_id", id);
      const odsRecords = updates.odsAssociadas.map((ods) => ({
        evento_id: id,
        ods_numero: ods.odsNumero || ods.id,
      }));
      if (odsRecords.length > 0) {
        await supabase.from("ods_evento").insert(odsRecords);
      }
    }

    if (updates.anexos) {
      await supabase.from("anexo_evento").delete().eq("evento_id", id);
      const anexoRecords = updates.anexos.map((anexo) => ({
        evento_id: id,
        nome: anexo.nome,
      }));
      if (anexoRecords.length > 0) {
        await supabase.from("anexo_evento").insert(anexoRecords);
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
    await supabase.from("ods_evento").delete().eq("evento_id", id);
    await supabase.from("anexo_evento").delete().eq("evento_id", id);
    const { error } = await supabase.from("evento").delete().eq("id", id);

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
      .from("comentario_evento")
      .select(
        `
        *,
        usuario:usuario_id(id, nome, email)
      `
      )
      .eq("evento_id", eventoId)
      .order("criado_em", { ascending: false });

    if (error) throw error;

    return (comentarios || []).map((c: any) => ({
      id: c.id,
      eventoId: c.evento_id,
      usuarioId: c.usuario_id,
      autor: c.autor,
      conteudo: c.conteudo,
      criadoEm: c.criado_em,
      atualizadoEm: c.atualizado_em,
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
      .from("comentario_evento")
      .insert([
        {
          evento_id: eventoId,
          usuario_id: usuarioId || null,
          autor,
          conteudo,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: newComentario.id,
      eventoId: newComentario.evento_id,
      usuarioId: newComentario.usuario_id,
      autor: newComentario.autor,
      conteudo: newComentario.conteudo,
      criadoEm: newComentario.criado_em,
      atualizadoEm: newComentario.atualizado_em,
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
      .from("comentario_evento")
      .update({ conteudo })
      .eq("id", comentarioId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      eventoId: updated.evento_id,
      usuarioId: updated.usuario_id,
      autor: updated.autor,
      conteudo: updated.conteudo,
      criadoEm: updated.criado_em,
      atualizadoEm: updated.atualizado_em,
    };
  } catch (error) {
    console.error("Erro ao atualizar comentário:", error);
    throw error;
  }
}

export async function deleteComentario(comentarioId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("comentario_evento")
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
      .from("materia")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Erro ao buscar matérias:", error);
    throw error;
  }
}

export async function getMateriaById(id: number): Promise<Materia> {
  try {
    const { data, error } = await supabase
      .from("materia")
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
      .from("materia")
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
      .from("materia")
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
    const { error } = await supabase.from("materia").delete().eq("id", id);

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
      .from("usuario")
      .select("id, nome, email, cargo, curso")
      .eq("cargo", "Coordenador")
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      cargo: p.cargo,
      curso: p.curso,
    }));
  } catch (error) {
    console.error("Erro ao buscar professores:", error);
    throw error;
  }
}

export async function getProfessorById(
  id: number
): Promise<ProfessorCoordenador> {
  try {
    const { data, error } = await supabase
      .from("usuario")
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
      .from("usuario")
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
      .from("usuario")
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
    const { error } = await supabase.from("usuario").delete().eq("id", id);

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
      .from("projeto_pesquisa")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      titulo: p.titulo,
      areaTematica: p.area_tematica,
      descricao: p.descricao,
      momentoOcorre: p.momento_ocorre,
      problemaPesquisa: p.problema_pesquisa,
      metodologia: p.metodologia,
      resultadosEsperados: p.resultados_esperados,
      imagem: p.imagem,
      professorCoordenadorId: p.professor_coordenador_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (error) {
    console.error("Erro ao buscar projetos de pesquisa:", error);
    throw error;
  }
}

export async function getProjetoPesquisaById(
  id: number
): Promise<ProjetoPesquisa> {
  try {
    const { data, error } = await supabase
      .from("projeto_pesquisa")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.area_tematica,
      descricao: data.descricao,
      momentoOcorre: data.momento_ocorre,
      problemaPesquisa: data.problema_pesquisa,
      metodologia: data.metodologia,
      resultadosEsperados: data.resultados_esperados,
      imagem: data.imagem,
      professorCoordenadorId: data.professor_coordenador_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
      .from("projeto_pesquisa")
      .insert([
        {
          titulo: projeto.titulo,
          area_tematica: projeto.areaTematica,
          descricao: projeto.descricao,
          momento_ocorre: projeto.momentoOcorre,
          problema_pesquisa: projeto.problemaPesquisa,
          metodologia: projeto.metodologia,
          resultados_esperados: projeto.resultadosEsperados,
          imagem: projeto.imagem,
          professor_coordenador_id: projeto.professorCoordenadorId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.area_tematica,
      descricao: data.descricao,
      momentoOcorre: data.momento_ocorre,
      problemaPesquisa: data.problema_pesquisa,
      metodologia: data.metodologia,
      resultadosEsperados: data.resultados_esperados,
      imagem: data.imagem,
      professorCoordenadorId: data.professor_coordenador_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
    if (updates.areaTematica) updateData.area_tematica = updates.areaTematica;
    if (updates.descricao) updateData.descricao = updates.descricao;
    if (updates.momentoOcorre) updateData.momento_ocorre = updates.momentoOcorre;
    if (updates.problemaPesquisa)
      updateData.problema_pesquisa = updates.problemaPesquisa;
    if (updates.metodologia) updateData.metodologia = updates.metodologia;
    if (updates.resultadosEsperados)
      updateData.resultados_esperados = updates.resultadosEsperados;
    if (updates.imagem) updateData.imagem = updates.imagem;

    const { data, error } = await supabase
      .from("projeto_pesquisa")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.area_tematica,
      descricao: data.descricao,
      momentoOcorre: data.momento_ocorre,
      problemaPesquisa: data.problema_pesquisa,
      metodologia: data.metodologia,
      resultadosEsperados: data.resultados_esperados,
      imagem: data.imagem,
      professorCoordenadorId: data.professor_coordenador_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Erro ao atualizar projeto de pesquisa:", error);
    throw error;
  }
}

export async function deleteProjetoPesquisa(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("projeto_pesquisa")
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
      .from("projeto_extensao")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      titulo: p.titulo,
      areaTematica: p.area_tematica,
      descricao: p.descricao,
      momentoOcorre: p.momento_ocorre,
      tipoPessoasProcuram: p.tipo_pessoas_procuram,
      comunidadeEnvolvida: p.comunidade_envolvida,
      imagem: p.imagem,
      professorCoordenadorId: p.professor_coordenador_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (error) {
    console.error("Erro ao buscar projetos de extensão:", error);
    throw error;
  }
}

export async function getProjetoExtensaoById(
  id: number
): Promise<ProjetoExtensao> {
  try {
    const { data, error } = await supabase
      .from("projeto_extensao")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.area_tematica,
      descricao: data.descricao,
      momentoOcorre: data.momento_ocorre,
      tipoPessoasProcuram: data.tipo_pessoas_procuram,
      comunidadeEnvolvida: data.comunidade_envolvida,
      imagem: data.imagem,
      professorCoordenadorId: data.professor_coordenador_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
      .from("projeto_extensao")
      .insert([
        {
          titulo: projeto.titulo,
          area_tematica: projeto.areaTematica,
          descricao: projeto.descricao,
          momento_ocorre: projeto.momentoOcorre,
          tipo_pessoas_procuram: projeto.tipoPessoasProcuram,
          comunidade_envolvida: projeto.comunidadeEnvolvida,
          imagem: projeto.imagem,
          professor_coordenador_id: projeto.professorCoordenadorId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.area_tematica,
      descricao: data.descricao,
      momentoOcorre: data.momento_ocorre,
      tipoPessoasProcuram: data.tipo_pessoas_procuram,
      comunidadeEnvolvida: data.comunidade_envolvida,
      imagem: data.imagem,
      professorCoordenadorId: data.professor_coordenador_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
    if (updates.areaTematica) updateData.area_tematica = updates.areaTematica;
    if (updates.descricao) updateData.descricao = updates.descricao;
    if (updates.momentoOcorre) updateData.momento_ocorre = updates.momentoOcorre;
    if (updates.tipoPessoasProcuram)
      updateData.tipo_pessoas_procuram = updates.tipoPessoasProcuram;
    if (updates.comunidadeEnvolvida)
      updateData.comunidade_envolvida = updates.comunidadeEnvolvida;
    if (updates.imagem) updateData.imagem = updates.imagem;

    const { data, error } = await supabase
      .from("projeto_extensao")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      titulo: data.titulo,
      areaTematica: data.area_tematica,
      descricao: data.descricao,
      momentoOcorre: data.momento_ocorre,
      tipoPessoasProcuram: data.tipo_pessoas_procuram,
      comunidadeEnvolvida: data.comunidade_envolvida,
      imagem: data.imagem,
      professorCoordenadorId: data.professor_coordenador_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Erro ao atualizar projeto de extensão:", error);
    throw error;
  }
}

export async function deleteProjetoExtensao(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from("projeto_extensao")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar projeto de extensão:", error);
    throw error;
  }
}
