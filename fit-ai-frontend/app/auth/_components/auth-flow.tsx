"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AuthFlow = () => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER"); // Padrão: Aluno

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro Local
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name,
          role, // Agora enviado no nível correto para o Better Auth identificar
        });

        if (signUpError) throw new Error(signUpError.message);
        
        // Se cadastrou com sucesso, loga o usuário automaticamente
        alert("Cadastro realizado com sucesso! Faça o login.");
        setIsSignUp(false);
      } else {
        // Fluxo de Login Local
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });

        if (signInError) throw new Error(signInError.message);

        // Redireciona para a página principal após logar
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-white">
          {isSignUp ? "Criar nova conta" : "Bem-vindo de volta"}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {isSignUp ? "Preencha os dados abaixo" : "Insira suas credenciais"}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isSignUp && (
          <>
            <div>
              <Label className="text-xs text-zinc-300">Nome Completo</Label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white mt-1 h-9 rounded-lg"
              />
            </div>

            {/* Seletor de Perfil do Usuário para o Futuro */}
            <div>
              <Label className="text-xs text-zinc-300">Tipo de Perfil</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white mt-1 h-9 rounded-lg px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="USER">Aluno / Cliente</option>
                <option value="PERSONAL">Personal Trainer</option>
                <option value="GYM_OWNER">Dono de Academia</option>
              </select>
            </div>
          </>
        )}

        <div>
          <Label className="text-xs text-zinc-300">E-mail</Label>
          <Input
            type="email"
            placeholder="dev@fitai.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 text-white mt-1 h-9 rounded-lg"
          />
        </div>

        <div>
          <Label className="text-xs text-zinc-300">Senha</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-zinc-800 border-zinc-700 text-white mt-1 h-9 rounded-lg"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-9 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90"
        >
          {loading ? "Processando..." : isSignUp ? "Registrar" : "Entrar"}
        </Button>
      </form>

      <div className="text-center mt-2">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-xs text-zinc-400 hover:text-white underline transition-colors"
        >
          {isSignUp ? "Já tem uma conta? Entre aqui" : "Não tem conta? Cadastre-se"}
        </button>
      </div>
    </div>
  );
};