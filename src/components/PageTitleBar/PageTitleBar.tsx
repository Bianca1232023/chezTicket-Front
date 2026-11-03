import Icon from '../Icon/Icon'
import './PageTitleBar.scss'

type PageTitleBarProps = {
  title: string
  badge: string
}

function PageTitleBar({ title, badge }: PageTitleBarProps) {
  return (
    <div className="page-title-bar">
      <div className="page-title-bar__inner">
        <h1 className="page-title-bar__title">
          <svg
            className="page-title-bar__icon"
            viewBox="0 0 38 26"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M0 2a2 2 0 0 1 2-2h34a2 2 0 0 1 2 2v7.5a3.5 3.5 0 0 0 0 7V24a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-7.5a3.5 3.5 0 0 0 0-7z"
            />
            <path
              className="page-title-bar__star"
              d="m19 7.5 1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z"
            />
          </svg>
          {title}
        </h1>
        <p className="page-title-bar__badge">
          <Icon name="lock" className="page-title-bar__badge-icon" />
          {badge}
        </p>
      </div>
    </div>
  )
}

export default PageTitleBar
