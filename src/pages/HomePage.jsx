import { Link } from 'react-router-dom'
import { Leaf, ShieldCheck, Truck, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { isSupabaseConfigured } = useAuth()

  return (
    <div className="space-y-8 sm:space-y-12">
      {!isSupabaseConfigured && (
        <section className="glass-panel rounded-2xl border-l-4 border-l-amber-500 p-5 text-amber-900">
          <p className="font-medium">⚠️ Configuration requise</p>
          <p className="text-sm opacity-80 mt-1">Configure d&apos;abord `.env` avec les clés Supabase/Stripe, puis relance `npm run dev`.</p>
        </section>
      )}

      {/* Hero Section */}
      <section className="glass-panel relative overflow-hidden rounded-3xl p-8 sm:p-14 lg:p-20 text-center sm:text-left">
        {/* Décoration d'arrière-plan abstraite */}
        <div className="absolute -right-20 -top-40 h-96 w-96 rounded-full bg-[#c8a752] opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#0f3d2e] opacity-10 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c8a752]/40 bg-[#c8a752]/10 px-4 py-1.5 text-sm font-semibold text-[#8a7224] shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a752] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8a752]"></span>
            </span>
            Plateforme officielle 2026
          </p>
          <h1 className="title-gradient text-4xl leading-tight sm:text-6xl font-bold mb-6">
            L'excellence pour votre sacrifice de l'Aïd Al-Adha
          </h1>
          <p className="mb-8 text-lg text-[#234f3f]/80 sm:text-xl leading-relaxed max-w-2xl">
            Réservez en ligne sereinement et retirez votre carcasse certifiée dans la mosquée de votre choix. Tarif unique de 360 €.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:justify-start justify-center">
            <Link to="/reservation" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-semibold">
              Réserver maintenant <ArrowRight size={20} />
            </Link>
            <Link to="/connexion" className="glass-input w-full sm:w-auto rounded-2xl px-8 py-4 text-lg font-medium text-[#0f3d2e] text-center hover:bg-white">
              Espace Client
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-6 md:grid-cols-3">
        <article className="glass-panel group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#0f3d2e]/5 cursor-default">
          <div className="mb-5 inline-flex rounded-2xl bg-[#c8a752]/20 p-4 text-[#b89542] transition-colors group-hover:bg-[#c8a752] group-hover:text-white">
            <Leaf size={28} />
          </div>
          <h2 className="mb-3 text-2xl font-semibold text-[#0f3d2e]">Simplicité Absolue</h2>
          <p className="text-[#305547] leading-relaxed">Choix de la mosquée, intention du sacrifice et quantité en quelques clics fluides.</p>
        </article>
        
        <article className="glass-panel group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#0f3d2e]/5 cursor-default">
          <div className="mb-5 inline-flex rounded-2xl bg-[#0f3d2e]/10 p-4 text-[#0f3d2e] transition-colors group-hover:bg-[#0f3d2e] group-hover:text-white">
            <ShieldCheck size={28} />
          </div>
          <h2 className="mb-3 text-2xl font-semibold text-[#0f3d2e]">Paiement Sécurisé</h2>
          <p className="text-[#305547] leading-relaxed">Transaction chiffrée via Stripe. Suivi en temps réel de votre statut de commande.</p>
        </article>
        
        <article className="glass-panel group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#0f3d2e]/5 cursor-default">
          <div className="mb-5 inline-flex rounded-2xl bg-[#c8a752]/20 p-4 text-[#b89542] transition-colors group-hover:bg-[#c8a752] group-hover:text-white">
            <Truck size={28} />
          </div>
          <h2 className="mb-3 text-2xl font-semibold text-[#0f3d2e]">Traçabilité Totale</h2>
          <p className="text-[#305547] leading-relaxed">Suivez l'acheminement de l'abattoir jusqu'à la validation de remise à votre mosquée.</p>
        </article>
      </section>
    </div>
  )
}