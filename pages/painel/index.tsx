import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

interface Store {
  id: string;
  name: string;
  subdomain: string;
  whatsapp_number: string | null;
}

export default function Painel() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState("");

  useEffect(() => {
    setSiteOrigin(window.location.origin);
    loadData();
  }, []);

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/entrar");
      return;
    }

    const { data: storeData } = await supabase
      .from("stores")
      .select("id, name, subdomain, whatsapp_number")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (!storeData) {
      router.push("/criar-loja");
      return;
    }

    setStore(storeData);

    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeData.id);

    setProductCount(count || 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/entrar");
  }

  function getStoreLink() {
    return `${siteOrigin}/loja/${store?.subdomain}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getStoreLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Não foi possível copiar. Copie manualmente: " + getStoreLink());
    }
  }

  function shareOnWhatsApp() {
    const message = encodeURIComponent(
      `Confira a minha loja online: ${store?.name}\n${getStoreLink()}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  if (loading) {
    return <div className="emptyState">A carregar...</div>;
  }

  if (!store) return null;

  return (
    <div style={{ paddingBottom: 30 }}>
      <div className="dashboardHeader">
        <p className="dashboardGreeting">Painel de gestão</p>
        <h1 className="dashboardStoreName">{store.name}</h1>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        <div style={{ background: "var(--surface)", border: "2px solid var(--primary)", borderRadius: 16, padding: 18, marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--primary)" }}>
            Link da sua loja
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px", wordBreak: "break-all" }}>
            {getStoreLink()}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyLink} className="primaryButton" style={{ flex: 1 }}>
              {copied ? "Copiado!" : "Copiar link"}
            </button>
            <button
              onClick={shareOnWhatsApp}
              style={{ flex: 1, background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Partilhar
            </button>
          </div>
        </div>

        <a href={`/loja/${store.subdomain}`} target="_blank" rel="noreferrer" className="linkCard">
          <div className="linkCardIcon">👀</div>
          <div>
            <p className="linkCardTitle">Ver a minha loja online</p>
          </div>
        </a>

        <a href="/painel/produtos" className="linkCard">
          <div className="linkCardIcon">📦</div>
          <div>
            <p className="linkCardTitle">Produtos</p>
            <p className="linkCardSubtitle">{productCount} produto(s) cadastrado(s)</p>
          </div>
        </a>

        <a href="/painel/cupons" className="linkCard">
          <div className="linkCardIcon">🎟️</div>
          <div>
            <p className="linkCardTitle">Cupões de desconto</p>
            <p className="linkCardSubtitle">Criar e gerir promoções</p>
          </div>
        </a>

        <a href="/painel/loja" className="linkCard">
          <div className="linkCardIcon">🏪</div>
          <div>
            <p className="linkCardTitle">Dados da loja</p>
            <p className="linkCardSubtitle">Logo, descrição, WhatsApp, redes sociais</p>
          </div>
        </a>

        <button
          onClick={handleLogout}
          className="linkCard"
          style={{ width: "100%", textAlign: "left", cursor: "pointer", marginTop: 16, border: "none" }}
        >
          <div className="linkCardIcon">🚪</div>
          <p className="linkCardTitle" style={{ color: "var(--text-muted)" }}>Sair da conta</p>
        </button>
      </div>
    </div>
  );
}
