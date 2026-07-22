export default function Home() {
  return (
    <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
      <h1 className="storeName">StoreBuilder</h1>
      <p className="storeAbout">
        Cada loja fica disponível em <code>/loja/&lt;subdomínio-da-loja&gt;</code>.
      </p>
    </div>
  );
}
