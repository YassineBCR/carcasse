import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const TAB_ITEMS = [
  { id: 'mosquees', label: 'Mosquees' },
  { id: 'commandes', label: 'Toutes les commandes' },
  { id: 'en_cours', label: 'Commandes en cours' },
  { id: 'sms', label: 'SMS marketing' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'stock', label: 'Stock' },
]

const withTimeout = (promise, timeoutMs = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout reseau: verification Supabase necessaire.')), timeoutMs)
    }),
  ])

export function AdminGlobalPage() {
  const [activeTab, setActiveTab] = useState('mosquees')
  const [users, setUsers] = useState([])
  const [mosquees, setMosquees] = useState([])
  const [reservations, setReservations] = useState([])
  const [isCreatingMosquee, setIsCreatingMosquee] = useState(false)
  const [isMosqueeModalOpen, setIsMosqueeModalOpen] = useState(false)
  const [editingMosqueeId, setEditingMosqueeId] = useState(null)
  const [mosqueeError, setMosqueeError] = useState('')
  const [mosqueeSuccess, setMosqueeSuccess] = useState('')
  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    code_postal: '',
    telephone: '',
    admin_email: '',
    capacite_stock: 0,
  })
  const [smsDraft, setSmsDraft] = useState('Aid Moubarak ! Pensez a valider vos commandes en cours.')

  useEffect(() => {
    supabase.from('users').select('id,email,role,mosquee_id').then(({ data }) => setUsers(data ?? []))
    supabase
      .from('reservations')
      .select(
        'id,created_at,prix_total,quantite,statut_paiement,statut_livraison,mosquee_id,code_retrait,users(email),mosquees(nom,ville)',
      )
      .then(({ data }) => setReservations(data ?? []))
    supabase
      .from('mosquees')
      .select('id,nom,adresse,ville,capacite_stock')
      .order('created_at', { ascending: false })
      .then(({ data }) => setMosquees(data ?? []))
  }, [])

  const stats = useMemo(() => {
    const paid = reservations.filter((r) => r.statut_paiement === 'paye')
    return {
      ca: paid.reduce((sum, r) => sum + Number(r.prix_total), 0),
      agneaux: paid.reduce((sum, r) => sum + Number(r.quantite), 0),
      echecs: reservations.filter((r) => r.statut_paiement === 'echoue').length,
    }
  }, [reservations])

  const createMosquee = async (event) => {
    event.preventDefault()
    setMosqueeError('')
    setMosqueeSuccess('')
    setIsCreatingMosquee(true)

    if (!form.nom.trim() || !form.adresse.trim() || !form.ville.trim()) {
      setMosqueeError('Nom, adresse et ville sont obligatoires.')
      setIsCreatingMosquee(false)
      return
    }

    try {
      const payload = {
        nom: form.nom.trim(),
        adresse: form.adresse.trim(),
        ville: form.ville.trim(),
        code_postal: form.code_postal.trim(),
        telephone: form.telephone.trim(),
        admin_email: form.admin_email.trim().toLowerCase(),
        capacite_stock: Number.isFinite(Number(form.capacite_stock)) ? Number(form.capacite_stock) : 0,
      }

      let error = null
      if (editingMosqueeId) {
        const result = await withTimeout(supabase.from('mosquees').update(payload).eq('id', editingMosqueeId))
        error = result.error
      } else {
        const result = await withTimeout(supabase.from('mosquees').insert(payload))
        error = result.error
      }

      // Fallback when optional columns are missing in DB.
      if (error?.message?.includes('column')) {
        const payloadFallback = {
          nom: payload.nom,
          adresse: payload.adresse,
          ville: payload.ville,
          capacite_stock: payload.capacite_stock,
        }
        if (editingMosqueeId) {
          const result = await withTimeout(
            supabase.from('mosquees').update(payloadFallback).eq('id', editingMosqueeId),
          )
          error = result.error
        } else {
          const result = await withTimeout(supabase.from('mosquees').insert(payloadFallback))
          error = result.error
        }
      }

      if (error) {
        setMosqueeError(error.message)
        return
      }

      const { data: refreshed, error: refreshError } = await withTimeout(
        supabase.from('mosquees').select('id,nom,adresse,ville,capacite_stock').order('created_at', { ascending: false }),
      )

      if (!refreshError) {
        setMosquees(refreshed ?? [])
      }

      setForm({
        nom: '',
        adresse: '',
        ville: '',
        code_postal: '',
        telephone: '',
        admin_email: '',
        capacite_stock: 0,
      })
      setEditingMosqueeId(null)
      setIsMosqueeModalOpen(false)
      setMosqueeSuccess(editingMosqueeId ? 'Mosquee modifiee avec succes.' : 'Mosquee creee avec succes.')
    } catch (err) {
      setMosqueeError(err.message ?? 'Erreur lors de la creation de la mosquee.')
    } finally {
      setIsCreatingMosquee(false)
    }
  }

  const openCreateMosqueeModal = () => {
    setMosqueeError('')
    setMosqueeSuccess('')
    setEditingMosqueeId(null)
    setForm({
      nom: '',
      adresse: '',
      ville: '',
      code_postal: '',
      telephone: '',
      admin_email: '',
      capacite_stock: 0,
    })
    setIsMosqueeModalOpen(true)
  }

  const openEditMosqueeModal = (mosquee) => {
    setMosqueeError('')
    setMosqueeSuccess('')
    setEditingMosqueeId(mosquee.id)
    setForm({
      nom: mosquee.nom ?? '',
      adresse: mosquee.adresse ?? '',
      ville: mosquee.ville ?? '',
      code_postal: mosquee.code_postal ?? '',
      telephone: mosquee.telephone ?? '',
      admin_email: mosquee.admin_email ?? '',
      capacite_stock: Number(mosquee.capacite_stock) || 0,
    })
    setIsMosqueeModalOpen(true)
  }

  const inProgressReservations = useMemo(() => {
    return reservations.filter(
      (r) => r.statut_paiement !== 'echoue' && r.statut_livraison !== 'remis' && r.statut_livraison !== 'annulee',
    )
  }, [reservations])

  const stockByMosquee = useMemo(() => {
    return mosquees.map((m) => {
      const sold = reservations
        .filter((r) => r.mosquee_id === m.id && r.statut_paiement === 'paye')
        .reduce((sum, r) => sum + Number(r.quantite), 0)
      const capacity = Number(m.capacite_stock) || 0
      return {
        ...m,
        sold,
        remaining: Math.max(0, capacity - sold),
      }
    })
  }, [mosquees, reservations])

  const renderReservations = (items) => {
    if (!items.length) {
      return (
        <p className="rounded-2xl border border-[#d7ceb9] bg-white/70 px-4 py-3 text-sm text-[#305547]">
          Aucune commande pour le moment.
        </p>
      )
    }

    return (
      <div className="space-y-2">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[#d7ceb9] bg-white/70 p-3">
            <p className="font-medium text-[#0f3d2e]">{r.users?.email ?? 'Client'}</p>
            <p className="text-sm text-[#305547]">
              {r.mosquees?.nom ?? 'Mosquee'} - {r.mosquees?.ville ?? 'N/A'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">Qte: {r.quantite}</span>
              <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">Paiement: {r.statut_paiement}</span>
              <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">Livraison: {r.statut_livraison ?? 'en_attente'}</span>
              <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">
                Total: {Number(r.prix_total).toLocaleString('fr-FR')} EUR
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="admin-shell space-y-4">
      <h1 className="title-gradient text-3xl">Dashboard admin global</h1>
      <div className="tabs-surface rounded-3xl p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'tab-chip tab-chip-active'
                  : 'tab-chip'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'mosquees' && (
        <>
          {mosqueeError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{mosqueeError}</p>}
          {mosqueeSuccess && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-[#0f3d2e]">{mosqueeSuccess}</p>
          )}

          <div className="flat-surface rounded-3xl p-5">
            <h2 className="mb-4 text-2xl text-[#0f3d2e]">Mosquees</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={openCreateMosqueeModal}
                className="add-card group flex min-h-[180px] flex-col items-center justify-center rounded-2xl p-4 text-center transition hover:-translate-y-1 hover:shadow-md sm:min-h-[210px]"
              >
                <span className="add-plus text-5xl leading-none text-[#c8a752]">+</span>
                <span className="mt-2 text-sm font-semibold text-[#0f3d2e]">Ajouter une mosquee</span>
              </button>
              {mosquees.map((m) => (
                <div key={m.id} className="mosquee-card rounded-2xl p-4 text-sm">
                  <p className="break-words font-medium text-[#0f3d2e]">{m.nom}</p>
                  <p className="break-words text-[#305547]">
                    {m.adresse} - {m.ville} {m.code_postal ?? ''}
                  </p>
                  <p className="break-words text-[#305547]">Telephone: {m.telephone ?? '-'}</p>
                  <p className="break-words text-[#305547]">Email admin: {m.admin_email ?? '-'}</p>
                  <p className="text-[#305547]">Capacite stock: {m.capacite_stock ?? 0}</p>
                  <button
                    type="button"
                    onClick={() => openEditMosqueeModal(m)}
                    className="mt-3 rounded-xl border border-[#0f3d2e]/20 bg-white px-3 py-2 text-xs font-semibold text-[#0f3d2e] transition hover:bg-[#f7f2e7]"
                  >
                    Modifier
                  </button>
                </div>
              ))}
            </div>
          </div>

          {isMosqueeModalOpen && (
            <div className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
              <div className="modal-panel w-full max-w-xl rounded-3xl p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="pr-2 text-lg font-semibold text-[#0f3d2e] sm:text-xl">
                    {editingMosqueeId ? 'Modifier la mosquee' : 'Ajouter une mosquee'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMosqueeModalOpen(false)}
                    className="rounded-lg border border-[#d7ceb9] bg-white px-3 py-1.5 text-sm"
                  >
                    Fermer
                  </button>
                </div>

                <form onSubmit={createMosquee} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1 sm:max-h-[78vh]">
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    placeholder="Nom de la mosquee"
                    value={form.nom}
                    onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                  />
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    placeholder="Adresse"
                    value={form.adresse}
                    onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
                  />
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    placeholder="Ville"
                    value={form.ville}
                    onChange={(e) => setForm((p) => ({ ...p, ville: e.target.value }))}
                  />
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    placeholder="Code postal"
                    value={form.code_postal}
                    onChange={(e) => setForm((p) => ({ ...p, code_postal: e.target.value }))}
                  />
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    type="tel"
                    placeholder="Numero telephone"
                    value={form.telephone}
                    onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                  />
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    type="email"
                    placeholder="Adresse email admin"
                    value={form.admin_email}
                    onChange={(e) => setForm((p) => ({ ...p, admin_email: e.target.value }))}
                  />
                  <input
                    className="flat-input w-full rounded-xl px-4 py-3"
                    type="number"
                    placeholder="Capacite"
                    value={form.capacite_stock}
                    onChange={(e) => setForm((p) => ({ ...p, capacite_stock: Number(e.target.value) }))}
                  />
                  <button
                    type="submit"
                    disabled={isCreatingMosquee}
                    className="w-full rounded-xl bg-[#0f3d2e] px-4 py-3 font-medium text-[#f7f2e7] transition hover:bg-[#164936] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingMosquee
                      ? 'Creation en cours...'
                      : editingMosqueeId
                        ? 'Enregistrer les modifications'
                        : 'Creer'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'commandes' && <div className="glass rounded-3xl p-5">{renderReservations(reservations)}</div>}

      {activeTab === 'en_cours' && <div className="glass rounded-3xl p-5">{renderReservations(inProgressReservations)}</div>}

      {activeTab === 'sms' && (
        <div className="glass space-y-4 rounded-3xl p-5">
          <h2 className="text-2xl text-[#0f3d2e]">SMS marketing</h2>
          <p className="text-sm text-[#305547]">
            Cible estimee: {users.filter((u) => u.role === 'client').length} clients. Cette section prepare le message avant branchement API SMS.
          </p>
          <textarea
            className="w-full rounded-xl border border-[#d7ceb9] bg-white/80 p-3 outline-none transition focus:border-[#c8a752]"
            rows={5}
            value={smsDraft}
            onChange={(e) => setSmsDraft(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-[#c8a752] px-4 py-2.5 font-medium text-[#112f24] transition hover:bg-[#b89542]"
          >
            Envoyer la campagne (bientot)
          </button>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-[#305547]">Chiffre d&apos;affaires</p>
            <p className="mt-1 text-2xl font-semibold">{stats.ca.toLocaleString('fr-FR')} EUR</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-[#305547]">Agneaux vendus</p>
            <p className="mt-1 text-2xl font-semibold">{stats.agneaux}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-[#305547]">Paiements echoues</p>
            <p className="mt-1 text-2xl font-semibold">{stats.echecs}</p>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="glass rounded-3xl p-5">
          <h2 className="mb-2 text-2xl text-[#0f3d2e]">Stock par mosquee</h2>
          <div className="space-y-2">
            {stockByMosquee.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#d7ceb9] bg-white/70 p-3">
                <p className="font-medium text-[#0f3d2e]">{item.nom}</p>
                <p className="text-sm text-[#305547]">{item.ville}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">Capacite: {item.capacite_stock ?? 0}</span>
                  <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">Vendus: {item.sold}</span>
                  <span className="rounded-full border border-[#d7ceb9] bg-white px-2 py-1">Restant: {item.remaining}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
