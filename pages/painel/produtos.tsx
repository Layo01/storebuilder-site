import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  promo_price: number | null;
  stock_quantity: number | null;
  track_stock: boolean;
  is_available: boolean;
}

export default function Produtos() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [trackStock, setTrackStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/entrar");
      return;
    }
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (!store) {
      router.push("/criar-loja");
      return;
    }
    setStoreId(store.id);
    await fetchProducts(store.id);
    setLoading(false);
  }

  async function fetchProducts(sid: string) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", sid)
      .order("updated_at", { ascending: false });
    setProducts(data || []);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setPromoPrice("");
    setTrackStock(false);
    setStockQuantity("");
    setImageFile(null);
    setExistingImageUrl(null);
    setError("");
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setCategory(p.category || "");
    setPrice(String(p.price));
    setPromoPrice(p.promo_price ? String(p.promo_price) : "");
    setTrackStock(p.track_stock);
    setStockQuantity(p.stock_quantity != null ? String(p.stock_quantity) : "");
    setExistingImageUrl(p.images?.[0] || null);
    setImageFile(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !price.trim()) {
      setError("Preencha pelo menos o nome e o preço.");
      return;
    }
    if (!storeId) return;

    setSaving(true);

    let imageUrl = existingImageUrl;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${storeId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        setError("Erro ao enviar imagem: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const payload = {
      store_id: storeId,
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || "Geral",
      price: parseFloat(price),
      promo_price: promoPrice.trim() ? parseFloat(promoPrice) : null,
      track_stock: trackStock,
      stock_quantity: trackStock && stockQuantity.trim() ? parseInt(stockQuantity, 10) : null,
      images: imageUrl ? [imageUrl] : [],
      is_available: true,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);
      if (updateError) {
        setError("Erro ao atualizar: " + updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("products").insert(payload);
      if (insertError) {
        setError("Erro ao criar produto: " + insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    await fetchProducts(storeId);
  }

  async function toggleAvailability(p: Product) {
    await supabase.from("products").update({ is_available: !p.is_available }).eq("id", p.id);
    if (storeId) await fetchProducts(storeId);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Tem a certeza que quer apagar este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    if (storeId) await fetchProducts(storeId);
  }

  if (loading) return <div className="emptyState">A carregar...</div>;

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <a href="/painel" style={{ color: "var(--text-muted)", fontSize: 13 }}>← Voltar ao painel</a>
      <h1 className="storeName" style={{ marginTop: 10 }}>Produtos</h1>

      {!showForm && (
        <button
          className="addToCartButton"
          style={{ marginBottom: 20 }}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Adicionar produto
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, background: "var(--surface)", padding: 16, borderRadius: 12 }}>
          <input placeholder="Nome do produto" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
          <input placeholder="Categoria (ex: Sapatos)" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
          <input placeholder="Preço (MT)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
          <input placeholder="Preço promocional (opcional)" type="number" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} style={inputStyle} />

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} />
            Controlar stock deste produto
          </label>

          {trackStock && (
            <input placeholder="Quantidade em stock" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} style={inputStyle} />
          )}

          <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Foto do produto</label>
          {existingImageUrl && !imageFile && (
            <img src={existingImageUrl} style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover" }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

          {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="addToCartButton" disabled={saving} style={{ flex: 1 }}>
              {saving ? "A guardar..." : editingId ? "Guardar alterações" : "Criar produto"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              style={{ ...inputStyle, background: "transparent", cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {products.length === 0 && !showForm && (
        <div className="emptyState">Ainda não tem produtos. Adicione o primeiro!</div>
      )}

      {products.map((p) => (
        <div key={p.id} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <img
            src={p.images?.[0] || "https://placehold.co/100x100/1A1A1A/E11D2A?text=Foto"}
            style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, margin: 0 }}>{p.name}</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0" }}>{p.price.toFixed(2)} MT</p>
            {p.track_stock && (
              <p style={{ fontSize: 12, color: (p.stock_quantity || 0) <= 3 ? "var(--primary)" : "var(--text-muted)", margin: 0 }}>
                Stock: {p.stock_quantity ?? 0}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={() => startEdit(p)} style={smallBtnStyle}>Editar</button>
              <button onClick={() => toggleAvailability(p)} style={smallBtnStyle}>
                {p.is_available ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => deleteProduct(p.id)} style={{ ...smallBtnStyle, color: "var(--primary)" }}>Apagar</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "inherit",
};

const smallBtnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text)",
  cursor: "pointer",
};
