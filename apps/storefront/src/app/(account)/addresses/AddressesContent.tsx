'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/lib/store'

interface AddressItem {
  id: string
  name: string
  label?: string
  line1?: string
  line2?: string
  landmark?: string
  city?: string
  state?: string
  pincode?: string
  lines: string[]
  phone: string
  isDefault: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

export default function AddressesContent() {
  const [addressList, setAddressList] = useState<AddressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formName, setFormName] = useState('')
  const [formLine1, setFormLine1] = useState('')
  const [formLine2, setFormLine2] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('')
  const [formPincode, setFormPincode] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)

  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [mounted, setMounted] = useState(false)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login?redirect=/addresses')
    }
  }, [mounted, isAuthenticated, router])

  const loadAddresses = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = (await res.json()) as { addresses?: AddressItem[] }
        if (Array.isArray(data.addresses)) {
          setAddressList(data.addresses)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      void loadAddresses()
    }
  }, [mounted, isAuthenticated, token, loadAddresses])

  const handleSetDefault = async (id: string) => {
    setAddressList((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    )
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/addresses/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isDefault: true })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          showToast(err.error || 'Failed to update default address')
          void loadAddresses()
          return
        }
      } catch {
        showToast('Failed to update default address')
        void loadAddresses()
        return
      }
    }
    showToast('Default delivery address updated')
  }

  const handleDeleteAddress = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete address for "${name}"?`)) return

    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/addresses/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          showToast(err.error || 'Failed to delete address')
          return
        }
      } catch {
        showToast('Failed to delete address')
        return
      }
    }

    setAddressList((prev) => {
      const filtered = prev.filter((addr) => addr.id !== id)
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true
      }
      return filtered
    })
    showToast('Address removed')
    void loadAddresses()
  }

  const openAddModal = () => {
    setFormName(user?.name || '')
    setFormLine1('')
    setFormLine2('')
    setFormCity('Bengaluru')
    setFormState('Karnataka')
    setFormPincode('560001')
    setFormPhone(user?.phone || '+91 98765 43210')
    setFormIsDefault(addressList.length === 0)
    setIsAddModalOpen(true)
  }

  const openEditModal = (addr: AddressItem) => {
    setEditingAddress(addr)
    setFormName(addr.name)
    setFormLine1(addr.line1 || addr.lines[0] || '')
    setFormLine2(addr.line2 || addr.lines[1] || '')
    setFormCity(addr.city || 'Bengaluru')
    setFormState(addr.state || 'Karnataka')
    setFormPincode(addr.pincode || '560001')
    setFormPhone(addr.phone)
    setFormIsDefault(addr.isDefault)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formLine1.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
      alert('Please fill out all required fields.')
      return
    }

    const payload = {
      name: formName.trim(),
      line1: formLine1.trim(),
      line2: formLine2.trim() || undefined,
      city: formCity.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      phone: formPhone.trim(),
      isDefault: formIsDefault || addressList.length === 0
    }

    setSaving(true)
    try {
      if (editingAddress) {
        if (token) {
          const res = await fetch(`${API_BASE}/api/auth/addresses/${editingAddress.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            showToast(err.error || 'Failed to update address')
            return
          }
        }
        showToast('Address updated successfully')
        setEditingAddress(null)
      } else {
        if (token) {
          const res = await fetch(`${API_BASE}/api/auth/addresses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            showToast(err.error || 'Failed to add address')
            return
          }
        }
        showToast('New delivery address added')
        setIsAddModalOpen(false)
      }
      void loadAddresses()
    } catch {
      showToast('Network error saving address')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Header Row: Title, Subtitle & Add New Address Button */}
      <header className="mb-7 flex items-start justify-between gap-4 max-[640px]:flex-col">
        <div>
          <h1 className="text-[32px] md:text-[36px] font-extrabold tracking-[-0.03em] text-[#111111] leading-tight">
            My Addresses
          </h1>
          <p className="mt-1 text-[15px] text-[#666666]">
            Manage your saved addresses for a faster checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[11px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs shrink-0 self-start max-[640px]:self-auto max-[640px]:w-full max-[640px]:justify-center"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span>Add New Address</span>
        </button>
      </header>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[20px] p-6 lg:p-7 bg-white border border-black/8 animate-pulse space-y-3"
            >
              <div className="h-5 w-40 bg-neutral-200 rounded-md" />
              <div className="h-4 w-72 bg-neutral-100 rounded-md" />
              <div className="h-4 w-52 bg-neutral-100 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && addressList.length === 0 && (
        <div className="rounded-[20px] bg-white border border-black/8 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-black/6 flex items-center justify-center mb-4 text-[#666]">
            <MapPin className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#111111]">No saved addresses</h3>
          <p className="mt-1.5 text-[14px] text-[#666666] max-w-sm">
            Add a delivery address to speed up your checkout process.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-[11px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Add Address</span>
          </button>
        </div>
      )}

      {/* Address Cards Stack */}
      {!loading && addressList.length > 0 && (
        <div className="space-y-4">
          {addressList.map((addr) => {
            return (
              <article
                key={addr.id}
                className={`rounded-[20px] p-6 lg:p-7 transition-all duration-200 border ${
                  addr.isDefault
                    ? 'bg-[#f0f9f2] border-[#b6e4c4] shadow-[0_2px_12px_rgba(30,131,58,0.04)]'
                    : 'bg-white border-black/8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-black/15'
                }`}
              >
                <div className="flex items-start justify-between gap-6 max-[640px]:flex-col">
                  {/* Left: Radio/Selector Button + Details */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    {/* Custom Radio Button */}
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="mt-1 flex items-center justify-center shrink-0 cursor-pointer focus:outline-hidden"
                      aria-label={
                        addr.isDefault
                          ? `${addr.name} is the default address`
                          : `Set ${addr.name} as default address`
                      }
                      title={addr.isDefault ? 'Default address' : 'Click to set as default'}
                    >
                      {addr.isDefault ? (
                        <div className="w-[26px] h-[26px] rounded-full border-[2.2px] border-[#1e833a] bg-white flex items-center justify-center">
                          <div className="w-[13px] h-[13px] rounded-full bg-[#1e833a]" />
                        </div>
                      ) : (
                        <div className="w-[26px] h-[26px] rounded-full border-[2px] border-[#556987]/40 hover:border-[#111111] bg-white transition-colors" />
                      )}
                    </button>

                    {/* Address Text Content */}
                    <div className="flex flex-col min-w-0">
                      {/* Name + Default Badge */}
                      <div className="flex items-center gap-3">
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#d8f0de] text-[#1e833a]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1e833a]" />
                            Default
                          </span>
                        )}
                        <h2 className="text-[17px] font-bold text-[#111111] tracking-tight">
                          {addr.name}
                        </h2>
                      </div>

                      {/* Address Multi-line Description */}
                      <div className="mt-2 text-[14px] text-[#555555] leading-relaxed">
                        {addr.lines.map((line, idx) => (
                          <p key={idx} className="leading-snug">{line}</p>
                        ))}
                      </div>

                      {/* Contact Phone */}
                      {addr.phone && (
                        <p className="mt-2 text-[14px] font-medium text-[#444444]">
                          {addr.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0 max-[640px]:self-end">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="flex flex-col items-center justify-center w-[46px] h-[46px] rounded-[12px] border border-black/12 bg-white hover:bg-black/3 hover:border-black/25 text-[#222222] transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
                      aria-label={`Edit address for ${addr.name}`}
                      title="Edit address"
                    >
                      <Pencil className="w-4 h-4 stroke-[1.8]" />
                      <span className="text-[10px] font-semibold mt-0.5">Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id, addr.name)}
                      className="flex flex-col items-center justify-center w-[46px] h-[46px] rounded-[12px] border border-black/12 bg-white hover:bg-rose-50 hover:border-rose-200 text-[#444444] hover:text-rose-600 transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
                      aria-label={`Delete address for ${addr.name}`}
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                      <span className="text-[10px] font-semibold mt-0.5">Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Add / Edit Address Modal ───────────────────────────────── */}
      {(isAddModalOpen || editingAddress) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <h3 className="text-[18px] font-extrabold text-[#111111]">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingAddress(null)
                }}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="py-4 space-y-3.5">
              <div>
                <label className="block text-[12px] font-bold text-[#333333] mb-1">
                  Recipient Name / Label
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Shaheer, Work, Home"
                  required
                  className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#333333] mb-1">
                  Flat / House No. / Street
                </label>
                <input
                  type="text"
                  value={formLine1}
                  onChange={(e) => setFormLine1(e.target.value)}
                  placeholder="e.g. 12 Lake View Road"
                  required
                  className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#333333] mb-1">
                  Area / Locality / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formLine2}
                  onChange={(e) => setFormLine2(e.target.value)}
                  placeholder="e.g. Indiranagar, Near Metro Station"
                  className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#333333] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#333333] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#333333] mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#333333] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="defaultAddrCheck"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-black/20 text-[#111] focus:ring-black cursor-pointer"
                />
                <label
                  htmlFor="defaultAddrCheck"
                  className="text-[13px] font-medium text-[#222222] cursor-pointer"
                >
                  Set as default delivery address
                </label>
              </div>

              <div className="pt-3 border-t border-black/8 flex justify-end gap-2.5">
                <button
                  type="button"
                  className="py-2.5 px-4 rounded-[10px] bg-white border border-black/15 text-[#111] text-[13px] font-semibold hover:bg-black/4 cursor-pointer"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setEditingAddress(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingAddress ? 'Save Changes' : 'Save Address'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
