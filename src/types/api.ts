export type ApiCategory = {
  id: number
  nome: string
  slug: string
  ativa: boolean
  criadaEm: string
}

export type ApiUser = {
  id: number
  nome: string
  email: string
  cpf: string
}

export type ApiProfile = {
  usuario: ApiUser
  eventos: ApiProfileEvent[]
  reservas: ApiProfileReservationItem[]
}

export type ApiProfileEvent = {
  id: number
  titulo: string
  status: string
  imagemCapa: string | null
  inicio: string | null
  local: string | null
}

export type ApiProfileReservationItem = {
  id: number
  status: string
  expiraEm: string
  criadaEm: string
  eventoId: number
  eventoTitulo: string
  imagemCapa: string | null
  inicio: string
  local: string | null
  ingresso: string
  quantidade: number
  preco: number
  taxaServico: number
}

export type ApiCreatedReservation = {
  id: number
  status: string
  expiraEm: string
  criadaEm: string
}

export type ApiPedidoResult = {
  pedido: {
    id: number
    status: string
  }
  checkoutUrl: string | null
}

export type ApiItemPedido = {
  tipoIngressoId: number
  quantidade: number
  precoUnitario: number
}

export type ApiPedido = {
  id: number
  participanteId: number
  reservaId: number | null
  cupomId: number | null
  itens: ApiItemPedido[]
  subtotal: number
  valorTaxa: number
  valorTotal: number
  status: string
  criadoEm: string
  atualizadoEm: string | null
}

export type ApiIngresso = {
  id: number
  pedidoId: number
  tipoIngressoId: number
  codigoQr: string
  status: string
  titular: string | null
  dataEmissao: string | null
}

export type ApiEventSummary = {
  id: number
  titulo: string
  status: string
  categoriaId: number
  organizadorId: number
  imagemCapa: string | null
  dataPublicacao: string | null
}

export type ApiEvent = ApiEventSummary & {
  descricao: string | null
  classificacaoEtaria: string
  classificacaoEtariaDescricao: string
  imagemCapa: string | null
  imagemDivulgacao: string | null
  tags: string[]
  redesSociais: Record<string, string>
  politicaReembolso: string
  politicaReembolsoDescricao: string
  criadoEm: string
  atualizadoEm: string
}

export type ApiSession = {
  id: number
  eventoId: number
  localId: number | null
  endereco: string | null
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
  inicioVendas: string | null
  fimVendas: string | null
}

export type ApiEventSession = ApiSession & {
  local: ApiLocation | null
  tiposIngresso: ApiTicketType[]
}

export type CreateCompleteEventRequest = {
  organizadorId: number
  categoriaId: number
  titulo: string
  descricao: string
  classificacaoEtaria: string
  politicaReembolso: string
  endereco: string
  inicio: string
  fim: string
  tags: string[]
  redesSociais: Record<string, string>
  cupom: {
    codigo: string
    percentualDesconto: number
  } | null
  ingressos: Array<{
    nome: string
    gratuito: boolean
    preco: number
    taxaServico: number
    quantidadeTotal: number
    limitePorCompra: number
    inicioVendas: string | null
    fimVendas: string | null
  }>
  publicar: boolean
}

export type ApiValidatedCoupon = {
  codigo: string
  percentualDesconto: number
  validoAte: string
}

export type ApiCreatedEvent = {
  evento: ApiEvent
  sessao: ApiSession
  ingressos: ApiTicketType[]
}
