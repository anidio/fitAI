import Image from "next/image";
import { AuthFlow } from "./_components/auth-flow";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black px-4 overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <Image
          src="/login-bg.png"
          alt="Gym background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <span className="text-2xl font-black italic tracking-wider text-white">
            FIT.<span className="text-primary">AI</span>
          </span>
        </div>

        {/* Card do Formulário */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
          <AuthFlow />
        </div>
      </div>
    </div>
  );
}