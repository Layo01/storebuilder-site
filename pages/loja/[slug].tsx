import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  promo_price: number | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  is_available: boolean;
}

interface Store {
  id: string;
  name: string;
  business_description: string;
  subdomain: string;
  whatsapp_number: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  telegram: string | null;
  business_hours: string | null;
  delivery_info: string | null;
  payment_methods: string | null;
}

interface CartItem {
  product: Product;
  qty: number;
}

function socialLink(value: string, kind: "instagram" | "facebook" | "tiktok" | "youtube" | "telegram") {
  if (value.startsWith("http")) return value;
  const handle = value.replace("@", "");
  if (kind === "instagram") return `https://instagram.com/${handle}`;
  if (kind === "tiktok") return `https://tiktok.com/@${handle}`;
  if (kind === "telegram") return `https://t.me/${handle}`;
  return value;
}

export default function StorePage({ store, products }: { store: Store | null; products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedDiscountPct, setAppliedDiscountPct] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (store) {
      supabase.from("store_visits").insert({ store_id: store.id }).then(() => {});
    }
  }, [store]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Geral"));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== "Todos") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    return list;
  }, [products, activeCategory, searchTerm]);

  function isOnPromo(p: Product) {
    if (!p.promo_price) return false;
    const now = Date.now();
    const start = p.promo_starts_at ? new Date(p.promo_starts_at).getTime() : 0;
    const end = p.promo_ends_at ? new Date(p.promo_ends_at).getTime() : Infinity;
    return now >= start && now <= end;
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  const subtotal = cart.reduce((sum, i) => {
    const price = isOnPromo(i.product) ? i.product.promo_price! : i.product.price;
    return sum + price * i.qty;
  }, 0);

  const total = subtotal - (subtotal * appliedDiscountPct) / 100;

  async function applyCoupon() {
    if (!couponCode.trim() || !store) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", store.id)
      .eq("code", couponCode.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      setCouponMessage("Cupão inválido ou expirado.");
      setAppliedDiscountPct(0);
      return;
    }
    if (data.discount_type === "percent") {
      setAppliedDiscountPct(data.discount_value);
      setCouponMessage(`Cupão aplicado: ${data.discount_value}% de desconto`);
    } else if (data.discount_type === "fixed") {
      setAppliedDiscountPct(0);
      setCouponMessage(`Cupão de ${data.discount_value} MT será aplicado na confirmação`);
    } else {
      setCouponMessage("Cupão de frete grátis aplicado — confirme no WhatsApp");
    }
  }

  function checkoutOnWhatsApp() {
    if (!store) return;
    if (!store.whatsapp_number) {
      alert("Esta loja ainda não configurou um número de WhatsApp para receber pedidos.");
      return;
    }
    const lines = cart.map((i) => {
      const price = isOnPromo(i.product) ? i.product.promo_price! : i.product.price;
      return `${i.qty}x ${i.product.name} — ${(price * i.qty).toFixed(2)} MT`;
    });
    const message =
      `Olá! Quero encomendar na loja *${store.name}*:%0A%0A` +
      encodeURIComponent(lines.join("\n")) +
      `%0A%0ATotal: ${total.toFixed(2)} MT` +
      (couponCode ? `%0ACupão: ${couponCode.toUpperCase()}` : "");
    window.open(`https://wa.me/${store.whatsapp_number}?text=${message}`, "_blank");
  }

  function buyNowOnWhatsApp(product: Product) {
    if (!store) return;
    if (!store.whatsapp_number) {
      alert("Esta loja ainda não configurou um número de WhatsApp para receber pedidos.");
      return;
    }
    const price = isOnPromo(product) ? product.promo_price! : product.price;
    const message = encodeURIComponent(
      `Olá! Tenho interesse neste produto da loja *${store.name}*:\n\n${product.name} — ${price.toFixed(2)} MT`
    );
    window.open(`https://wa.me/${store.whatsapp_number}?text=${message}`, "_blank");
  }

  if (!store) {
    return <div className="emptyState">Loja não encontrada.</div>;
  }

  const socials = [
    store.instagram && { label: "Instagram", url: socialLink(store.instagram, "instagram") },
    store.facebook && { label: "Facebook", url: socialLink(store.facebook, "facebook") },
    store.tiktok && { label: "TikTok", url: socialLink(store.tiktok, "tiktok") },
    store.youtube && { label: "YouTube", url: socialLink(store.youtube, "youtube") },
    store.telegram && { label: "Telegram", url: socialLink(store.telegram, "telegram") },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div>
      <div className="header">
        {store.logo_url && (
          <img
            src={store.logo_url}
            style={{ width: 68, height: 68, borderRadius: 18, objectFit: "cover", margin: "0 auto 10px" }}
          />
        )}
        <h1 className="storeName">{store.name}</h1>
        {store.business_description && <p className="storeAbout">{store.business_description}</p>}

        {socials.length > 0 && (
          <div className="storeSocialRow">
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="storeSocialPill">
                {s.label}
              </a>
            ))}
          </div>
        )}

        {(store.business_hours || store.delivery_info || store.payment_methods) && (
          <div className="storeInfoBox">
            {store.business_hours && <p style={{ margin: "2px 0" }}><strong>Horário:</strong> {store.business_hours}</p>}
            {store.delivery_info && <p style={{ margin: "2px 0" }}><strong>Entrega:</strong> {store.delivery_info}</p>}
            {store.payment_methods && <p style={{ margin: "2px 0" }}><strong>Pagamento:</strong> {store.payment_methods}</p>}
          </div>
        )}
      </div>

      <div className="searchBar">
        <input
          className="searchInput"
          placeholder="Pesquisar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="categoryRow">
        {categories.map((c) => (
          <div
            key={c}
            className={`categoryChip ${activeCategory === c ? "active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </div>
        ))}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="emptyState">Nenhum produto encontrado.</div>
      ) : (
        <div className="grid">
          {visibleProducts.map((p) => {
            const onPromo = isOnPromo(p);
            return (
              <div className="card" key={p.id}>
                <a href={`/loja/${store.subdomain}/produto/${p.id}`}>
                  <img
                    className="cardImage"
                    src={p.images?.[0] || "https://placehold.co/300x300/f0f0f2/999?text=Foto"}
                    alt={p.name}
                  />
                </a>
                <div className="cardBody">
                  <a href={`/loja/${store.subdomain}/produto/${p.id}`}>
                    <p className="cardName">{p.name}</p>
                  </a>
                  <div className="priceRow">
                    {onPromo ? (
                      <>
                        <span className="priceOld">{p.price.toFixed(2)} MT</span>
                        <span className="pricePromo">{p.promo_price!.toFixed(2)} MT</span>
                      </>
                    ) : (
                      <span className="price">{p.price.toFixed(2)} MT</span>
                    )}
                  </div>
                  {onPromo && <span className="badge">PROMOÇÃO</span>}
                  <button className="addToCartButton" onClick={() => addToCart(p)}>
                    Adicionar
                  </button>
                  <button
                    className="addToCartButton"
                    style={{ background: "transparent", border: "1px solid var(--primary)", color: "var(--primary)", marginTop: 6 }}
                    onClick={() => buyNowOnWhatsApp(p)}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="footer">SUBSCREVE PARA MAIS CONTEÚDOS · {store.name}</div>

      {cart.length > 0 && !showCart && (
        <div className="cartBar" onClick={() => setShowCart(true)}>
          <span>{cart.reduce((n, i) => n + i.qty, 0)} item(ns)</span>
          <span>{total.toFixed(2)} MT · Ver carrinho</span>
        </div>
      )}

      {showCart && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 10 }}>
          <div style={{ background: "var(--surface)", width: "100%", maxHeight: "80vh", overflowY: "auto", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <h2 style={{ margin: 0 }}>O seu carrinho</h2>
            {cart.map((i) => (
              <div key={i.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontSize: 14 }}>{i.product.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => changeQty(i.product.id, -1)} style={qtyBtnStyle}>-</button>
                  <span>{i.qty}</span>
                  <button onClick={() => changeQty(i.product.id, 1)} style={qtyBtnStyle}>+</button>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <input
                placeholder="Código de cupão"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)" }}
              />
              <button onClick={applyCoupon} style={{ ...qtyBtnStyle, width: "auto", padding: "0 14px" }}>Aplicar</button>
            </div>
            {couponMessage && <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>{couponMessage}</p>}

            <p style={{ fontWeight: 800, fontSize: 18, marginTop: 20 }}>Total: {total.toFixed(2)} MT</p>

            <button className="addToCartButton" style={{ marginTop: 8 }} onClick={checkoutOnWhatsApp}>
              Finalizar pedido no WhatsApp
            </button>
            <button
              onClick={() => setShowCart(false)}
              style={{ width: "100%", background: "transparent", color: "var(--text-muted)", border: "none", marginTop: 10, padding: 8 }}
            >
              Continuar a comprar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
  background: "var(--surface-alt)", color: "var(--text)", cursor: "pointer",
};

export const getServerSideProps: GetServerSideProps<{ store: Store | null; products: Product[] }> = async (context) => {
  const slug = context.params?.slug as string;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, business_description, subdomain, whatsapp_number, logo_url, instagram, facebook, tiktok, youtube, telegram, business_hours, delivery_info, payment_methods")
    .eq("subdomain", slug)
    .maybeSingle();

  if (!store) {
    return { props: { store: null, products: [] } };
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, category, images, price, promo_price, promo_starts_at, promo_ends_at, is_available")
    .eq("store_id", store.id)
    .eq("is_available", true)
    .order("updated_at", { ascending: false });

  return { props: { store, products: products || [] } };
};
