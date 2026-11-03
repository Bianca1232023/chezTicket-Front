import Button from '../Button/Button'
import googleIcon from '../../assets/auth/google-icon.png'
import './GoogleButton.scss'

function GoogleButton() {
  return (
    <Button variant="outline" className="google-button">
      <img src={googleIcon} alt="" />
      <span>Continuar com Google</span>
    </Button>
  )
}

export default GoogleButton
