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
    <div className="container" style={{ paddingTop: 40 }}>
      <h1 className="storeName" style={{ textAlign: "center" }}>{store.name}</h1>
      <p className="storeAbout" style={{ textAlign: "center", marginBottom: 20 }}>
        Painel de gestão da sua loja
      </p>

      <div style={{ background: "var(--surface)", border: "2px solid var(--primary)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: 14 }}>Link da sua loja</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px", wordBreak: "break-all" }}>
          {getStoreLink()}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copyLink} className="addToCartButton" style={{ flex: 1, margin: 0 }}>
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <button
            onClick={shareOnWhatsApp}
            style={{ flex: 1, background: "#25D366", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Partilhar
          </button>
        </div>
      </div>

      <a href={`/loja/${store.subdomain}`} target="_blank" rel="noreferrer" style={linkCardStyle}>
        <strong>Ver a minha loja online</strong>
      </a>

      <a href="/painel/produtos" style={linkCardStyle}>
        <strong>Produtos</strong>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
          {productCount} produto(s) cadastrado(s)
        </p>
      </a>

      <a href="/painel/cupons" style={linkCardStyle}>
        <strong>Cupões de desconto</strong>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
          Criar e gerir promoções
        </p>
      </a>

      <a href="/painel/loja" style={linkCardStyle}>
        <strong>Dados da loja</strong>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
          Logo, descrição, WhatsApp, redes sociais, entrega
        </p>
      </a>

      <button
        onClick={handleLogout}
        style={{ ...linkCardStyle, width: "100%", textAlign: "left", cursor: "pointer", marginTop: 20, color: "var(--text-muted)" }}
      >
        Sair da conta
      </button>
    </div>
  );
}

const linkCardStyle: React.CSSProperties = {
  display: "block",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  color: "var(--text)",
};
