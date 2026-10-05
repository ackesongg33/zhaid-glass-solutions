import { useEffect, useState } from 'react';

export default function WelcomeIntro() {
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem('zhaid-welcome-seen');

    if (!alreadySeen) {
      setVisible(true);
    }
  }, []);

  const skipIntro = () => {
    if (opening) return;

    setOpening(true);

    window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('zhaid-welcome-seen', 'true');
    }, 900);
  };

  if (!visible) return null;

  return (
    <div
      className={`zhaid-welcome ${opening ? 'zhaid-welcome--opening' : ''}`}
      onClick={skipIntro}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          skipIntro();
        }
      }}
      aria-label="Entrar a Zhaid Glass Solutions"
    >
      <img
        src="/images/foto-bienvenida.png"
        alt=""
        className="zhaid-welcome__image"
      />

      <div className="zhaid-welcome__shade" />

      <div className="zhaid-welcome__curtain zhaid-welcome__curtain--left" />
      <div className="zhaid-welcome__curtain zhaid-welcome__curtain--right" />

      <span className="zhaid-welcome__skip">
        Toca para continuar
      </span>
    </div>
  );
}