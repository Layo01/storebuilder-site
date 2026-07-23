import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (signInError || !data.user) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push("/painel");
  }

  return (
    <div className="container" style={{ paddingTop: 60 }}>
      <h1 className="storeName" style={{ textAlign: "center" }}>Entrar</h1>
      <p className="storeAbout" style={{ textAlign: "center", marginBottom: 24 }}>
        Aceda ao painel da sua loja
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="O seu e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}

        <button type="submit" className="addToCartButton" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "A entrar..." : "Entrar"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
        <a href="/criar-loja" style={{ color: "var(--primary)" }}>Ainda não tem loja? Criar agora</a>
      </p>
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
