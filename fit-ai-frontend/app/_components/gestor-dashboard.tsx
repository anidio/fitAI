"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, CheckCircle2, Activity, Users, Trophy, Zap } from "lucide-react";

export function GestorDashboard() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDashboard, setShowDashboard] = useState(true);

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
      // show dashboard after successful creation
      setShowDashboard(true);
    } catch (error: any) {
      console.error("Erro no dashboard corporativo:", error);
      alert(error.message || "Erro interno ao salvar unidade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-wide text-primary leading-tight">
          Fit.AI
        </h1>
        <p className="text-sm md:text-base text-zinc-400">Painel do Gestor — visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-2 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">Total de Inscritos</div>
                <Users className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">1,245</div>
              <div className="text-xs text-emerald-400">+12.5% vs mês anterior</div>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-2 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">Taxa de Frequência</div>
                <Activity className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">78.5%</div>
              <div className="text-xs text-emerald-400">+5.2% vs mês anterior</div>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-2 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">Uso do Chatbot</div>
                <Zap className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">892</div>
              <div className="text-xs text-emerald-400">+8.9% vs mês anterior</div>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-4 flex flex-col gap-2 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">Planos Premium</div>
                <Trophy className="size-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">456</div>
              <div className="text-xs text-emerald-400">+2.3% vs mês anterior</div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Atividade Semanal</h3>
                <p className="text-xs text-zinc-400">Treinos vs Chatbot</p>
              </div>
              <div className="text-xs text-zinc-400">Última semana</div>
            </div>
            <div className="w-full h-40 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-md flex items-end">
              <div className="flex w-full gap-2 items-end px-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full rounded-t-md bg-emerald-500" style={{ height: `${40 + i * 8}px` }} />
                    <div className="w-full rounded-t-md bg-primary mt-1" style={{ height: `${20 + (6 - i) * 6}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-zinc-900 p-4 border border-zinc-800">
            <h4 className="text-sm font-semibold mb-3">Atividades Recentes</h4>
            <ul className="flex flex-col gap-3">
              {[
                { name: "João Silva", action: "Concluiu Treino de perna", time: "há 5 min" },
                { name: "Maria Santos", action: "Matricou 3x aulas de cardio", time: "há 12 min" },
                { name: "Carlos Oliveira", action: "Assinou plano mensal", time: "há 25 min" },
                { name: "Ana Costa", action: "Usuário desbloqueou desafio", time: "há 34 min" },
              ].map((it, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black">{it.name.charAt(0)}</div>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-zinc-400">{it.action} · <span className="text-zinc-500">{it.time}</span></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-4 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-400">Retenção</div>
              <div className="font-semibold">94%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-400">Alunos Ativos</div>
              <div className="font-semibold">328</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-400">Tempo Médio</div>
              <div className="font-semibold">15.2h</div>
            </div>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="size-5 text-primary" /> Criar Nova Unidade
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">Cadastre novas unidades físicas</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGym} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="gym-name" className="text-xs text-zinc-300">Nome da Unidade</Label>
                  <Input id="gym-name" value={gymName} onChange={(e) => setGymName(e.target.value)} disabled={loading} required className="h-10 bg-zinc-800" />
                </div>

                <Button type="submit" disabled={loading || !gymName.trim()} className="h-10 bg-primary text-black">
                  {loading ? "Registrando..." : (
                    <span className="flex items-center gap-2"><Plus className="size-4" /> Registrar Unidade</span>
                  )}
                </Button>

                {successMessage && (
                  <div className="mt-2 p-2 rounded-md bg-emerald-600/10 border border-emerald-600/30 text-emerald-300 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> <span>{successMessage}</span></div>
                      <button type="button" onClick={() => { router.refresh(); router.push('/'); }} className="text-xs bg-emerald-500 text-black px-3 py-1 rounded-md">Ir para Painel</button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}