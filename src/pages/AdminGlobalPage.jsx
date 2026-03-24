import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, MapPin, Phone, User, X, Building2, MoreVertical, Loader2, AlertCircle, Hash,
  ShoppingBag, Calendar, CheckCircle2, Clock, XCircle
} from 'lucide-react'

// Onglets de navigation
const TAB_ITEMS = [
  { id: 'mosquees', label: 'Mosquées' },
  { id: 'commandes', label: 'Toutes les commandes' }
  // Tu pourras réactiver les autres onglets plus tard :
  // { id: 'en_cours', label: 'En cours' },
  // { id: 'sms', label: 'SMS' },
  // { id: 'stats', label: 'Statistiques' },
]

export function AdminGlobalPage() {
  const [activeTab, setActiveTab] = useState('mosquees')
  const [mosquees, setMosquees] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  
  // États Modal Mosquée
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState({
    nom: '', ville: '', adresse: '', code_postal: '', telephone: '', admin_email: '', responsable: '', capacite_stock: 0
  })

  // Charger toutes les données du dashboard
  const fetchDashboardData = async () => {
    setLoading(true)
    
    // On lance les deux requêtes en parallèle pour aller plus vite
    const [resMosquees, resReservations] = await Promise.all([
      supabase.from('mosquees').select('*').order('created_at', { ascending: false }),
      supabase.from('reservations')
        .select('id, created_at, prix_total, quantite, statut_paiement, statut_livraison, code_retrait, users(email), mosquees(nom, ville)')
        .order('created_at', { ascending: false })
    ])
    
    if (resMosquees.data) setMosquees(resMosquees.data)
    if (resReservations.data) setReservations(resReservations.data)
      
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Gérer le formulaire de création de mosquée
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitMosquee = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        const trimmed = typeof value === 'string' ? value.trim() : value
        return [key, trimmed === '' ? null : trimmed]
      })
    )
    payload.capacite_stock = parseInt(payload.capacite_stock) || 0

    try {
      const { error } = await supabase.from('mosquees').insert([payload])
      if (!error) {
        setIsModalOpen(false)
        setForm({ nom: '', ville: '', adresse: '', code_postal: '', telephone: '', admin_email: '', responsable: '', capacite_stock: 0 })
        await fetchDashboardData()
      } else {
        throw error
      }
    } catch (err) {
      setErrorMessage(err.message || "Erreur de création.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fonction utilitaire pour le rendu des badges de statut
  const renderPaiementBadge = (statut) => {
    const styles = {
      paye: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      en_attente: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      echoue: "bg-red-500/10 text-red-700 border-red-500/20",
      rembourse: "bg-gray-500/10 text-gray-700 border-gray-500/20"
    }
    const icons = {
      paye: <CheckCircle2 size={14} />,
      en_attente: <Clock size={14} />,
      echoue: <XCircle size={14} />,
      rembourse: <XCircle size={14} />
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[statut] || styles.en_attente}`}>
        {icons[statut]} {statut.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const renderLivraisonBadge = (statut) => {
    const styles = {
      remis: "bg-[#0f3d2e]/10 text-[#0f3d2e] border-[#0f3d2e]/20",
      pret: "bg-[#c8a752]/20 text-[#8a7224] border-[#c8a752]/30",
      non_prepare: "bg-gray-100 text-gray-500 border-gray-200",
      annule: "bg-red-50 text-red-600 border-red-100"
    }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${styles[statut] || styles.non_prepare}`}>
        Livraison: {statut.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER & TABS */}
      <div className="glass-panel flex flex-col gap-6 rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="title-gradient text-3xl font-bold mb-2">Dashboard Admin Global</h1>
            <p className="text-[#305547] text-sm font-medium opacity-80">Vue d'ensemble de la campagne 2026.</p>
          </div>
          
          {/* Bouton d'action principal dynamique selon l'onglet */}
          {activeTab === 'mosquees' && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold shadow-lg">
              <Plus size={20} className="transition-transform group-hover:rotate-90" /> Nouvelle Mosquée
            </button>
          )}
        </div>

        {/* Navigation Tabs (Glassmorphism) */}
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar border-t border-white/20 pt-6">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-[#0f3d2e] text-[#c8a752] shadow-lg shadow-[#0f3d2e]/20'
                  : 'bg-white/40 text-[#0f3d2e]/70 hover:bg-white hover:text-[#0f3d2e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#c8a752]" />
          <p className="text-[#0f3d2e] font-medium italic">Chargement des données...</p>
        </div>
      ) : (
        <>
          {/* ================= ONGLET : MOSQUÉES ================= */}
          {activeTab === 'mosquees' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              {mosquees.length === 0 ? (
                <div className="col-span-full glass-panel rounded-3xl p-12 text-center text-[#0f3d2e]/60">Aucune mosquée enregistrée.</div>
              ) : (
                mosquees.map((m) => (
                  <div key={m.id} className="glass-panel group relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-[#c8a752]/10 blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f3d2e] text-[#c8a752] mb-5">
                        <Building2 size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-[#0f3d2e] mb-1 truncate">{m.nom}</h3>
                      <div className="flex items-center gap-1.5 text-[#c8a752] text-xs font-bold mb-4 uppercase">
                        <MapPin size={12} /> {m.ville}
                      </div>
                      <div className="space-y-2.5 pt-4 border-t border-[#0f3d2e]/5 text-sm text-[#305547]">
                        <p className="flex items-center gap-3"><User size={14} className="opacity-40" /> {m.responsable || 'Non défini'}</p>
                        <p className="flex items-center gap-3"><Phone size={14} className="opacity-40" /> {m.telephone || '-'}</p>
                        <p className="flex items-center gap-3"><Hash size={14} className="opacity-40" /> Stock max : {m.capacite_stock || 0}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ================= ONGLET : COMMANDES ================= */}
          {activeTab === 'commandes' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {reservations.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center text-[#0f3d2e]/60">
                  <ShoppingBag className="mx-auto h-12 w-12 text-[#0f3d2e]/20 mb-4" />
                  Aucune commande pour le moment.
                </div>
              ) : (
                reservations.map((r) => (
                  <div key={r.id} className="glass-panel flex flex-col xl:flex-row xl:items-center justify-between gap-5 rounded-[1.5rem] p-5 transition-all hover:shadow-lg hover:border-white">
                    
                    {/* Infos Client & Mosquée */}
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#c8a752]/20 text-[#b89542]">
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-[#0f3d2e]">{r.users?.email || 'Client inconnu'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-[#305547]">
                          <span className="flex items-center gap-1.5 font-medium"><MapPin size={14} className="text-[#c8a752]" /> {r.mosquees?.nom} - {r.mosquees?.ville}</span>
                          <span className="flex items-center gap-1.5 opacity-60"><Calendar size={14} /> {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Infos Prix, Quantité et Badges de statut */}
                    <div className="flex flex-wrap items-center gap-3 xl:justify-end border-t xl:border-none border-[#0f3d2e]/10 pt-4 xl:pt-0">
                      <span className="px-4 py-2 rounded-xl bg-white text-[#0f3d2e] font-bold text-sm shadow-sm">
                        {r.quantite} Agneau{r.quantite > 1 ? 'x' : ''}
                      </span>
                      <span className="px-4 py-2 rounded-xl bg-[#0f3d2e] text-[#c8a752] font-black text-sm shadow-sm">
                        {r.prix_total} €
                      </span>
                      
                      <div className="w-px h-8 bg-black/10 hidden sm:block mx-2"></div>
                      
                      {renderPaiementBadge(r.statut_paiement)}
                      {renderLivraisonBadge(r.statut_livraison)}
                    </div>

                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ================= MODAL CRÉATION MOSQUÉE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-[#0f3d2e]/10">
          <div className="glass-panel w-full max-w-xl relative animate-in zoom-in-95 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-8 top-8 text-[#0f3d2e]/40 hover:text-[#0f3d2e]">
              <X size={24} />
            </button>
            <h2 className="title-gradient text-2xl font-bold text-center mb-8">Ajouter une Mosquée</h2>
            <form onSubmit={handleSubmitMosquee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required name="nom" value={form.nom} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Nom de la structure *" />
                <input required name="ville" value={form.ville} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Ville *" />
              </div>
              <input name="adresse" value={form.adresse} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Adresse complète" />
              <div className="grid grid-cols-2 gap-4">
                <input name="code_postal" value={form.code_postal} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Code Postal" />
                <input type="number" name="capacite_stock" value={form.capacite_stock} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Capacité (Stock)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="responsable" value={form.responsable} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Nom du responsable" />
                <input name="telephone" value={form.telephone} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Téléphone" />
              </div>
              <input name="admin_email" type="email" value={form.admin_email} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Email Contact" />
              
              {errorMessage && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-xl">{errorMessage}</div>}
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/3 rounded-xl bg-white/20 py-4 font-bold text-[#0f3d2e] hover:bg-white">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 rounded-xl py-4 font-bold disabled:opacity-50">
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}