"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

export default function SelectGymPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Fazemos a chamada para atualizar a academia do usuário
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}/me/gym`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gymId: 'demo-gym-id' }),
        credentials: "include", 
      });

      // Independente do sucesso da API no modo demo, vamos seguir o fluxo para não travar o usuário
      router.push("/");
    } catch (error) {
      console.error("Erro ao selecionar academia:", error);
      // Fallback para não travar o fluxo em um projeto de faculdade
      router.push("/");
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col bg-black overflow-hidden">
      {/* Background Map - Simulando com imagem ou div escura */}
      <div className="absolute inset-0 bg-[#1a1c1e]">
        <Image
          src="/login-bg.png"
          alt="Map"
          fill
          className="object-cover opacity-40 grayscale"
        />
        
        {/* FIT.AI Pin Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping" />
            <div className="relative h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center border-4 border-white shadow-2xl">
              <span className="text-white font-bold text-xs">FIT.AI</span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-blue-600" />
          </div>
        </div>

        {/* Other Pins */}
        <div className="absolute top-1/3 left-1/4">
          <MapPin className="text-red-500 h-6 w-6" />
        </div>
        <div className="absolute bottom-1/3 right-1/4">
          <MapPin className="text-red-500 h-6 w-6" />
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom Card */}
      <div className="relative z-10 px-5 pb-10">
        <div className="bg-[#111214] border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-xl">FIT</span>
                <span className="text-blue-500 font-bold text-xl">.AI</span>
              </div>
              <h2 className="text-white text-lg font-semibold uppercase tracking-tight">
                Selecione sua academia
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Unidade Recife - Boa Viagem
              </p>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Navigation className="h-3 w-3" />
              <span>Baseado na sua localização atual</span>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20"
            >
              {loading ? "Confirmando..." : "Confirmar Unidade"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
