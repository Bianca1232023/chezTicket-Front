import { useState } from 'react'
import Header from '../../components/Header/Header'
import EventStepper from '../../components/EventStepper/EventStepper'
import EventStepInfo from '../../components/EventStepInfo/EventStepInfo'
import EventStepTickets from '../../components/EventStepTickets/EventStepTickets'
import EventStepPromotion from '../../components/EventStepPromotion/EventStepPromotion'
import EventStepReview from '../../components/EventStepReview/EventStepReview'
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

function CriarEvento() {
  const [step, setStep] = useState(() => Number(new URLSearchParams(location.search).get('step') ?? 0)) // TEMP
  const { title, subtitle } = headings[step]

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
            {step === 0 && <EventStepInfo onNext={next} />}
            {step === 1 && <EventStepTickets onBack={back} onNext={next} />}
            {step === 2 && <EventStepPromotion onBack={back} onNext={next} />}
            {step === 3 && <EventStepReview onBack={back} />}
          </div>
        </div>
      </main>
    </>
  )
}

export default CriarEvento
