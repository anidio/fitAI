"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";

type GymOption = {
  id: string;
  name: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://fitai-backend-fdgf.onrender.com";

export default function SelectGymPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gyms, setGyms] = useState<GymOption[]>([]);
  const [selectedGym, setSelectedGym] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchGyms = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/gyms`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Falha ao buscar academias.");
        }

        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.gyms)
          ? payload.gyms
          : [];

        if (mounted) {
          setGyms(list);
        }
      } catch (fetchError) {
        console.error("Erro ao carregar academias:", fetchError);
        if (mounted) {
          setError("Não foi possível carregar as unidades. Atualize a página.");
        }
      }
    };

    fetchGyms();
    return () => {
      mounted = false;
    };
  }, []);

  const handleConfirmGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGym) return;
    setLoading(true);

    try {
      // CORREÇÃO: Usando a função nativa 'fetch' (letras minúsculas) do navegador.
      // Sem nenhuma referência a 'customFetch'!
      const response = await fetch(`${apiBaseUrl}/me/gym`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gymId: selectedGym }),
        credentials: "include", // Anexa os cookies de sessão locais do Better-Auth
      });

      if (!response.ok) {
        throw new Error("Falha ao vincular academia.");
      }

      // After linking gym, apply any pending workout plans assigned to this user's email
      try {
        await fetch(`${apiBaseUrl}/me/pending-assignments/apply`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.warn("Falha ao aplicar planos pendentes:", e);
      }

      router.refresh();
      router.push("/");
    } catch (fetchError) {
      console.error("Erro ao vincular academia:", fetchError);
      setError("Erro ao salvar unidade. Verifique se o servidor backend está ativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-100 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl text-center">
        
        <div className="mb-6 flex justify-center">
          <Image
            src="/fit-ai-logo.svg"
            alt="Fit.AI"
            width={50}
            height={50}
          />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Confirme sua Academia</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Selecione abaixo a unidade corporativa vinculada para liberar o acesso ao aplicativo.
        </p>

        <form onSubmit={handleConfirmGym} className="flex flex-col gap-4 text-left">
          <div>
            <Label className="text-xs text-zinc-300">Unidades Disponíveis</Label>
            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white mt-1 h-12 rounded-xl px-3 text-sm focus:outline-none"
            >
              <option value="">Selecione sua unidade...</option>
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedGym || loading}
            className="w-full h-12 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 mt-2"
          >
            {loading ? "Confirmando..." : "Confirmar e Entrar"}
          </Button>
        </form>

        {gyms.length === 0 && !error && (
          <p className="mt-4 text-xs text-zinc-500">Carregando unidades disponíveis...</p>
        )}
      </div>
    </div>
  );
}