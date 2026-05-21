"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, CheckCircle2 } from "lucide-react";

export function GestorDashboard() {
  const [gymName, setGymName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) return;
    
    setLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch("http://localhost:8081/gyms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: gymName }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao registrar unidade.");
      }

      setSuccessMessage(`Unidade "${data.gym.name}" registrada e vinculada com sucesso!`);
      setGymName("");
    } catch (error: any) {
      console.error("Erro no dashboard corporativo:", error);
      alert(error.message || "Erro interno ao salvar unidade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      {/* Header Corporativo */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-black italic uppercase tracking-wider text-primary">
          Fit.AI Enterprise
        </h1>
        <p className="text-sm text-zinc-400">
          Painel Administrativo do Gestor de Academia
        </p>
      </div>

      <div className="grid gap-6 max-w-md mx-auto">
        {/* Formulário de Criação de Unidade */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="text-primary size-5" />
              Expandir Franquia
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Cadastre novas unidades físicas para habilitar o acesso de Personais e Alunos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGym} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gym-name" className="text-xs text-zinc-300">
                  Nome da Nova Unidade
                </Label>
                <Input
                  id="gym-name"
                  type="text"
                  placeholder="Ex: Fit.AI - Unidade Recife Centro"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  disabled={loading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus-visible:ring-primary h-10"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !gymName.trim()}
                className="bg-primary text-black font-semibold hover:bg-primary/90 h-10 gap-2 w-full mt-2"
              >
                {loading ? (
                  "Registrando..."
                ) : (
                  <>
                    <Plus className="size-4" />
                    Registrar Unidade
                  </>
                )}
              </Button>
            </form>

            {successMessage && (
              <div className="mt-4 p-3 bg-zinc-800 border border-emerald-800/50 rounded-xl flex items-start gap-2.5 text-xs text-emerald-400 animate-in fade-in duration-300">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}