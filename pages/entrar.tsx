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
    <div className="authPage">
      <div className="authCard">
        <span className="authBadge">Painel do lojista</span>
        <h1 className="authTitle">Bem-vindo de volta</h1>
        <p className="authSubtitle">Entre para gerir a sua loja, produtos e pedidos.</p>

        <form onSubmit={handleSubmit}>
          <div className="fieldGroup">
            <label className="fieldLabel">E-mail</label>
            <input
              className="fieldInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="o.seu@email.com"
            />
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">Senha</label>
            <input
              className="fieldInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button type="submit" className="primaryButton" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="authFooterLink">
          Ainda não tem loja? <a href="/criar-loja">Criar agora</a>
        </p>
      </div>
    </div>
  );
    }
