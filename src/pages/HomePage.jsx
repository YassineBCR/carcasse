import { Link } from 'react-router-dom'
import { Leaf, ShieldCheck, Truck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { isSupabaseConfigured } = useAuth()

  return (
    <div className="space-y-6 sm:space-y-8">
      {!isSupabaseConfigured && (
        <section className="glass rounded-2xl border-amber-500/50 bg-amber-100/80 p-4 text-amber-900">
          Configure d&apos;abord `.env` avec les cles Supabase/Stripe, puis relance `npm run dev`.
        </section>
      )}
      <section className="glass rounded-3xl p-6 sm:p-9">
        <p className="mb-3 inline-flex rounded-full border border-[#c8a752]/35 bg-[#f9f2dd] px-3 py-1 text-xs font-medium text-[#7a5f1a]">
          Plateforme officielle de reservation
        </p>
        <h1 className="title-gradient text-3xl leading-tight sm:text-5xl">
          Reservation d&apos;agneaux pour l&apos;Aid Al-Adha
        </h1>
        <p className="mt-4 max-w-2xl text-[#234f3f]">
          Reservez en ligne (360 EUR par agneau) et retirez votre carcasse dans votre mosquee.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/reservation"
            className="rounded-xl bg-[#0f3d2e] px-5 py-3 font-medium text-[#f7f2e7] transition hover:-translate-y-0.5 hover:bg-[#164936]"
          >
            Commencer une reservation
          </Link>
          <Link
            to="/connexion"
            className="rounded-xl border border-[#0f3d2e]/30 bg-white/70 px-5 py-3 font-medium text-[#0f3d2e] transition hover:bg-white"
          >
            Acceder a mon espace
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass rounded-2xl p-5 transition hover:-translate-y-1">
          <Leaf className="mb-3 text-[#be9a3d]" />
          <h2 className="mb-2 text-xl text-[#0f3d2e]">Process simple</h2>
          <p>Choix de la mosquee, noms du sacrifice, quantite, paiement Stripe.</p>
        </article>
        <article className="glass rounded-2xl p-5 transition hover:-translate-y-1">
          <ShieldCheck className="mb-3 text-[#be9a3d]" />
          <h2 className="mb-2 text-xl text-[#0f3d2e]">Paiement securise</h2>
          <p>Checkout Stripe et suivi de statut via webhook serveur.</p>
        </article>
        <article className="glass rounded-2xl p-5 transition hover:-translate-y-1">
          <Truck className="mb-3 text-[#be9a3d]" />
          <h2 className="mb-2 text-xl text-[#0f3d2e]">Livraison tracee</h2>
          <p>Interface dediee aux livreurs et validation du retrait en mosquee.</p>
        </article>
      </section>
    </div>
  )
}
