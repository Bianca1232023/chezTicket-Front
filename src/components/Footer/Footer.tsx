import Icon from '../Icon/Icon'
import './Footer.scss'

function BrazilFlag() {
  return (
    <svg viewBox="0 0 24 17" aria-hidden="true" focusable="false">
      <rect width="24" height="17" rx="2" fill="#009C3B" />
      <path d="M12 2.500 21.500 8.500 12 14.500 2.500 8.500z" fill="#FFDF00" />
      <circle cx="12" cy="8.500" r="3.600" fill="#002776" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p className="footer__text">
        Conectando pessoas aos melhores eventos e experiências.
      </p>
      <ul className="footer__social" aria-label="Redes sociais">
        <li>
          <a href="#/home" aria-label="Instagram">
            <Icon name="instagram" />
          </a>
        </li>
        <li>
          <a href="#/home" aria-label="Facebook">
            <Icon name="facebook" />
          </a>
        </li>
        <li>
          <a href="#/home" aria-label="X">
            <Icon name="x" />
          </a>
        </li>
      </ul>
      <button className="footer__region" type="button" aria-label="Região: Brasil">
        <BrazilFlag />
        <span>Brasil</span>
        <Icon name="chevron-down" />
      </button>
    </footer>
  )
}

export default Footer
