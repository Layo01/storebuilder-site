import { GetServerSideProps } from "next";
import { useState } from "react";
import { supabase } from "../../../../lib/supabase";

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
}

interface Store {
  id: string;
  name: string;
  subdomain: string;
  whatsapp_number: string | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
}

export default function ProductPage({
  store,
  product,
  related,
  likeCount,
}: {
  store: Store | null;
  product: Product | null;
  related: RelatedProduct[];
  likeCount: number;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(likeCount);

  if (!store || !product) {
    return <div className="emptyState">Produto não encontrado.</div>;
  }

  function isOnPromo() {
    if (!product!.promo_price) return false;
    const now = Date.now();
    const start = product!.promo_starts_at ? new Date(product!.promo_starts_at).getTime() : 0;
    const end = product!.promo_ends_at ? new Date(product!.promo_ends_at).getTime() : Infinity;
    return now >= start && now <= end;
  }

  const onPromo = isOnPromo();
  const images = product.images?.length ? product.images : ["https://placehold.co/500x500/f0f0f2/999?text=Sem+foto"];

  async function handleLike() {
    if (liked) return;
    setLiked(true);
    setLikes((prev) => prev + 1);
    await supabase.from("product_likes").insert({ product_id: product!.id });
  }

  function buyOnWhatsApp() {
    if (!store!.whatsapp_number) {
      alert("Esta loja ainda não configurou um número de WhatsApp.");
      return;
    }
    const price = onPromo ? product!.promo_price! : product!.price;
    const message = encodeURIComponent(
      `Olá! Tenho interesse neste produto da loja *${store!.name}*:\n\n${product!.name} — ${price.toFixed(2)} MT`
    );
    window.open(`https://wa.me/${store!.whatsapp_number}?text=${message}`, "_blank");
  }

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 40 }}>
      <a href={`/loja/${store.subdomain}`} style={{ color: "var(--text-muted)", fontSize: 13 }}>← Voltar à loja</a>

      <div style={{ marginTop: 12, borderRadius: 14, overflow: "hidden", background: "var(--surface)", position: "relative" }}>
        <img
          src={images[activeImage]}
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
        />
        <button
          onClick={handleLike}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: "50%",
            width: 42,
            height: 42,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {liked ? "❤️" : "🤍"}
        </button>
      </div>

      {likes > 0 && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {likes} pessoa(s) gostaram deste produto
        </p>
      )}

      {images.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              onClick={() => setActiveImage(idx)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                objectFit: "cover",
                cursor: "pointer",
                border: idx === activeImage ? "2px solid var(--primary)" : "2px solid transparent",
              }}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{product.name}</p>
        <div className="priceRow" style={{ marginTop: 6 }}>
          {onPromo ? (
            <>
              <span className="priceOld" style={{ fontSize: 14 }}>{product.price.toFixed(2)} MT</span>
              <span className="pricePromo" style={{ fontSize: 22 }}>{product.promo_price!.toFixed(2)} MT</span>
            </>
          ) : (
            <span className="price" style={{ fontSize: 22 }}>{product.price.toFixed(2)} MT</span>
          )}
        </div>
        {onPromo && <span className="badge">PROMOÇÃO</span>}

        {product.description && (
          <p style={{ marginTop: 14, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {product.description}
          </p>
        )}

        <button className="addToCartButton" style={{ marginTop: 16 }} onClick={buyOnWhatsApp}>
          Comprar no WhatsApp
        </button>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Outras opções</p>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {related.map((r) => (
              <a
                key={r.id}
                href={`/loja/${store.subdomain}/produto/${r.id}`}
                style={{ minWidth: 110, background: "var(--surface)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <img src={r.images?.[0] || "https://placehold.co/110x110/f0f0f2/999?text=Foto"} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                <div style={{ padding: 8 }}>
                  <p style={{ fontSize: 12, margin: 0, fontWeight: 600 }}>{r.name}</p>
                  <p style={{ fontSize: 12, margin: "2px 0 0", color: "var(--primary)", fontWeight: 700 }}>{r.price.toFixed(2)} MT</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;
  const id = context.params?.id as string;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, subdomain, whatsapp_number")
    .eq("subdomain", slug)
    .maybeSingle();

  if (!store) {
    return { props: { store: null, product: null, related: [], likeCount: 0 } };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, category, images, price, promo_price, promo_starts_at, promo_ends_at")
    .eq("id", id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (!product) {
    return { props: { store, product: null, related: [], likeCount: 0 } };
  }

  const { count: likeCount } = await supabase
    .from("product_likes")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id);

  const { data: related } = await supabase
    .from("products")
    .select("id, name, images, price")
    .eq("store_id", store.id)
    .eq("category", product.category)
    .eq("is_available", true)
    .neq("id", product.id)
    .limit(8);

  return { props: { store, product, related: related || [], likeCount: likeCount || 0 } };
};
