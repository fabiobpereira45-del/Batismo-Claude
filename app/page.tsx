import FormularioBatismo from "@/components/formulario-batismo";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50 py-6 sm:py-12 px-3 sm:px-6 relative overflow-x-hidden w-full max-w-full">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <Link 
          href="/admin/login" 
          className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 sm:gap-2 bg-white/70 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm hover:shadow-md border border-slate-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>Acesso Master</span>
        </Link>
      </div>
      <div className="max-w-3xl mx-auto relative z-10 w-full px-0">
        <div className="text-center mb-6 sm:mb-12 mt-8 sm:mt-4">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl mb-4 sm:mb-6">
            <Image src="/logo-setor.png" alt="Logo AD Setor Tancredo Neves" width={220} height={220} className="object-contain w-40 sm:w-56 h-auto" priority />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4 drop-shadow-sm leading-tight">
            Cadastro de Membros <br className="hidden sm:block"/>e Obreiros
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 font-medium px-2">
            Igreja Assembleia de Deus <br className="sm:hidden" /><span className="text-indigo-600 font-semibold">Setor Tancredo Neves</span>
          </p>
        </div>
        <div className="relative w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2.5rem] blur-lg opacity-20"></div>
          <div className="relative w-full">
            <FormularioBatismo />
          </div>
        </div>
      </div>
    </main>
  );
}