import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

interface Store {
  id: string;
  name: string;
  subdomain: string;
  whatsapp_number: string | null;
}

interface TopProduct {
  name: string;
  likes: number;
}

export default function Painel() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [visitCount, setVisitCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [topProduct, setTopProduct] = useState<TopProduct | null>(null);
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

    const { count: pCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeData.id);
    setProductCount(pCount || 0);

    const { count: vCount } = await supabase
      .from("store_visits")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeData.id);
    setVisitCount(vCount || 0);

    const { data: products } = await supabase
      .from("products")
      .select("id, name")
      .eq("store_id", storeData.id);

    if (products && products.length > 0) {
      const productIds = products.map((p) => p.id);
      const { data: likes } = await supabase
        .from("product_likes")
        .select("product_id")
        .in("product_id", productIds);

      setLikeCount(likes?.length || 0);

      if (likes && likes.length > 0) {
        const counts: Record<string, number> = {};
        likes.forEach((l) => {
          counts[l.product_id] = (counts[l.product_id] || 0) + 1;
        });
        const topId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        const topProductData = products.find((p) => p.id === topId);
        if (topProductData) {
          setTopProduct({ name: topProductData.name, likes: counts[topId] });
        }
      }
    }

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
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{visitCount}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Visitas</p>
          </div>
          <div style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{likeCount}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Curtidas</p>
          </div>
          <div style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: 14, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{productCount}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Produtos</p>
          </div>
        </div>

        {topProduct && (
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 14, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px" }}>Produto mais curtido</p>
            <p style={{ fontWeight: 700, margin: 0 }}>❤️ {topProduct.name} — {topProduct.likes} curtida(s)</p>
          </div>
        )}

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
