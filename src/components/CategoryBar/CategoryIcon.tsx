import peopleIcon from '../../assets/akar-icons_people-group.svg'
import graduationIcon from '../../assets/fluent_hat-graduation-12-regular.svg'
import hackerIcon from '../../assets/griddy-icons_hacker-filled.svg'
import ideaIcon from '../../assets/hugeicons_idea.svg'
import robotIcon from '../../assets/gravity-ui_face-robot-smile.svg'
import databaseIcon from '../../assets/bx_data.svg'
import gameIcon from '../../assets/boxicons_ticket-star-filled.svg'
import cloudIcon from '../../assets/carbon_cloud-data-ops.svg'
import allCategoriesIcon from '../../assets/carbon_show-data-cards.svg'

export type CategoryIconName = 'layers' | 'people' | 'bulb' | 'robot' | 'hacker' | 'book' | 'database' | 'gamepad' | 'building' | 'cloud'

const categoryIcons: Record<CategoryIconName, string> = {
  layers: allCategoriesIcon,
  people: peopleIcon,
  bulb: ideaIcon,
  robot: robotIcon,
  hacker: hackerIcon,
  book: graduationIcon,
  database: databaseIcon,
  gamepad: gameIcon,
  building: peopleIcon,
  cloud: cloudIcon,
}

export function categoryIconForSlug(slug: string): CategoryIconName {
  switch (slug) {
    case 'congressos-e-palestras':
      return 'people'
    case 'cursos-e-workshops':
      return 'book'
    case 'dados':
      return 'database'
    case 'games':
      return 'gamepad'
    case 'hackaton':
      return 'hacker'
    case 'ia':
      return 'bulb'
    case 'institucional-cefet-rj':
      return 'building'
    case 'nuvem':
      return 'cloud'
    case 'robotica':
      return 'robot'
    default:
      return 'layers'
  }
}

type CategoryIconProps = {
  name: CategoryIconName
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  return (
    <img src={categoryIcons[name]} alt="" aria-hidden="true" {...props} />
  )
}
