"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, CheckCircle2, Activity, Users, Trophy, Zap, Edit2, Trash2, X, Check, Loader2 } from "lucide-react";
import { LogoutButton } from "@/app/profile/_components/logout-button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://fitai-backend-fdgf.onrender.com";

type Gym = {
  id: string;
  name: string;
  createdAt: string;
};

export function GestorDashboard() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Gym management states
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Fetch gyms owned by this gestor
  const fetchGyms = async () => {
    try {
      const response = await fetch(`${apiUrl}/gyms/owner`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setGyms(data);
      }
    } catch (err) {
      console.error("Erro ao carregar as academias:", err);
    } finally {
      setLoadingGyms(false);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, []);

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) return;
    
    setLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch(`${apiUrl}/gyms`, {
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

      setSuccessMessage(`Unidade "${data.gym.name}" registrada com sucesso!`);
      setGymName("");
      fetchGyms(); // refresh the list

      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (error: any) {
      console.error("Erro no dashboard corporativo:", error);
      alert(error.message || "Erro interno ao salvar unidade.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (gymId: string, currentName: string) => {
    setEditingGymId(gymId);
    setEditingName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingGymId(null);
    setEditingName("");
  };

  const handleEditGym = async (gymId: string) => {
    if (!editingName.trim() || editingName.trim().length < 3) {
      alert("O nome da unidade deve ter pelo menos 3 caracteres.");
      return;
    }

    setLoadingEdit(true);
    try {
      const response = await fetch(`${apiUrl}/gyms/${gymId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingName }),
        credentials: "include",
      });

      if (response.ok) {
        setEditingGymId(null);
        setEditingName("");
        fetchGyms();
      } else {
        const data = await response.json();
        alert(data.error || "Não foi possível renomear a unidade.");
      }
    } catch (err) {
      console.error("Erro ao editar academia:", err);
      alert("Erro de conexão ao editar academia.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteGym = async (gymId: string, name: string) => {
    const confirmed = confirm(`Tem certeza que deseja excluir a unidade "${name}"? Isso removerá permanentemente todos os vínculos e planos de treino desta academia.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${apiUrl}/gyms/${gymId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchGyms();
      } else {
        const data = await response.json();
        alert(data.error || "Não foi possível excluir a unidade.");
      }
    } catch (err) {
      console.error("Erro ao excluir academia:", err);
      alert("Erro de conexão ao excluir academia.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-wide text-primary leading-tight">Fit.AI</h1>
          <p className="text-sm md:text-base text-zinc-400">Painel do Gestor — visão geral do sistema</p>
        </div>
        <div>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
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

          {/* Activity Chart */}
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

        {/* Right Column: Gyms List, Create Gym & Side stats */}
        <div className="space-y-6">
          {/* Gyms List Card */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="size-5 text-primary" /> Minhas Unidades
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">Gerencie as academias sob sua propriedade</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGyms ? (
                <div className="flex items-center justify-center p-6 text-zinc-500 text-sm gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" /> Carregando unidades...
                </div>
              ) : gyms.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">Nenhuma unidade cadastrada. Use o formulário abaixo para registrar.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {gyms.map((gym) => (
                    <div key={gym.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 gap-2 transition hover:border-zinc-700">
                      {editingGymId === gym.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            disabled={loadingEdit}
                            className="h-8 bg-zinc-850 text-xs flex-1 text-white border-zinc-700 focus-visible:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditGym(gym.id)}
                            disabled={loadingEdit}
                            className="p-1.5 rounded-md bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                          >
                            {loadingEdit ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={loadingEdit}
                            className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{gym.name}</span>
                            <span className="text-[10px] text-zinc-500">Cadastrada em {new Date(gym.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(gym.id, gym.name)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-zinc-800 transition"
                              title="Editar nome"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGym(gym.id, gym.name)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                              title="Excluir unidade"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Gym Card */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="size-5 text-primary" /> Registrar Nova Unidade
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">Cadastre novas unidades físicas</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGym} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="gym-name" className="text-xs text-zinc-300">Nome da Unidade</Label>
                  <Input id="gym-name" value={gymName} onChange={(e) => setGymName(e.target.value)} disabled={loading} required className="h-10 bg-zinc-800 border-zinc-700" placeholder="Ex: Unidade Recife - Boa Viagem" />
                </div>

                <Button type="submit" disabled={loading || !gymName.trim()} className="h-10 bg-primary text-black hover:bg-primary/90">
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Registrando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Plus className="size-4" /> Registrar Unidade</span>
                  )}
                </Button>

                {successMessage && (
                  <div className="mt-2 p-2 rounded-md bg-emerald-600/10 border border-emerald-600/30 text-emerald-300 text-sm">
                    <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> <span>{successMessage}</span></div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
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
        </div>
      </div>
    </div>
  );
}