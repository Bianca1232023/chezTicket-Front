import { useEffect, useRef, useState } from 'react'
import Header from '../../components/Header/Header'
import EventStepper from '../../components/EventStepper/EventStepper'
import EventStepInfo from '../../components/EventStepInfo/EventStepInfo'
import EventStepTickets from '../../components/EventStepTickets/EventStepTickets'
import EventStepPromotion from '../../components/EventStepPromotion/EventStepPromotion'
import EventStepReview from '../../components/EventStepReview/EventStepReview'
import type { EventDraft } from '../../types/event-draft'
import type { CreateCompleteEventRequest } from '../../types/api'
import coverImage from '../../assets/criar-evento/capa-evento-formulario.png'
import { useCreateEvent } from '../../hooks/useCreateEvent'
import '../../styles/pages/criar-evento.scss'

const steps = ['Informações', 'Ingressos', 'Divulgações', 'Revisão']

const headings = [
  {
    title: 'Venda seu ingresso',
    subtitle: 'crie seu evento e comece a vender no chezTicket.',
  },
  {
    title: 'Configure seus Ingressos',
    subtitle: 'crie ingressos que estarão disponíveis para o seu evento.',
  },
  {
    title: 'Divulgue o seu Evento',
    subtitle: 'Adicione os canais onde seu evento será divulgado.',
  },
  {
    title: 'Revise o seu Evento',
    subtitle: 'Confira todas as informações antes de publicar.',
  },
]

const createInitialDraft = (): EventDraft => ({
  name: '',
  categoryId: '',
  categoryName: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  address: '',
  coverFile: null,
  coverPreviewUrl: coverImage,
  tags: ['Evento', 'ao vivo', 'Tecnologia'],
  tickets: [
    {
      name: 'Ingresso Padrão',
      price: 'R$ 50,00',
      serviceFee: '0',
      quantity: '500',
      purchaseLimit: '10',
      salesStart: '',
      salesEnd: '',
    },
    {
      name: 'Meia-entrada',
      price: 'R$ 25,00',
      serviceFee: '0',
      quantity: '100',
      purchaseLimit: '10',
      salesStart: '',
      salesEnd: '',
    },
    {
      name: 'Gratuito',
      price: 'Gratuito',
      serviceFee: '0',
      quantity: '20',
      purchaseLimit: '10',
      salesStart: '',
      salesEnd: '',
    },
  ],
  socialLinks: {
    instagram: '',
    facebook: '',
    x: '',
    linkedin: '',
  },
  promotionFile: null,
  promotionPreviewUrl: '',
})

function parseMoney(value: string) {
  const text = value.replace(/^R\$\s*/i, '').trim()
  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text
  return Number(normalized)
}

function CriarEvento() {
  const [step, setStep] = useState(() => Number(new URLSearchParams(location.search).get('step') ?? 0)) // TEMP
  const [draft, setDraft] = useState(createInitialDraft)
  const [savedEventId, setSavedEventId] = useState<number | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const submitLock = useRef(false)
  const createEvent = useCreateEvent()
  const { title, subtitle } = headings[step]

  useEffect(() => {
    const previewUrls = [draft.coverPreviewUrl, draft.promotionPreviewUrl].filter(
      (url) => url.startsWith('blob:'),
    )

    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [draft.coverPreviewUrl, draft.promotionPreviewUrl])

  const updateDraft = (updates: Partial<EventDraft>) => {
    setDraft((current) => ({ ...current, ...updates }))
  }

  const updateTicket = (
    index: number,
    updates: Partial<EventDraft['tickets'][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      tickets: current.tickets.map((ticket, ticketIndex) =>
        ticketIndex === index ? { ...ticket, ...updates } : ticket,
      ),
    }))
  }

  const removeTicket = (index: number) => {
    setDraft((current) => ({
      ...current,
      tickets: current.tickets.filter((_, ticketIndex) => ticketIndex !== index),
    }))
  }

  const goTo = (target: number) => {
    setStep(Math.min(Math.max(target, 0), steps.length - 1))
    window.scrollTo({ top: 0 })
  }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

  const submit = async (publicar: boolean) => {
    setSubmitError(null)
    setSubmitMessage(null)

    const start = draft.startDate && draft.startTime
      ? `${draft.startDate}T${draft.startTime}:00`
      : ''
    const end = draft.endDate && draft.endTime
      ? `${draft.endDate}T${draft.endTime}:00`
      : ''
    const startTimestamp = start ? new Date(start).getTime() : Number.NaN
    const endTimestamp = end ? new Date(end).getTime() : Number.NaN

    if (!draft.name.trim()) {
      setSubmitError('Informe o nome do evento.')
      return
    }
    if (!draft.categoryId) {
      setSubmitError('Selecione uma categoria.')
      return
    }
    if (!draft.address.trim()) {
      setSubmitError('Informe o endereço do evento.')
      return
    }
    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
      setSubmitError('Informe as datas e os horários de início e término.')
      return
    }
    if (startTimestamp <= Date.now() || endTimestamp <= startTimestamp) {
      setSubmitError('O término deve ocorrer depois do início, e ambos no futuro.')
      return
    }
    if (!draft.tickets.length) {
      setSubmitError('Cadastre ao menos um tipo de ingresso.')
      return
    }

    const tickets: CreateCompleteEventRequest['ingressos'] = []
    for (const ticket of draft.tickets) {
      const free = ticket.name.trim().toLowerCase() === 'gratuito'
      const price = free ? 0 : parseMoney(ticket.price)
      const serviceFee = free ? 0 : parseMoney(ticket.serviceFee)
      const quantity = Number(ticket.quantity)
      const purchaseLimit = Number(ticket.purchaseLimit)

      if (
        !ticket.name.trim() ||
        !Number.isFinite(price) ||
        price < 0 ||
        (!free && price === 0)
      ) {
        setSubmitError(`Confira o nome e o preço do ingresso "${ticket.name}".`)
        return
      }
      if (!Number.isFinite(serviceFee) || serviceFee < 0) {
        setSubmitError(`Confira a taxa de serviço do ingresso "${ticket.name}".`)
        return
      }
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isInteger(purchaseLimit) ||
        purchaseLimit < 1 ||
        purchaseLimit > quantity
      ) {
        setSubmitError(
          `Confira a quantidade e o limite por compra do ingresso "${ticket.name}".`,
        )
        return
      }
      if (ticket.salesStart && ticket.salesEnd && ticket.salesEnd < ticket.salesStart) {
        setSubmitError(`O encerramento das vendas de "${ticket.name}" precede o início.`)
        return
      }

      tickets.push({
        nome: ticket.name.trim(),
        gratuito: free,
        preco: price,
        taxaServico: serviceFee,
        quantidadeTotal: quantity,
        limitePorCompra: purchaseLimit,
        inicioVendas: ticket.salesStart || null,
        fimVendas: ticket.salesEnd || null,
      })
    }

    const socialLinks = Object.fromEntries(
      Object.entries(draft.socialLinks)
        .map(([network, url]) => [network, url.trim()])
        .filter(([, url]) => url),
    )

    const request: CreateCompleteEventRequest = {
      organizadorId: 2,
      categoriaId: Number(draft.categoryId),
      titulo: draft.name.trim(),
      descricao: draft.description.trim(),
      classificacaoEtaria: 'LIVRE',
      politicaReembolso: 'PADRAO',
      endereco: draft.address.trim(),
      inicio: start,
      fim: end,
      tags: draft.tags,
      redesSociais: socialLinks,
      ingressos: tickets,
      publicar,
    }

    if (submitLock.current) return
    submitLock.current = true
    try {
      if (publicar && savedEventId !== null) {
        await createEvent.publishAsync(savedEventId)
        setIsPublished(true)
        setSubmitMessage('Evento publicado com sucesso.')
        return
      }

      const created = await createEvent.mutateAsync({
        request,
        coverFile: draft.coverFile,
        promotionFile: draft.promotionFile,
      })
      setSavedEventId(created.evento.id)
      setIsPublished(publicar)
      setSubmitMessage(
        publicar
          ? 'Evento publicado com sucesso.'
          : 'Rascunho do evento salvo com sucesso.',
      )
    } catch (reason) {
      setSubmitError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível salvar o evento. Tente novamente.',
      )
    } finally {
      submitLock.current = false
    }
  }

  return (
    <>
      <Header active="criar-evento" />
      <main className="criar-evento">
        <div className="criar-evento__container">
          <h1 className="criar-evento__title">{title}</h1>
          <p className="criar-evento__subtitle">{subtitle}</p>
          <EventStepper
            steps={steps}
            current={step}
            className="criar-evento__stepper"
          />

          <div className="criar-evento__content">
            <div hidden={step !== 0}>
              <EventStepInfo draft={draft} onChange={updateDraft} onNext={next} />
            </div>
            <div hidden={step !== 1}>
              <EventStepTickets
                tickets={draft.tickets}
                onTicketChange={updateTicket}
                onTicketRemove={removeTicket}
                onBack={back}
                onNext={next}
              />
            </div>
            <div hidden={step !== 2}>
              <EventStepPromotion
                draft={draft}
                onChange={updateDraft}
                onBack={back}
                onNext={next}
              />
            </div>
            <div hidden={step !== 3}>
              <EventStepReview
                draft={draft}
                onBack={back}
                onEditInfo={() => goTo(0)}
                onEditTickets={() => goTo(1)}
                onEditPromotion={() => goTo(2)}
                onSaveDraft={() => void submit(false)}
                onPublish={() => void submit(true)}
                isSubmitting={createEvent.isPending}
                submitError={submitError}
                submitMessage={submitMessage}
                savedEventId={savedEventId}
                isPublished={isPublished}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default CriarEvento
