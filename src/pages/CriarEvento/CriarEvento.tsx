import { useEffect, useState } from 'react'
import Header from '../../components/Header/Header'
import EventStepper from '../../components/EventStepper/EventStepper'
import EventStepInfo from '../../components/EventStepInfo/EventStepInfo'
import EventStepTickets from '../../components/EventStepTickets/EventStepTickets'
import EventStepPromotion from '../../components/EventStepPromotion/EventStepPromotion'
import EventStepReview from '../../components/EventStepReview/EventStepReview'
import type { EventDraft } from '../../types/event-draft'
import coverImage from '../../assets/criar-evento/capa-evento-formulario.png'
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
  duration: '',
  address: '',
  coverFile: null,
  coverPreviewUrl: coverImage,
  tags: ['Evento', 'ao vivo', 'Tecnologia'],
  tickets: [
    {
      name: 'Ingresso Padrão',
      price: 'R$ 50,00',
      quantity: '500',
      salesStart: '',
      salesEnd: '',
    },
    {
      name: 'Meia-entrada',
      price: 'R$ 25,00',
      quantity: '100',
      salesStart: '',
      salesEnd: '',
    },
    {
      name: 'Gratuito',
      price: 'Gratuito',
      quantity: '20',
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

function CriarEvento() {
  const [step, setStep] = useState(() => Number(new URLSearchParams(location.search).get('step') ?? 0)) // TEMP
  const [draft, setDraft] = useState(createInitialDraft)
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

  const goTo = (target: number) => {
    setStep(Math.min(Math.max(target, 0), steps.length - 1))
    window.scrollTo({ top: 0 })
  }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

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
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default CriarEvento
