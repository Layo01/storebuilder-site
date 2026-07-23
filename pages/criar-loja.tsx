import { useState } from "react";
import { supabase } from "../lib/supabase";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CriarLoja() {
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successSlug, setSuccessSlug] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!storeName.trim() || !whatsapp.trim() || !email.trim() || !password.trim()) {
      setError("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    let baseSlug = slugify(storeName);
    let finalSlug = baseSlug;
    let attempt = 0;

    while (attempt < 10) {
      const { data: existing } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", finalSlug)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      finalSlug = `${baseSlug}-${attempt + 1}`;
    }

    const { error: insertError } = await supabase.from("stores").insert({
      owner_id: authData.user.id,
      name: storeName.trim(),
      business_description: description.trim(),
      subdomain: finalSlug,
      whatsapp_number: whatsapp.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError("Erro ao criar loja: " + insertError.message);
      return;
    }

    setSuccessSlug(finalSlug);
  }

  if (successSlug) {
    return (
      <div className="authPage">
        <div className="authCard" style={{ textAlign: "center" }}>
          <span className="authBadge">Tudo pronto</span>
          <h1 className="authTitle">A sua loja está no ar!</h1>
          <p className="authSubtitle">Já pode partilhar o link e começar a vender.</p>
          <div style={{ background: "var(--surface-alt)", borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 13, wordBreak: "break-all" }}>
            /loja/{successSlug}
          </div>
          <a href="/painel" className="primaryButton" style={{ display: "block", textAlign: "center" }}>
            Ir para o meu painel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <span className="authBadge">Comece grátis</span>
        <h1 className="authTitle">Criar a minha loja</h1>
        <p className="authSubtitle">Leva menos de 2 minutos. Preencha os dados abaixo.</p>

        <form onSubmit={handleSubmit}>
          <div className="fieldGroup">
            <label className="fieldLabel">Nome da loja</label>
            <input className="fieldInput" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Loja da Maria" />
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">Descrição do negócio</label>
            <textarea className="fieldInput" style={{ minHeight: 70 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que vende a sua loja?" />
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">Número de WhatsApp</label>
            <input className="fieldInput" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="258866452412" />
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">O seu e-mail</label>
            <input className="fieldInput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="o.seu@email.com" />
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">Crie uma senha</label>
            <input className="fieldInput" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button type="submit" className="primaryButton" disabled={loading}>
            {loading ? "A criar loja..." : "Criar a minha loja"}
          </button>
        </form>

        <p className="authFooterLink">
          Já tem loja? <a href="/entrar">Entrar</a>
        </p>
      </div>
    </div>
  );
}
