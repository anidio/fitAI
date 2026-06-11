"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertTriangle, User2, Zap, Users } from "lucide-react";
import { LogoutButton } from "@/app/profile/_components/logout-button";

type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
};

type StudentWithPlan = {
  id: string;
  name: string;
  email: string;
  workoutPlans: Array<{ id: string; name: string; isActive: boolean }>;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://fitai-backend-fdgf.onrender.com";

export function PersonalDashboard() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [students, setStudents] = useState<StudentWithPlan[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchStudents, setSearchStudents] = useState("");

  // 1. Carrega os templates de treinos disponíveis
  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      try {
        const response = await fetch(`${apiUrl}/workout-plans/templates`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar os templates de treino.");
        }

        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.templates)
          ? payload.templates
          : [];

        if (mounted) {
          setTemplates(list);
        }
      } catch (error) {
        console.error("Erro ao carregar templates:", error);
        if (mounted) {
          setErrorMessage("Falha ao carregar templates. Atualize para tentar novamente.");
        }
      } finally {
        if (mounted) {
          setLoadingTemplates(false);
        }
      }
    };

    loadTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Carrega a lista de alunos cadastrados vinculados à mesma academia (Requisito 3)
  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      try {
        const response = await fetch(`${apiUrl}/gyms/students`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar alunos vinculados à academia.");
        }

        const list = await response.json();
        if (mounted) {
          setStudents(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error("Erro ao carregar alunos:", error);
      } finally {
        if (mounted) {
          setLoadingStudents(false);
        }
      }
    };

    loadStudents();
    return () => {
      mounted = false;
    };
  }, []);

  // 3. Executa a ligação direta entre o aluno escolhido e o treino selecionado
  const handleAssignWorkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudentId || !templateId) return;

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Encontra os dados do aluno selecionado na lista para extrair o e-mail
    const chosenStudent = students.find((s) => s.id === selectedStudentId);

    try {
      const response = await fetch(`${apiUrl}/workout-plans/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          templateId, 
          studentEmail: chosenStudent?.email // <-- ENVIADO APENAS O QUE O BACKEND SOLICITA
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Falha ao vincular treino ao aluno.");
      }

      setSuccessMessage(`Treino vinculado com sucesso para ${chosenStudent?.name}!`);
      setSelectedStudentId("");
      setTemplateId("");

      // Atualiza a listagem de alunos e estados na tela de forma limpa após 1.5s
      setTimeout(() => {
        globalThis.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao vincular treino:", error);
      setErrorMessage(error.message || "Erro interno ao vincular treino.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchStudents.toLowerCase()) ||
    s.email.toLowerCase().includes(searchStudents.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      <div className="relative overflow-hidden bg-black pb-16">
        <div className="absolute inset-0 opacity-60 bg-linear-to-b from-black via-zinc-900 to-transparent" />
        <div className="relative px-5 py-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-400">Fit.AI</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white">Painel do Personal Trainer</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">Gerencie os treinos dos seus alunos e atribua modelos rapidamente.</p>
            </div>
            <div>
              <LogoutButton compact label="Sair" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              placeholder="Buscar aluno por nome ou email..."
              value={searchStudents}
              onChange={(e) => setSearchStudents(e.target.value)}
              className="flex-1 h-12 rounded-full bg-zinc-900 px-4 text-white placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-zinc-700"
            />
            <button className="h-12 rounded-full bg-primary px-6 text-black font-semibold pointer-events-none">{students.length} alunos</button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Zap className="size-5 text-cyan-400" /> Atribuir Modelo de Treino
                </CardTitle>
                <CardDescription>Selecione um aluno da lista e associe um plano de treinos.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAssignWorkout} className="flex flex-col gap-5">
                  <div className="grid gap-4">
                    {/* [ATUALIZADO] Campo select dinâmico em vez de e-mail escrito à mão */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="student-select" className="text-xs text-zinc-300">
                        Aluno Matriculado
                      </Label>
                      <select
                        id="student-select"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        disabled={loading || loadingStudents}
                        required
                        className="h-12 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                      >
                        <option value="">Selecione um aluno da lista...</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="template-select" className="text-xs text-zinc-300">
                        Modelo de treino
                      </Label>
                      <select
                        id="template-select"
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        disabled={loading || loadingTemplates}
                        required
                        className="h-12 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Selecione um template...</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4" /> {errorMessage}
                      </div>
                    </div>
                  )}

                  {!loadingTemplates && templates.length === 0 && (
                    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                      <div className="font-semibold">Nenhum template encontrado.</div>
                      <p className="mt-1 text-xs text-yellow-100">
                        Execute o seed no backend ou cadastre templates para o personal.
                      </p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4" /> {successMessage}
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={loading || loadingTemplates || students.length === 0} className="h-12 rounded-full bg-primary text-black font-semibold hover:bg-primary/90">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vinculando...
                      </>
                    ) : (
                      "Vincular Treino"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="size-5 text-blue-400" /> Alunos Cadastrados
                </CardTitle>
                <CardDescription>Visualização de todos os alunos pertencentes à mesma unidade de academia.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="size-4 animate-spin" /> Carregando alunos...
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{student.name}</p>
                                <p className="text-xs text-zinc-400">{student.email}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {student.workoutPlans && student.workoutPlans.length > 0 ? (
                                student.workoutPlans.map((plan) => (
                                  <Badge key={plan.id} className={plan.isActive ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}>
                                    {plan.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-zinc-500">Sem treinos ativos no momento</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Nenhum aluno matriculado nesta academia.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Templates Disponíveis</CardTitle>
                <CardDescription className="text-xs">Modelos globais de treino</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="size-4 animate-spin" /> Carregando...
                  </div>
                ) : templates.length > 0 ? (
                  templates.map((template) => (
                    <div key={template.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <p className="text-xs font-semibold text-white">{template.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">{template.description ?? "Template de treino"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400">Nenhum template disponível</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-black">
                    <User2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Dica B2B</p>
                    <p className="text-xs text-zinc-500">Os alunos listados são vinculados automaticamente com base no código da academia selecionada por eles.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}