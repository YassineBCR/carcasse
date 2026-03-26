import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { UNIT_PRICE } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, MapPin, User, Phone, Mail, FileText, ChevronRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export function ReservationPage() {
  const { user, profile } = useAuth()
  const [step, setStep] = useState(1)
  const [mosquees, setMosquees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Le formulaire inclut maintenant les infos du client et un seul nom de sacrifice
  const [form, setForm] = useState({
    mosquee_id: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    nomSacrifice: ''
  })

  // Initialisation des mosquées et des données du profil s'il existe
  useEffect(() => {
    supabase.from('mosquees').select('id,nom,ville').then(({ data, error: e }) => {
      if (e) setError(e.message)
      setMosquees(data ?? [])
      
      setForm(prev => ({
        ...prev,
        mosquee_id: data?.[0]?.id || '',
        nom: profile?.nom || '',
        prenom: profile?.prenom || '',
        telephone: profile?.telephone || '',
        email: user?.email || ''
      }))
    })
  }, [profile, user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Validation de l'étape 1
  const handleNext = (e) => {
    e.preventDefault()
    if (!form.mosquee_id || !form.nom || !form.prenom || !form.email || !form.telephone || !form.nomSacrifice) {
      setError("Veuillez remplir tous les champs.")
      return
    }
    setError('')
    setStep(2)
  }

  // Étape 2 : Création de la réservation et redirection Stripe
  const checkout = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Mettre à jour les informations du profil utilisateur
      if (user) {
        await supabase.from('users').update({
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          telephone: form.telephone.trim(),
        }).eq('id', user.id)
      }

      // 2. Créer la réservation en base de données (quantité bloquée à 1)
      const { data: reservation, error: reservationErr } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          mosquee_id: form.mosquee_id,
          quantite: 1,
          noms_sacrifice: [form.nomSacrifice.trim()],
          prix_total: UNIT_PRICE,
          statut_paiement: 'en_attente',
        })
        .select('id')
        .single()

      if (reservationErr) throw reservationErr

      // 3. Appel au backend pour créer la session Stripe
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          quantity: 1,
          customer_email: form.email
        }),
      })

      if (!response.ok) {
        throw new Error('Impossible de créer la session Stripe')
      }

      const payload = await response.json()
      
      // 4. CORRECTION STRIPE : Redirection classique vers l'URL fournie par le backend
      if (payload.url) {
        window.location.href = payload.url
      } else {
        throw new Error("Erreur lors de la génération du lien de paiement.")
      }
      
    } catch (err) {
      setError(err.message ?? 'Erreur de réservation')
      setLoading(false)
    }
  }

  const selectedMosquee = mosquees.find(m => m.id === form.mosquee_id)

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-700">
      <div className="text-center mb-8">
        <h1 className="title-gradient text-4xl mb-2">Réservation</h1>
        <p className="text-[#305547]">
          {step === 1 ? 'Veuillez saisir vos informations' : 'Récapitulatif de votre commande'}
        </p>
      </div>

      <div className="glass-panel space-y-8 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden">
        {/* Barre de progression */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/20">
          <div className={`h-full bg-[#c8a752] transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
            {error}
          </div>
        )}

        {/* ================= ETAPE 1 : FORMULAIRE ================= */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
                <MapPin size={16} className="text-[#c8a752]" /> Point de retrait
              </label>
              <select
                required
                name="mosquee_id"
                className="glass-input w-full rounded-2xl px-5 py-4 text-lg text-[#0f3d2e] cursor-pointer"
                value={form.mosquee_id}
                onChange={handleInputChange}
              >
                <option value="" disabled>Choisir une mosquée</option>
                {mosquees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} - {m.ville}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
                  <User size={16} className="text-[#c8a752]" /> Prénom
                </label>
                <input required name="prenom" value={form.prenom} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-md text-[#0f3d2e]" placeholder="Votre prénom" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
                  <User size={16} className="text-[#c8a752]" /> Nom
                </label>
                <input required name="nom" value={form.nom} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-md text-[#0f3d2e]" placeholder="Votre nom" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
                  <Phone size={16} className="text-[#c8a752]" /> Téléphone
                </label>
                <input required type="tel" name="telephone" value={form.telephone} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-md text-[#0f3d2e]" placeholder="06 12 34 56 78" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
                  <Mail size={16} className="text-[#c8a752]" /> Email
                </label>
                <input required type="email" name="email" value={form.email} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-md text-[#0f3d2e]" placeholder="votre@email.com" />
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c8a752]/30 to-transparent my-6"></div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#0f3d2e]">
                <FileText size={16} className="text-[#c8a752]" /> Nom pour le sacrifice
              </label>
              <input 
                required 
                name="nomSacrifice" 
                value={form.nomSacrifice} 
                onChange={handleInputChange} 
                className="glass-input w-full rounded-xl px-4 py-4 text-md text-[#0f3d2e] font-medium border-[#c8a752]/40" 
                placeholder="Nom de la personne (ex: Mohammed Ben Ali)" 
              />
              <p className="text-xs text-[#305547] opacity-80 mt-2">
                * Vous réservez 1 agneau. Pour commander plusieurs agneaux, veuillez répéter cette opération.
              </p>
            </div>

            <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-bold uppercase tracking-wide mt-4">
              Suivant <ChevronRight size={20} />
            </button>
          </form>
        )}

        {/* ================= ETAPE 2 : RECAPITULATIF ================= */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            
            <div className="bg-white/40 rounded-2xl p-6 border border-white/50 space-y-4">
              <h3 className="font-bold text-lg text-[#0f3d2e] border-b border-[#0f3d2e]/10 pb-3 mb-4">Récapitulatif de votre commande</h3>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#305547]">Client :</span>
                <span className="font-bold text-[#0f3d2e]">{form.prenom} {form.nom}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#305547]">Contact :</span>
                <span className="font-bold text-[#0f3d2e]">{form.telephone} / {form.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#305547]">Lieu de retrait :</span>
                <span className="font-bold text-[#0f3d2e] text-right">{selectedMosquee?.nom}<br/><span className="text-xs opacity-70">{selectedMosquee?.ville}</span></span>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-3 mt-3 border-t border-[#0f3d2e]/10">
                <span className="text-[#305547]">Sacrifice pour :</span>
                <span className="font-bold text-[#c8a752] text-base">{form.nomSacrifice}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#0f3d2e] to-[#164936] p-6 text-white shadow-xl flex items-center justify-between">
              <span className="text-lg opacity-80">Total à régler (1x)</span>
              <span className="text-3xl font-bold text-[#c8a752]">{UNIT_PRICE.toLocaleString('fr-FR')} €</span>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                disabled={loading}
                className="w-1/3 flex items-center justify-center gap-2 rounded-2xl bg-white/40 px-4 py-4 font-bold text-[#0f3d2e] hover:bg-white transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={18} /> Retour
              </button>

              <button
                onClick={checkout}
                disabled={loading}
                className="btn-primary flex-1 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-bold uppercase tracking-wide shadow-lg"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Sécurisation...</>
                ) : (
                  <><CheckCircle2 size={20} /> Payer {UNIT_PRICE} €</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}