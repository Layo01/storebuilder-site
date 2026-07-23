export default function Home() {
  return (
    <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
      <h1 className="storeName">StoreBuilder</h1>
      <p className="storeAbout">
        Cada loja fica disponível em <code>/loja/&lt;subdomínio-da-loja&gt;</code>.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 30, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
        <a href="/criar-loja" className="addToCartButton" style={{ display: "block" }}>
          Criar a minha loja
        </a>
        <a href="/entrar" style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Já tenho loja — Entrar
        </a>
      </div>
    </div>
  );
    }
