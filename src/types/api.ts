export type ApiCategory = {
  id: number
  nome: string
  slug: string
  ativa: boolean
  criadaEm: string
}

export type ApiEventSummary = {
  id: number
  titulo: string
  status: string
  categoriaId: number
  organizadorId: number
  dataPublicacao: string | null
}

export type ApiEvent = ApiEventSummary & {
  descricao: string | null
  classificacaoEtaria: string
  classificacaoEtariaDescricao: string
  imagemCapa: string | null
  politicaReembolso: string
  politicaReembolsoDescricao: string
  criadoEm: string
  atualizadoEm: string
}

export type ApiSession = {
  id: number
  eventoId: number
  localId: number
  inicio: string
  fim: string
  status: string
}

export type ApiLocation = {
  id: number
  nome: string
  endereco: string
  cidade: string
  uf: string
  capacidadeTotal: number
  criadoEm: string
}

export type ApiTicketType = {
  id: number
  sessaoId: number
  nome: string
  gratuito: boolean
  preco: number
  taxaServico: number
  quantidadeTotal: number
  quantidadeVendida: number
  quantidadeDisponivel: number
  limitePorCompra: number
}

export type ApiEventSession = ApiSession & {
  local: ApiLocation
  tiposIngresso: ApiTicketType[]
}
