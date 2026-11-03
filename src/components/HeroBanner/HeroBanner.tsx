import './HeroBanner.scss'

type HeroBannerProps = {
  image?: string
  overline: string
  title: string
}

function HeroBanner({ image, overline, title }: HeroBannerProps) {
  return (
    <section className="hero-banner">
      {image && <img className="hero-banner__image" src={image} alt="" />}
      <div className="hero-banner__content">
        <p className="hero-banner__overline">{overline}</p>
        <h1 className="hero-banner__title">{title}</h1>
      </div>
    </section>
  )
}

export default HeroBanner
