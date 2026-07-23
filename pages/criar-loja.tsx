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
      <div className="container" style={{ paddingTop: 60, textAlign: "center" }}>
        <h1 className="storeName">Loja criada!</h1>
        <p className="storeAbout">A sua loja já está disponível em:</p>
        <p style={{ marginTop: 12 }}>
          <a href={`/loja/${successSlug}`} style={{ color: "var(--primary)", fontWeight: 700 }}>
            /loja/{successSlug}
          </a>
        </p>
        <p className="storeAbout" style={{ marginTop: 24 }}>
          <a href="/painel" style={{ color: "var(--primary)" }}>Ir para o meu painel</a>
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <h1 className="storeName" style={{ textAlign: "center" }}>Criar a minha loja</h1>
      <p className="storeAbout" style={{ textAlign: "center", marginBottom: 24 }}>
        Preencha os dados abaixo para criar a sua loja online gratuitamente.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Nome da loja"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Descreva o seu negócio"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: 80 }}
        />
        <input
          placeholder="Número de WhatsApp (ex: 258866452412)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="O seu e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Crie uma senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}

        <button type="submit" className="addToCartButton" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "A criar loja..." : "Criar a minha loja"}
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
