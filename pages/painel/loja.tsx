import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

export default function DadosLoja() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

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
      .select("*")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (!store) {
      router.push("/criar-loja");
      return;
    }

    setStoreId(store.id);
    setName(store.name || "");
    setDescription(store.business_description || "");
    setWhatsapp(store.whatsapp_number || "");
    setInstagram(store.instagram || "");
    setFacebook(store.facebook || "");
    setBusinessHours(store.business_hours || "");
    setDeliveryInfo(store.delivery_info || "");
    setPaymentMethods(store.payment_methods || "");
    setExistingLogoUrl(store.logo_url || null);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !whatsapp.trim()) {
      setError("Nome da loja e WhatsApp são obrigatórios.");
      return;
    }
    if (!storeId) return;

    setSaving(true);

    let logoUrl = existingLogoUrl;

    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const filePath = `${storeId}/logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, logoFile);

      if (uploadError) {
        setError("Erro ao enviar logo: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
      logoUrl = publicUrlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("stores")
      .update({
        name: name.trim(),
        business_description: description.trim(),
        whatsapp_number: whatsapp.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        business_hours: businessHours.trim(),
        delivery_info: deliveryInfo.trim(),
        payment_methods: paymentMethods.trim(),
        logo_url: logoUrl,
      })
      .eq("id", storeId);

    setSaving(false);

    if (updateError) {
      setError("Erro ao guardar: " + updateError.message);
      return;
    }

    setSuccess(true);
  }

  if (loading) return <div className="emptyState">A carregar...</div>;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <a href="/painel" style={{ color: "var(--text-muted)", fontSize: 13 }}>← Voltar ao painel</a>
      <h1 className="storeName" style={{ marginTop: 10 }}>Dados da loja</h1>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <label style={labelStyle}>Logo da loja</label>
        {existingLogoUrl && !logoFile && (
          <img src={existingLogoUrl} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover" }} />
        )}
        <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />

        <label style={labelStyle}>Nome da loja</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Descrição do negócio</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} />

        <label style={labelStyle}>Número de WhatsApp</label>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={inputStyle} placeholder="258866452412" />

        <label style={labelStyle}>Instagram (opcional)</label>
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} style={inputStyle} placeholder="@minhaloja" />

        <label style={labelStyle}>Facebook (opcional)</label>
        <input value={facebook} onChange={(e) => setFacebook(e.target.value)} style={inputStyle} placeholder="facebook.com/minhaloja" />

        <label style={labelStyle}>Horário de funcionamento</label>
        <input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} style={inputStyle} placeholder="Seg-Sex 8h-18h, Sáb 8h-13h" />

        <label style={labelStyle}>Informação de entrega</label>
        <input value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} style={inputStyle} placeholder="Entregamos em Maputo, taxa de 100 MT" />

        <label style={labelStyle}>Métodos de pagamento aceites</label>
        <input value={paymentMethods} onChange={(e) => setPaymentMethods(e.target.value)} style={inputStyle} placeholder="M-Pesa, e-Mola, Dinheiro" />

        {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: "#4ade80", fontSize: 13 }}>Dados guardados com sucesso!</p>}

        <button type="submit" className="addToCartButton" disabled={saving} style={{ marginTop: 8 }}>
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </form>
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

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  marginTop: 4,
};
