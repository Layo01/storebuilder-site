import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed" | "free_shipping";
  discount_value: number;
  active: boolean;
}

export default function Cupons() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed" | "free_shipping">("percent");
  const [discountValue, setDiscountValue] = useState("");
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
    await fetchCoupons(store.id);
    setLoading(false);
  }

  async function fetchCoupons(sid: string) {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", sid)
      .order("created_at", { ascending: false });
    setCoupons(data || []);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Digite um código para o cupão.");
      return;
    }
    if (discountType !== "free_shipping" && !discountValue.trim()) {
      setError("Digite o valor do desconto.");
      return;
    }
    if (!storeId) return;

    setSaving(true);

    const { error: insertError } = await supabase.from("coupons").insert({
      store_id: storeId,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountType === "free_shipping" ? 0 : parseFloat(discountValue),
      active: true,
    });

    setSaving(false);

    if (insertError) {
      setError("Erro ao criar cupão: " + insertError.message);
      return;
    }

    setCode("");
    setDiscountValue("");
    setShowForm(false);
    await fetchCoupons(storeId);
  }

  async function toggleActive(c: Coupon) {
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (storeId) await fetchCoupons(storeId);
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Apagar este cupão?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    if (storeId) await fetchCoupons(storeId);
  }

  if (loading) return <div className="emptyState">A carregar...</div>;

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <a href="/painel" style={{ color: "var(--text-muted)", fontSize: 13 }}>← Voltar ao painel</a>
      <h1 className="storeName" style={{ marginTop: 10 }}>Cupões de desconto</h1>

      {!showForm && (
        <button className="addToCartButton" style={{ marginBottom: 20 }} onClick={() => setShowForm(true)}>
          + Criar cupão
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, background: "var(--surface)", padding: 16, borderRadius: 12 }}>
          <input placeholder="Código (ex: PROMO10)" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />

          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} style={inputStyle}>
            <option value="percent">Percentagem (%)</option>
            <option value="fixed">Valor fixo (MT)</option>
            <option value="free_shipping">Frete grátis</option>
          </select>

          {discountType !== "free_shipping" && (
            <input
              placeholder={discountType === "percent" ? "Ex: 10 (para 10%)" : "Ex: 50 (para 50 MT)"}
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              style={inputStyle}
            />
          )}

          {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="addToCartButton" disabled={saving} style={{ flex: 1 }}>
              {saving ? "A criar..." : "Criar cupão"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ ...inputStyle, background: "transparent", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {coupons.length === 0 && !showForm && (
        <div className="emptyState">Ainda não tem cupões. Crie o primeiro!</div>
      )}

      {coupons.map((c) => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div>
            <p style={{ fontWeight: 700, margin: 0 }}>{c.code}</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
              {c.discount_type === "percent" && `${c.discount_value}% de desconto`}
              {c.discount_type === "fixed" && `${c.discount_value} MT de desconto`}
              {c.discount_type === "free_shipping" && "Frete grátis"}
              {" · "}
              {c.active ? "Ativo" : "Inativo"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleActive(c)} style={smallBtnStyle}>
              {c.active ? "Desativar" : "Ativar"}
            </button>
            <button onClick={() => deleteCoupon(c.id)} style={{ ...smallBtnStyle, color: "var(--primary)" }}>Apagar</button>
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
