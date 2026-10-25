'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Check
} from 'lucide-react'
import { useAuthStore, useUIStore, type UserAddress } from '@/lib/store'

// ─── Initial Mock Addresses Matching Design 1:1 ──────────────────────────────

interface AddressItem {
  id: string
  name: string
  lines: string[]
  phone: string
  isDefault: boolean
}

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: 'addr_1',
    name: 'Shaheer',
    lines: [
      '12 Lake View Road',
      'Indiranagar',
      'Bengaluru, Karnataka 560001',
      'India'
    ],
    phone: '+91 98765 43210',
    isDefault: true,
  },
  {
    id: 'addr_2',
    name: 'Muhammed Shaheer',
    lines: [
      'Door No. 4/123',
      'Kallai Road, Near City Tower',
      'Kannur, Kerala 670002',
      'India'
    ],
    phone: '+91 98765 43210',
    isDefault: false,
  },
  {
    id: 'addr_3',
    name: 'Shaheer S',
    lines: [
      'PG 27, 3rd Cross, 7th Main',
      'BTM Layout 2nd Stage',
      'Bengaluru, Karnataka 560076',
      'India'
    ],
    phone: '+91 98765 43210',
    isDefault: false,
  },
  {
    id: 'addr_4',
    name: 'Work',
    lines: [
      'Teesgarage Office',
      'Indiranagar 100 Feet Road',
      'Bengaluru, Karnataka 560038',
      'India'
    ],
    phone: '+91 98765 43210',
    isDefault: false,
  },
]

export default function AddressesContent() {
  const [addressList, setAddressList] = useState<AddressItem[]>(INITIAL_ADDRESSES)
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Form State
  const [formName, setFormName] = useState('')
  const [formLine1, setFormLine1] = useState('')
  const [formLine2, setFormLine2] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('')
  const [formPincode, setFormPincode] = useState('')
  const [formPhone, setFormPhone] = useState('+91 98765 43210')
  const [formIsDefault, setFormIsDefault] = useState(false)

  const router = useRouter()
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

  const handleSetDefault = (id: string) => {
    setAddressList((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    )
    showToast('Default delivery address updated')
  }

  const handleDeleteAddress = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete address for "${name}"?`)) {
      setAddressList((prev) => {
        const filtered = prev.filter((addr) => addr.id !== id)
        if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
          filtered[0].isDefault = true
        }
        return filtered
      })
      showToast('Address removed')
    }
  }

  const openAddModal = () => {
    setFormName('')
    setFormLine1('')
    setFormLine2('')
    setFormCity('Bengaluru')
    setFormState('Karnataka')
    setFormPincode('560001')
    setFormPhone('+91 98765 43210')
    setFormIsDefault(addressList.length === 0)
    setIsAddModalOpen(true)
  }

  const openEditModal = (addr: AddressItem) => {
    setEditingAddress(addr)
    setFormName(addr.name)
    setFormLine1(addr.lines[0] || '')
    setFormLine2(addr.lines[1] || '')
    // Parse city, state, pin if line 2 or 3 has it
    const line3 = addr.lines[2] || ''
    const pinMatch = line3.match(/(\d{6})/)
    setFormPincode(pinMatch ? pinMatch[1] : '560001')
    setFormCity(line3.includes('Bengaluru') ? 'Bengaluru' : line3.includes('Kannur') ? 'Kannur' : 'Bengaluru')
    setFormState(line3.includes('Kerala') ? 'Kerala' : 'Karnataka')
    setFormPhone(addr.phone)
    setFormIsDefault(addr.isDefault)
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formLine1.trim() || !formPincode.trim()) {
      alert('Please fill out all required fields.')
      return
    }

    const compiledLines = [
      formLine1.trim(),
      formLine2.trim() ? formLine2.trim() : null,
      `${formCity.trim()}, ${formState.trim()} ${formPincode.trim()}`,
      'India'
    ].filter(Boolean) as string[]

    if (editingAddress) {
      setAddressList((prev) =>
        prev.map((item) => {
          if (item.id === editingAddress.id) {
            return {
              ...item,
              name: formName.trim(),
              lines: compiledLines,
              phone: formPhone.trim(),
              isDefault: formIsDefault ? true : item.isDefault,
            }
          }
          return formIsDefault ? { ...item, isDefault: false } : item
        })
      )
      showToast('Address updated successfully')
      setEditingAddress(null)
    } else {
      const newId = `addr_${Date.now()}`
      const newItem: AddressItem = {
        id: newId,
        name: formName.trim(),
        lines: compiledLines,
        phone: formPhone.trim(),
        isDefault: formIsDefault || addressList.length === 0,
      }
      setAddressList((prev) => {
        const existing = formIsDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev
        return [newItem, ...existing]
      })
      showToast('New delivery address added')
      setIsAddModalOpen(false)
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

            {/* Address Cards Stack */}
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
                          <p className="mt-2 text-[14px] font-medium text-[#444444]">
                            {addr.phone}
                          </p>
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
                  className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer shadow-xs"
                >
                  {editingAddress ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
