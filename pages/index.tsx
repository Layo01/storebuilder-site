export default function Home() {
  return (
    <div className="heroSection">
      <p className="heroLogo">StoreBuilder</p>
      <h1 className="heroTitle">A sua loja online<br />pronta em minutos</h1>
      <p className="heroSubtitle">
        Crie a sua loja, adicione produtos e comece a vender pelo WhatsApp — sem complicações, sem custos.
      </p>
      <div className="heroButtons">
        <a href="/criar-loja" className="heroButtonPrimary" style={{ textAlign: "center", display: "block" }}>
          Criar a minha loja
        </a>
        <a href="/entrar" className="heroButtonSecondary" style={{ textAlign: "center", display: "block" }}>
          Já tenho loja — Entrar
        </a>
      </div>

      <div className="featureRow">
        <div className="featureItem">
          <div className="featureIcon">📦</div>
          <p className="featureLabel">Produtos ilimitados</p>
        </div>
        <div className="featureItem">
          <div className="featureIcon">💬</div>
          <p className="featureLabel">Vendas via WhatsApp</p>
        </div>
        <div className="featureItem">
          <div className="featureIcon">🎟️</div>
          <p className="featureLabel">Cupões e promoções</p>
        </div>
      </div>
    </div>
  );
      }
