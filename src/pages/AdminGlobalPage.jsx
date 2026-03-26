import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, MapPin, Phone, User, X, Building2, Loader2, Hash,
  ShoppingBag, Calendar, CheckCircle2, Clock, XCircle, Pencil, ShieldCheck
} from 'lucide-react'

const TAB_ITEMS = [
  { id: 'mosquees', label: 'Mosquées' },
  { id: 'commandes', label: 'Toutes les commandes' }
]

export function AdminGlobalPage() {
  const [activeTab, setActiveTab] = useState('mosquees')
  const [mosquees, setMosquees] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  
  // États Modal Mosquée
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMosqueeId, setEditingMosqueeId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  
  // États pour l'assignation de l'admin
  const [adminEmail, setAdminEmail] = useState('')
  const [adminAssignMessage, setAdminAssignMessage] = useState({ text: '', type: '' })

  const [form, setForm] = useState({
    nom: '', ville: '', adresse: '', code_postal: '', telephone: '', admin_email: '', responsable: '', capacite_stock: 0, horaires_reception: '', horaires_retrait: ''
  })

  const fetchDashboardData = async () => {
    setLoading(true)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const openCreateModal = () => {
    setForm({ nom: '', ville: '', adresse: '', code_postal: '', telephone: '', admin_email: '', responsable: '', capacite_stock: 0, horaires_reception: '', horaires_retrait: '' })
    setEditingMosqueeId(null)
    setErrorMessage('')
    setAdminAssignMessage({ text: '', type: '' })
    setAdminEmail('')
    setIsModalOpen(true)
  }

  const openEditModal = (m) => {
    setForm({
      nom: m.nom || '', ville: m.ville || '', adresse: m.adresse || '', code_postal: m.code_postal || '', 
      telephone: m.telephone || '', admin_email: m.admin_email || '', responsable: m.responsable || '', 
      capacite_stock: m.capacite_stock || 0, horaires_reception: m.horaires_reception || '', horaires_retrait: m.horaires_retrait || ''
    })
    setEditingMosqueeId(m.id)
    setErrorMessage('')
    setAdminAssignMessage({ text: '', type: '' })
    setAdminEmail(m.admin_email || '')
    setIsModalOpen(true)
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
      if (editingMosqueeId) {
        const { error } = await supabase.from('mosquees').update(payload).eq('id', editingMosqueeId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('mosquees').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      await fetchDashboardData()
    } catch (err) {
      setErrorMessage(err.message || "Erreur lors de la sauvegarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignAdmin = async () => {
    if (!adminEmail) return
    setAdminAssignMessage({ text: 'Recherche...', type: 'info' })
    
    // 1. Trouver l'utilisateur par email
    const { data: user, error: findError } = await supabase.from('users').select('id').eq('email', adminEmail).single()
    
    if (findError || !user) {
      setAdminAssignMessage({ text: "Utilisateur introuvable. Il doit d'abord se créer un compte.", type: 'error' })
      return
    }

    // 2. Mettre à jour son rôle et son ID de mosquée
    const { error: updateError } = await supabase.from('users')
      .update({ role: 'admin_mosquee', mosquee_id: editingMosqueeId })
      .eq('id', user.id)

    // 3. Mettre à jour l'email de contact dans la table mosquees
    await supabase.from('mosquees').update({ admin_email: adminEmail }).eq('id', editingMosqueeId)

    if (updateError) {
      setAdminAssignMessage({ text: "Erreur lors de l'assignation.", type: 'error' })
    } else {
      setAdminAssignMessage({ text: "Administrateur assigné avec succès !", type: 'success' })
      fetchDashboardData()
    }
  }

  // --- Fonctions utilitaires de rendu inchangées (renderPaiementBadge, renderLivraisonBadge) ---
  const renderPaiementBadge = (statut) => { /* ... (gardez votre code existant pour les badges) ... */
     return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border">{statut}</span>
  }
  const renderLivraisonBadge = (statut) => { /* ... (gardez votre code existant pour les badges) ... */
     return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border">{statut}</span>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="glass-panel flex flex-col gap-6 rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="title-gradient text-3xl font-bold mb-2">Dashboard Admin Global</h1>
            <p className="text-[#305547] text-sm font-medium opacity-80">Vue d'ensemble de la campagne 2026.</p>
          </div>
          {activeTab === 'mosquees' && (
            <button onClick={openCreateModal} className="btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold shadow-lg">
              <Plus size={20} className="transition-transform group-hover:rotate-90" /> Nouvelle Mosquée
            </button>
          )}
        </div>

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
          {activeTab === 'mosquees' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              {mosquees.length === 0 ? (
                <div className="col-span-full glass-panel rounded-3xl p-12 text-center text-[#0f3d2e]/60">Aucune mosquée enregistrée.</div>
              ) : (
                mosquees.map((m) => (
                  <div key={m.id} className="glass-panel group relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl">
                    <button 
                      onClick={() => openEditModal(m)} 
                      className="absolute right-4 top-4 p-2 bg-white/50 hover:bg-white rounded-xl text-[#0f3d2e] transition z-20"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
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
                        <p className="flex items-center gap-3"><User size={14} className="opacity-40" /> {m.admin_email || 'Pas d\'admin'}</p>
                        <p className="flex items-center gap-3"><Phone size={14} className="opacity-40" /> {m.telephone || '-'}</p>
                        <p className="flex items-center gap-3"><Hash size={14} className="opacity-40" /> Stock max : {m.capacite_stock || 0}</p>
                        {m.horaires_reception && (
                          <p className="flex items-center gap-3"><Clock size={14} className="opacity-40" /> Réception: {m.horaires_reception}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'commandes' && (
             <div className="glass-panel rounded-3xl p-12 text-center text-[#0f3d2e]/60">
                 {/* ... (gardez votre code d'affichage des commandes) ... */}
                 Commandes...
             </div>
          )}
        </>
      )}

      {/* MODAL CRÉATION / ÉDITION MOSQUÉE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-[#0f3d2e]/10">
          <div className="glass-panel w-full max-w-2xl relative animate-in zoom-in-95 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-8 top-8 text-[#0f3d2e]/40 hover:text-[#0f3d2e]">
              <X size={24} />
            </button>
            <h2 className="title-gradient text-2xl font-bold text-center mb-8">
              {editingMosqueeId ? 'Modifier la Mosquée' : 'Ajouter une Mosquée'}
            </h2>
            
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
                <input name="horaires_reception" value={form.horaires_reception} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Horaires de Réception (ex: 08h-10h)" />
                <input name="horaires_retrait" value={form.horaires_retrait} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Horaires de Retrait Client" />
              </div>
              <input name="telephone" value={form.telephone} onChange={handleInputChange} className="glass-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Téléphone de contact" />
              
              {errorMessage && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-xl">{errorMessage}</div>}
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/3 rounded-xl bg-white/20 py-4 font-bold text-[#0f3d2e] hover:bg-white">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 rounded-xl py-4 font-bold disabled:opacity-50">
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>

            {/* SECTION: ASSIGNER UN ADMIN (Uniquement en mode édition) */}
            {editingMosqueeId && (
              <div className="mt-8 pt-8 border-t border-[#0f3d2e]/10">
                <h3 className="text-lg font-bold text-[#0f3d2e] mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#c8a752]" />
                  Gestion de l'Administrateur
                </h3>
                <p className="text-xs text-[#305547] mb-4">
                  L'utilisateur doit déjà avoir créé un compte sur l'application avec cet email. Cela lui donnera les droits d'accès à l'interface "Admin Mosquée".
                </p>
                <div className="flex gap-3">
                  <input 
                    type="email" 
                    value={adminEmail} 
                    onChange={(e) => setAdminEmail(e.target.value)} 
                    className="glass-input flex-1 rounded-xl px-4 py-3 text-sm" 
                    placeholder="Email du compte utilisateur" 
                  />
                  <button 
                    onClick={handleAssignAdmin}
                    type="button"
                    className="bg-[#0f3d2e] text-[#c8a752] px-4 py-3 rounded-xl font-bold text-sm hover:bg-[#164936] transition"
                  >
                    Assigner
                  </button>
                </div>
                {adminAssignMessage.text && (
                  <div className={`mt-3 text-sm font-medium p-3 rounded-xl ${adminAssignMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {adminAssignMessage.text}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}