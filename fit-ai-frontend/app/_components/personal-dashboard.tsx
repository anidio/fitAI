"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertTriangle, ChevronLeft, User2, Zap } from "lucide-react";

type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
};

export function PersonalDashboard() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      try {
        const response = await fetch("http://localhost:8081/workout-plans/templates", {
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

  const handleAssignWorkout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentEmail.trim() || !templateId) return;

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:8081/workout-plans/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ templateId, studentEmail: studentEmail.trim() }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Falha ao vincular treino ao aluno.");
      }

      setSuccessMessage("Treino vinculado com sucesso ao aluno.");
      setStudentEmail("");
      setTemplateId("");
    } catch (error: any) {
      console.error("Erro ao vincular treino:", error);
      setErrorMessage(error.message || "Erro interno ao vincular treino.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-black pb-12">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_40%)]" />
        <div className="relative px-5 py-8">
          <Link href="/auth" className="inline-flex items-center gap-2 text-sm text-white/70">
            <ChevronLeft className="size-4" /> Sair
          </Link>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-400">Fit.AI</p>
            <h1 className="text-3xl font-bold text-white">Painel do Personal Trainer</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              Use os modelos de treino já cadastrados e vincule rapidamente novos alunos.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="bg-zinc-950 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Zap className="size-5 text-cyan-400" /> Selecionar modelo de treino
              </CardTitle>
              <CardDescription>Escolha um template e vincule ao e-mail do aluno matriculado.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignWorkout} className="flex flex-col gap-5">
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="student-email" className="text-xs text-zinc-300">
                      E-mail do aluno
                    </Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="aluno@exemplo.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
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

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4" /> {successMessage}
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={loading || loadingTemplates} className="h-12 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90">
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

          <div className="space-y-4">
            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Templates Disponíveis</CardTitle>
                <CardDescription>Modelos de treino globais marcados como template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="size-4 animate-spin" /> Carregando templates...
                  </div>
                ) : templates.length ? (
                  templates.map((template) => (
                    <div key={template.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{template.name}</p>
                          <p className="text-xs text-zinc-500">{template.description ?? "Template de treino global."}</p>
                        </div>
                        <Badge className="bg-cyan-500 text-black">Template</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">Nenhum template de treino encontrado. Atualize a página para tentar novamente.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-black">
                    <User2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Use o painel para vincular alunos</p>
                    <p className="text-xs text-zinc-500">O e-mail do aluno deve corresponder ao cadastro do usuário no app.</p>
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
