import type { EventDraft } from '../types/event-draft'
import placeholderCover from '../assets/criar-evento/capa-evento-formulario.png'

export type PublicationIssue = { step: 0 | 1; message: string }

const parseAmount = (value: string) => {
  const text = value.replace(/^R\$\s*/i, '').trim()
  return Number(text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text)
}

/** Orientação de pré-publicação no formulário; o backend continua sendo a validação final. */
export function getPublicationIssues(draft: EventDraft): PublicationIssue[] {
  const issues: PublicationIssue[] = []
  const info = (message: string) => issues.push({ step: 0, message })
  const tickets = (message: string) => issues.push({ step: 1, message })

  if (!draft.name.trim()) info('Informe o nome do evento.')
  if (!draft.categoryId) info('Selecione a categoria do evento.')
  if (!draft.description.trim()) info('Preencha a descrição do evento.')
  if (!draft.coverFile && (!draft.coverPreviewUrl || draft.coverPreviewUrl === placeholderCover)) {
    info('Envie uma imagem de capa; a imagem ilustrativa não é uma capa cadastrada.')
  }
  if (!draft.address.trim() || !draft.city.trim() || !/^[A-Za-z]{2}$/.test(draft.state.trim())) {
    info('Informe endereço, cidade e UF válida (duas letras).')
  }
  const start = new Date(`${draft.startDate}T${draft.startTime || '00:00'}`).getTime()
  const end = new Date(`${draft.endDate}T${draft.endTime || '00:00'}`).getTime()
  if (!draft.startDate || !draft.startTime || !draft.endDate || !draft.endTime ||
      !Number.isFinite(start) || !Number.isFinite(end) || start <= Date.now() || end <= start) {
    info('Informe datas e horários futuros, com término posterior ao início.')
  }
  if (!draft.tickets.length) {
    tickets('Cadastre pelo menos um tipo de ingresso.')
  }
  for (const [index, ticket] of draft.tickets.entries()) {
    const name = ticket.name.trim()
    const free = name.toLocaleLowerCase('pt-BR') === 'gratuito'
    const price = free ? 0 : parseAmount(ticket.price)
    const fee = free ? 0 : parseAmount(ticket.serviceFee)
    const quantity = Number(ticket.quantity)
    const limit = Number(ticket.purchaseLimit)
    if (!name || !Number.isFinite(price) || price < 0 || (!free && price <= 0) ||
        !Number.isFinite(fee) || fee < 0 || !Number.isInteger(quantity) || quantity < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > quantity) {
      tickets(`Confira nome, preço, taxa, quantidade e limite do ingresso ${index + 1}.`)
    }
    if ((ticket.salesStart && ticket.salesStart > draft.startDate) ||
        (ticket.salesEnd && ticket.salesEnd > draft.startDate) ||
        (ticket.salesStart && ticket.salesEnd && ticket.salesStart > ticket.salesEnd)) {
      tickets(`Confira as datas de venda do ingresso ${index + 1}.`)
    }
  }
  const total = draft.tickets.reduce((sum, ticket) => sum + Number(ticket.quantity || 0), 0)
  if (total > 1_000_000) tickets('O total de ingressos não pode exceder um milhão.')
  return issues
}
