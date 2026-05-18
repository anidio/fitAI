"use client";

import { Search, User2, Upload, FileText, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const STUDENTS = [
  { id: 1, name: "João Silva", email: "joao@email.com", plan: "Premium com Chatbot", hasFile: false },
  { id: 2, name: "Maria Santos", email: "maria@email.com", plan: "Premium com Chatbot", hasFile: true, fileName: "treino_maria_abril.docx", date: "12/04/2026" },
  { id: 3, name: "Carlos Oliveira", email: "carlos@email.com", plan: "Premium com Chatbot", hasFile: false },
  { id: 4, name: "Ana Costa", email: "ana@email.com", plan: "Premium com Chatbot", hasFile: true, fileName: "plano_treino_ana.docx", date: "09/04/2026" },
  { id: 5, name: "Pedro Alves", email: "pedro@email.com", plan: "Premium com Chatbot", hasFile: false },
];

export function PersonalDashboard() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-10">
      {/* Header */}
      <div className="relative h-[180px] w-full overflow-hidden rounded-b-[32px] bg-black p-6">
        <div className="absolute inset-0 opacity-40">
           <div className="h-full w-full bg-gradient-to-b from-transparent to-black" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-4 pt-2">
          <Link href="/auth" className="flex items-center gap-1 text-sm text-white/70">
            <ChevronLeft className="size-4" /> Sair
          </Link>
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-blue-500">FIT.AI</p>
            <h1 className="font-heading text-2xl font-bold text-white">Painel do Personal</h1>
            <p className="text-sm text-white/60">Gerencie os treinos dos seus alunos</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 -mt-6 relative z-20">
        {/* Stats Summary */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Alunos com Plano Chatbot</span>
          <Badge className="bg-blue-600 hover:bg-blue-600 rounded-full px-3">{STUDENTS.length} alunos</Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar aluno por nome ou email..." 
            className="h-12 rounded-2xl border-none bg-muted/50 pl-10 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>

        {/* Students List */}
        <div className="flex flex-col gap-4">
          {STUDENTS.map((student) => (
            <div key={student.id} className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <User2 className="size-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{student.name}</span>
                  <span className="text-xs text-muted-foreground">{student.email}</span>
                  <Badge variant="secondary" className="mt-1 w-fit bg-blue-50 text-[10px] text-blue-600 hover:bg-blue-50">
                    {student.plan}
                  </Badge>
                </div>
              </div>

              {student.hasFile ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-2xl bg-green-50 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-green-600" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-green-700">{student.fileName}</span>
                        <span className="text-[10px] text-green-600/70">Enviado em {student.date}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="h-8 text-[10px] rounded-lg border-blue-200 text-blue-600">Plano 1</Button>
                    <Button variant="outline" className="h-8 text-[10px] rounded-lg border-blue-200 text-blue-600">Plano 2</Button>
                    <Button variant="outline" className="h-8 text-[10px] rounded-lg border-blue-200 text-blue-600">Plano 3</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button className="h-12 w-full gap-2 rounded-2xl bg-blue-600 text-sm font-semibold hover:bg-blue-700">
                    <Upload className="size-4" />
                    Adicionar Plano de Treino (.docx)
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="h-8 text-[10px] rounded-lg border-blue-200 text-blue-600">Plano 1</Button>
                    <Button variant="outline" className="h-8 text-[10px] rounded-lg border-blue-200 text-blue-600">Plano 2</Button>
                    <Button variant="outline" className="h-8 text-[10px] rounded-lg border-blue-200 text-blue-600">Plano 3</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="rounded-2xl bg-blue-50 p-4">
          <div className="flex gap-2">
            <span className="text-lg">📋</span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-blue-900">Sobre os Planos de Treino</span>
              <p className="text-xs leading-relaxed text-blue-800/80">
                Os arquivos .docx enviados ficam disponíveis para os alunos acessarem no aplicativo. 
                Mantenha as planilhas atualizadas para garantir o melhor acompanhamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
