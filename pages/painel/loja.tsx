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
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [telegram, setTelegram] = useState("");
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
    setTiktok(store.tiktok || "");
    setYoutube(store.youtube || "");
    setTelegram(store.telegram || "");
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
        tiktok: tiktok.trim(),
        youtube: youtube.trim(),
        telegram: telegram.trim(),
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

      <form onSubmit={handleSave} style={{ marginTop: 16 }}>
        <div className="fieldGroup">
          <label className="fieldLabel">Logo da loja</label>
          {existingLogoUrl && !logoFile && (
            <img src={existingLogoUrl} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", marginBottom: 8, display: "block" }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Nome da loja</label>
          <input className="fieldInput" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Descrição do negócio</label>
          <textarea className="fieldInput" style={{ minHeight: 70 }} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Número de WhatsApp</label>
          <input className="fieldInput" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="258866452412" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Instagram</label>
          <input className="fieldInput" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@minhaloja ou link" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Facebook</label>
          <input className="fieldInput" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/minhaloja" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">TikTok</label>
          <input className="fieldInput" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@minhaloja ou link" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">YouTube</label>
          <input className="fieldInput" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="Link do canal" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Telegram</label>
          <input className="fieldInput" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="Link do canal ou @usuario" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Horário de funcionamento</label>
          <input className="fieldInput" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="Seg-Sex 8h-18h, Sáb 8h-13h" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Informação de entrega</label>
          <input className="fieldInput" value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} placeholder="Entregamos em Maputo, taxa de 100 MT" />
        </div>

        <div className="fieldGroup">
          <label className="fieldLabel">Métodos de pagamento aceites</label>
          <input className="fieldInput" value={paymentMethods} onChange={(e) => setPaymentMethods(e.target.value)} placeholder="M-Pesa, e-Mola, Dinheiro" />
        </div>

        {error && <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: 13, marginBottom: 12, fontWeight: 700 }}>Dados guardados com sucesso!</p>}

        <button type="submit" className="primaryButton" disabled={saving}>
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </form>
    </div>
  );
}
