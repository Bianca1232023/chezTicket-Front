import { useState } from 'react'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import ProfileBanner from '../../components/ProfileBanner/ProfileBanner'
import TabBar, { type TabItem } from '../../components/TabBar/TabBar'
import ProfileEventCard from '../../components/ProfileEventCard/ProfileEventCard'
import DataTable, {
  type DataTableColumn,
} from '../../components/DataTable/DataTable'
import ButtonLink from '../../components/ButtonLink/ButtonLink'
import Icon from '../../components/Icon/Icon'
import { routeHref } from '../../hooks/useRoute'
import coverTop from '../../assets/perfil/cover-wide.png'
import coverBase from '../../assets/perfil/cover-bottom.png'
import coverCompact from '../../assets/perfil/cover-tile.png'
import hackathonImage from '../../assets/perfil/hackathon-desktop.png'
import hackathonCompactImage from '../../assets/perfil/hackathon-mobile.png'
import workshopImage from '../../assets/perfil/workshop-desktop.png'
import workshopCompactImage from '../../assets/perfil/workshop-mobile.png'
import '../../styles/pages/perfil.scss'

const tabs: TabItem[] = [
  { id: 'meus-ingressos', label: 'Meus ingressos' },
  { id: 'meus-eventos', label: 'Meus Eventos' },
  { id: 'notas-fiscais', label: 'Notas fiscais', href: routeHref('nota-fiscal') },
  { id: 'exemplo-1', label: 'Exemplo' },
  { id: 'exemplo-2', label: 'Exemplo' },
  { id: 'exemplo-3', label: 'Exemplo' },
  { id: 'exemplo-4', label: 'Exemplo' },
]

const purchaseColumns: DataTableColumn[] = [
  { key: 'event', header: 'Evento', width: '17.7%', align: 'left' },
  { key: 'date', header: 'Data', width: '20%' },
  { key: 'location', header: 'Local', width: '20.1%' },
  { key: 'tickets', header: 'Ingressos', width: '19.3%' },
  { key: 'total', header: 'Total', width: '22.9%', mobileEmphasis: true },
]

const purchaseRows = [
  {
    event: 'Show - Imagine Dragons',
    date: '25 de out',
    location: 'Parque Olimpico - Rj',
    tickets: '1',
    total: 'R$ 200,00',
  },
  {
    event: 'WorkShop de AI',
    date: '17 de Jan',
    location: 'Pier Mauá - Rj',
    tickets: '1',
    total: 'R$ 40,00',
  },
]

function Perfil() {
  const [activeTab, setActiveTab] = useState('meus-ingressos')

  return (
    <>
      <Header active={activeTab === 'meus-eventos' ? 'meus-eventos' : 'meus-ingressos'} />
      <main className="perfil">
        <div className="perfil__container">
          <ProfileBanner
            name="Bianca de Jesus Santana"
            location="Rio de Janeiro"
            actionLabel="Editar Perfil"
            topImage={coverTop}
            baseImage={coverBase}
            compactImage={coverCompact}
          />

          <TabBar
            label="Seções do perfil"
            tabs={tabs}
            activeId={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'meus-eventos' ? (
            <section className="perfil__section perfil__section--managed-events">
              <h2 className="perfil__section-title">Meus Eventos</h2>
              <div className="perfil__empty-events" role="status">
                <span className="perfil__empty-events-icon">
                  <Icon name="calendar" />
                </span>
                <h3>Nenhum evento criado</h3>
                <p>Seus eventos criados aparecerão aqui.</p>
                <ButtonLink href={routeHref('criar-evento')}>Criar evento</ButtonLink>
              </div>
            </section>
          ) : activeTab === 'meus-ingressos' ? (
            <>
              <section className="perfil__section">
                <h2 className="perfil__section-title">Próximos eventos</h2>
                <div className="perfil__events">
                  <ProfileEventCard
                    title="Hackathon de Inovação"
                    date="25 de out"
                    location="Parque Olimpico - Rj"
                    badge="1 ingresso"
                    image={hackathonImage}
                    compactImage={hackathonCompactImage}
                    href={routeHref('evento')}
                  />
                  <ProfileEventCard
                    title="Workshop de AI"
                    date="17 de jan"
                    location="Pier Mauá - Rj"
                    badge="1 ingresso"
                    image={workshopImage}
                    compactImage={workshopCompactImage}
                    href={routeHref('evento')}
                  />
                </div>
              </section>

              <section className="perfil__section perfil__section--history">
                <h2 className="perfil__section-title">Histórico de Compras</h2>
                <DataTable
                  caption="Histórico de compras"
                  columns={purchaseColumns}
                  rows={purchaseRows}
                />
              </section>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Perfil
