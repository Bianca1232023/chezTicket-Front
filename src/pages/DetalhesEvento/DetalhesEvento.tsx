import { useState } from 'react'
import Header from '../../components/Header/Header'
import HeroBanner from '../../components/HeroBanner/HeroBanner'
import InfoCard from '../../components/InfoCard/InfoCard'
import SectionCard from '../../components/SectionCard/SectionCard'
import DateSelector, { type DateOption } from '../../components/DateSelector/DateSelector'
import DetailList from '../../components/DetailList/DetailList'
import LinkButton from '../../components/LinkButton/LinkButton'
import { routeHref } from '../../hooks/useRoute'
import heroImage from '../../assets/detalhes-evento/hero-palco.png'
import '../../styles/pages/detalhes-evento.scss'

const dates: (DateOption & { label: string })[] = [
  { id: '14', weekday: 'Qui', day: '14', label: 'Quinta, 14 de Nov' },
  { id: '15', weekday: 'Sex', day: '15', label: 'Sábado, 15 de Nov' },
  { id: '16', weekday: 'Sáb', day: '16', label: 'Sábado, 16 de Nov' },
  { id: '17', weekday: 'Dom', day: '17', label: 'Domingo, 17 de Nov' },
]

const highlights = [
  { title: 'Inteligência Artificial', description: 'Palestra e experiência com IA' },
  { title: 'Worksop e Tecnologia', description: 'Experiências práticas e hands-on' },
  { title: 'Instalações de Neon', description: 'Arte imersiva digital' },
  { title: 'Game Jam', description: 'Desafio de criação de jogos em equipe' },
]

function DetalhesEvento() {
  const [selectedDate, setSelectedDate] = useState('15')
  const current = dates.find((date) => date.id === selectedDate) ?? dates[1]

  return (
    <>
      <Header />
      <main className="detalhes-evento">
        <HeroBanner
          image={heroImage}
          overline="FESTIVAL MULTIDISCIPLINAR"
          title="NOVA: Festival de Tecnologia e inovação"
        />
        <div className="detalhes-evento__container">
          <div className="detalhes-evento__content">
            <section className="detalhes-evento__section">
              <h2 className="detalhes-evento__heading">Sobre o Evento</h2>
              <p className="detalhes-evento__text">
                O NOVA é um festival dedicado à tecnologia, inovação e criatividade digital.
                Reunimos profissionais, estudantes, empresas e entusiastas para explorar as
                principais tendências que estão transformando o futuro, com palestras,
                workshops, experiências interativas e demonstrações de novas tecnologias.
              </p>
            </section>

            <section className="detalhes-evento__section">
              <h2 className="detalhes-evento__heading">Destaques do Line-up</h2>
              <div className="detalhes-evento__highlights">
                {highlights.map((item) => (
                  <InfoCard key={item.title} title={item.title} description={item.description} />
                ))}
              </div>
            </section>

            <section className="detalhes-evento__section">
              <h2 className="detalhes-evento__heading">Localização e Acesso</h2>
              <InfoCard
                icon="pin"
                title="Centro de Inovação Tecnológica"
                description="Av. das Américas, 5000 — Rio de Janeiro, RJ"
              />
            </section>
          </div>

          <aside className="detalhes-evento__aside">
            <SectionCard elevated title="Escolha uma data" className="detalhes-evento__purchase">
              <DateSelector options={dates} value={selectedDate} onChange={setSelectedDate} />
              <DetailList
                items={[
                  { label: 'Data selecionada:', value: current.label },
                  { label: 'Horário:', value: '14h às 22h' },
                  { label: 'Classificação:', value: '16+ anos' },
                ]}
              />
              <div className="detalhes-evento__price">
                <span className="detalhes-evento__price-label">Valor do ingresso:</span>
                <strong className="detalhes-evento__price-value">R$ R$ 180,00</strong>
              </div>
              <LinkButton href={routeHref('compra')}>Garantir Ingresso</LinkButton>
              <p className="detalhes-evento__note">
                Cancelamento gratuito até 7 dias antes do evento.
              </p>
            </SectionCard>
          </aside>
        </div>
      </main>
    </>
  )
}

export default DetalhesEvento
