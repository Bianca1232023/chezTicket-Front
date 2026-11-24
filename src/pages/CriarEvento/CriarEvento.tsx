import { useEffect, useRef, useState } from 'react'
import Header from '../../components/Header/Header'
import EventStepper from '../../components/EventStepper/EventStepper'
import EventStepInfo from '../../components/EventStepInfo/EventStepInfo'
import EventStepTickets from '../../components/EventStepTickets/EventStepTickets'
import EventStepPromotion from '../../components/EventStepPromotion/EventStepPromotion'
import EventStepReview from '../../components/EventStepReview/EventStepReview'
import type { EventDraft } from '../../types/event-draft'
import type { CreateCompleteEventRequest } from '../../types/api'
import { useAuth } from '../../context/AuthContext'
import coverImage from '../../assets/criar-evento/capa-evento-formulario.png'
import { useCreateEvent } from '../../hooks/useCreateEvent'
import { getPublicationIssues } from '../../utils/publication-validation'
import { useRouteParam } from '../../hooks/useRoute'
import { eventService } from '../../services/api/event-service'
import type { ApiEditableDraft } from '../../types/api'
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
  city: '',
  state: '',
  coverFile: null,
  coverPreviewUrl: coverImage,
  tags: [],
  couponEnabled: false,
  couponDiscountPercent: '10',
  couponCode: '',
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

function money(amount: number) {
  return `R$ ${Number(amount).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`
}

function draftFromApi(data: ApiEditableDraft): EventDraft {
  const [startDate, startTime = ''] = data.inicio.split('T')
  const [endDate, endTime = ''] = data.fim.split('T')
  return {
    ...createInitialDraft(),
    name: data.titulo,
    categoryId: String(data.categoriaId),
    description: data.descricao ?? '',
    startDate,
    startTime: startTime.slice(0, 5),
    endDate,
    endTime: endTime.slice(0, 5),
    address: data.endereco,
    city: data.cidade,
    state: data.uf,
    coverFile: null,
    coverPreviewUrl: data.imagemCapa || coverImage,
    promotionFile: null,
    promotionPreviewUrl: data.imagemDivulgacao ?? '',
    tags: data.tags,
    socialLinks: {
      instagram: data.redesSociais.instagram ?? '',
      facebook: data.redesSociais.facebook ?? '',
      x: data.redesSociais.x ?? '',
      linkedin: data.redesSociais.linkedin ?? '',
    },
    couponEnabled: Boolean(data.cupom),
    couponDiscountPercent: String(data.cupom?.percentualDesconto ?? 10),
    couponCode: data.cupom?.codigo ?? '',
    tickets: data.ingressos.map((ticket) => ({
      id: ticket.id,
      name: ticket.nome,
      price: ticket.gratuito ? 'Gratuito' : money(ticket.preco),
      serviceFee: money(ticket.taxaServico),
      quantity: String(ticket.quantidadeTotal),
      purchaseLimit: String(ticket.limitePorCompra),
      salesStart: ticket.inicioVendas ?? '',
      salesEnd: ticket.fimVendas ?? '',
    })),
  }
}

function CriarEvento() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(createInitialDraft)
  const idParam = useRouteParam('id')
  const editId = /^[1-9]\d*$/.test(idParam) ? Number(idParam) : null
  const isEditing = editId !== null
  const [loadingDraft, setLoadingDraft] = useState(isEditing)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savedEventId, setSavedEventId] = useState<number | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const submitLock = useRef(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const createEvent = useCreateEvent()
  const { user } = useAuth()
  const { title, subtitle } = headings[step]
  const publicationIssues = getPublicationIssues(draft)

  useEffect(() => {
    if (editId !== null) return
    setDraft(createInitialDraft())
    setSavedEventId(null)
    setHasUnsavedChanges(false)
    setIsPublished(false)
    setStep(0)
    setLoadingDraft(false)
    setLoadError(null)
    setSubmitError(null)
    setSubmitMessage(null)
  }, [editId])

  useEffect(() => {
    if (editId === null) return
    const controller = new AbortController()
    setLoadingDraft(true)
    setLoadError(null)
    eventService.getEditableDraft(editId, controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setDraft(draftFromApi(data))
      setSavedEventId(editId)
      setHasUnsavedChanges(false)
      setStep(0)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setLoadError(error instanceof Error ? error.message : 'Não foi possível abrir o rascunho.')
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingDraft(false)
    })
    return () => controller.abort()
  }, [editId])

  useEffect(() => {
    const previewUrls = [draft.coverPreviewUrl, draft.promotionPreviewUrl].filter(
      (url) => url.startsWith('blob:'),
    )

    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [draft.coverPreviewUrl, draft.promotionPreviewUrl])

  const updateDraft = (updates: Partial<EventDraft>) => {
    // O nome da categoria e apenas um dado de exibicao, preenchido
    // automaticamente ao carregar um rascunho. Nao representa edicao.
    if (Object.keys(updates).some((key) => key !== 'categoryName')) {
      setHasUnsavedChanges(true)
    }
    setDraft((current) => ({ ...current, ...updates }))
  }

  const updateTicket = (
    index: number,
    updates: Partial<EventDraft['tickets'][number]>,
  ) => {
    setHasUnsavedChanges(true)
    setDraft((current) => ({
      ...current,
      tickets: current.tickets.map((ticket, ticketIndex) =>
        ticketIndex === index ? { ...ticket, ...updates } : ticket,
      ),
    }))
  }

  const addTicket = () => {
    setHasUnsavedChanges(true)
    setDraft((current) => ({
      ...current,
      tickets: [...current.tickets, {
        name: 'Novo ingresso', price: 'R$ 30,00', serviceFee: '0',
        quantity: '100', purchaseLimit: '10', salesStart: '', salesEnd: '',
      }],
    }))
  }

  const removeTicket = (index: number) => {
    setHasUnsavedChanges(true)
    setDraft((current) => ({
      ...current,
      tickets: current.tickets.filter((_, ticketIndex) => ticketIndex !== index),
    }))
  }

  const goTo = (target: number) => {
    setStep(Math.min(Math.max(target, 0), steps.length - 1))
    window.scrollTo({ top: 0 })
  }
  const getCouponValidationError = () => {
    if (!draft.couponEnabled) return null

    const discount = Number(draft.couponDiscountPercent)
    if (!Number.isInteger(discount) || discount < 1 || discount > 99) {
      return 'Informe um desconto entre 1% e 99%. Cupons de 100% exigem um fluxo gratuito específico.'
    }
    if (!/^[A-Za-z0-9]{8}$/.test(draft.couponCode)) {
      return 'O código do cupom deve conter exatamente 8 caracteres alfanuméricos.'
    }
    return null
  }
  const next = () => {
    if (step === 1) {
      const error = getCouponValidationError()
      setCouponError(error)
      if (error) return
    }
    goTo(step + 1)
  }
  const back = () => goTo(step - 1)

  const submit = async (publicar: boolean) => {
    setSubmitError(null)
    setSubmitMessage(null)
    if (!user?.papeis?.includes('ORGANIZADOR')) {
      setSubmitError('Faça login com uma conta de organizador para salvar um evento.')
      return
    }
    if (publicar && savedEventId === null) {
      setSubmitError('Salve o evento como rascunho antes de publicar.')
      return
    }
    if (publicar && hasUnsavedChanges) {
      setSubmitError('Existem alterações não salvas. Salve as alterações antes de publicar.')
      return
    }
    if (publicar && publicationIssues.length > 0) {
      setSubmitError('Não foi possível publicar. Confira os itens pendentes na lista "O que falta para publicar?" e salve as alterações.')
      return
    }
    if (isPublished) {
      setSubmitError('Este evento já foi publicado.')
      return
    }
    if (!publicar && savedEventId !== null && !isEditing) {
      setSubmitError('Este rascunho já foi salvo. Abra-o em Meus Eventos para editar.')
      return
    }
    for (const file of [draft.coverFile, draft.promotionFile]) {
      if (!file) continue
      if (file.size > 5 * 1024 * 1024 ||
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setSubmitError('Cada imagem deve ser JPG, PNG ou WEBP, com no máximo 5 MB.')
        return
      }
    }
    if (draft.tags.length > 10 || draft.tags.some((tag) => tag.length > 40)) {
      setSubmitError('Use no máximo 10 tags, com até 40 caracteres cada.')
      return
    }
    for (const value of Object.values(draft.socialLinks)) {
      if (!value.trim()) continue
      try {
        const url = new URL(value.trim())
        if (url.protocol !== 'https:') throw new Error('HTTPS obrigatório')
      } catch {
        setSubmitError('Preencha os links sociais com URLs HTTPS válidas.')
        return
      }
    }
    const couponValidationError = getCouponValidationError()
    if (couponValidationError) {
      setCouponError(couponValidationError)
      setSubmitError(couponValidationError)
      goTo(1)
      return
    }

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
    if (draft.address.trim().length > 255 || !draft.city.trim() ||
        !/^[A-Za-z]{2}$/.test(draft.state.trim())) {
      setSubmitError('Informe endereço (até 255 caracteres), cidade e UF com duas letras.')
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
      if ((ticket.salesStart && ticket.salesStart > draft.startDate) ||
          (ticket.salesEnd && ticket.salesEnd > draft.startDate) ||
          (ticket.salesStart && ticket.salesEnd && ticket.salesEnd < ticket.salesStart)) {
        setSubmitError(`As datas de venda de "${ticket.name}" devem estar em ordem e até o dia do evento.`)
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
      categoriaId: Number(draft.categoryId),
      titulo: draft.name.trim(),
      descricao: draft.description.trim(),
      classificacaoEtaria: 'LIVRE',
      politicaReembolso: 'PADRAO',
      endereco: draft.address.trim(),
      cidade: draft.city.trim(),
      uf: draft.state.trim().toUpperCase(),
      inicio: start,
      fim: end,
      tags: draft.tags,
      redesSociais: socialLinks,
      cupom: draft.couponEnabled
        ? {
          codigo: draft.couponCode,
          percentualDesconto: Number(draft.couponDiscountPercent),
        }
        : null,
      ingressos: tickets,
      publicar,
    }

    if (submitLock.current) return
    if (publicar && !window.confirm(
      'Publicar este evento agora? Ele ficará visível no catálogo e não poderá mais ser editado como rascunho.',
    )) return
    submitLock.current = true
    setSavingDraft(true)
    try {
      if (publicar && savedEventId !== null) {
        await createEvent.publishAsync(savedEventId)
        setIsPublished(true)
        setHasUnsavedChanges(false)
        setSubmitMessage('Evento publicado com sucesso. Agora está visível no catálogo público.')
        return
      }

      if (isEditing && editId !== null) {
        const updated = await eventService.updateDraft(
          editId, request, draft.tickets.map((ticket) => ticket.id ?? null),
          draft.coverFile, draft.promotionFile,
        )
        setDraft(draftFromApi(updated))
        setHasUnsavedChanges(false)
        setSubmitMessage('Alterações do rascunho salvas com sucesso.')
      } else {
        const created = await createEvent.mutateAsync({
          request,
          coverFile: draft.coverFile,
          promotionFile: draft.promotionFile,
        })
        setSavedEventId(created.evento.id)
        setHasUnsavedChanges(false)
        setIsPublished(false)
        setSubmitMessage('Rascunho do evento salvo com sucesso.')
      }
    } catch (reason) {
      setSubmitError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível salvar o evento. Tente novamente.',
      )
    } finally {
      submitLock.current = false
      setSavingDraft(false)
    }
  }

  return (
    <>
      <Header active="criar-evento" />
      <main className="criar-evento">
        <div className="criar-evento__container">
          <h1 className="criar-evento__title">{isEditing ? 'Editar rascunho' : title}</h1>
          <p className="criar-evento__subtitle">{isEditing ? 'Atualize seu evento e salve as alterações.' : subtitle}</p>
          {loadingDraft && <p role="status">Carregando dados do rascunho...</p>}
          {loadError && <p role="alert">{loadError}</p>}
          <EventStepper
            steps={steps}
            current={step}
            className="criar-evento__stepper"
          />

          {!loadingDraft && !loadError && <div className="criar-evento__content">
            <div hidden={step !== 0}>
              <EventStepInfo draft={draft} onChange={updateDraft} onNext={next} />
            </div>
            <div hidden={step !== 1}>
              <EventStepTickets
                tickets={draft.tickets}
                couponEnabled={draft.couponEnabled}
                couponDiscountPercent={draft.couponDiscountPercent}
                couponCode={draft.couponCode}
                couponError={couponError}
                onTicketChange={updateTicket}
                onTicketRemove={removeTicket}
                onTicketAdd={addTicket}
                onCouponChange={(updates) => {
                  setCouponError(null)
                  updateDraft(updates)
                }}
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
                isSubmitting={createEvent.isPending || savingDraft}
                submitError={submitError}
                submitMessage={submitMessage}
                savedEventId={savedEventId}
                isPublished={isPublished}
                isEditing={isEditing}
                hasUnsavedChanges={hasUnsavedChanges}
                publicationIssues={publicationIssues}
              />
            </div>
          </div>}
        </div>
      </main>
    </>
  )
}

export default CriarEvento
