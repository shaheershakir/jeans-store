'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  Camera,
  Pencil,
  Eye,
  EyeOff,
  Mail,
  Tag,
  Download,
  Shield,
  Trash2,
  ChevronRight,
  X
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/lib/store'

export default function SettingsContent() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)
  const showToast = useUIStore((s) => s.showToast)

  // Profile details state matching mock exactly
  const [fullName, setFullName] = useState(user?.name || 'Shaheer')
  const [email, setEmail] = useState(user?.email || 'shaheer@example.com')
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210')
  const memberSince = 'Oct 2024'

  // Edit details modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState(fullName)
  const [editEmail, setEditEmail] = useState(email)
  const [editPhone, setEditPhone] = useState(phone)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // Notification Toggles matching mock (Order & Promotions ON, Wishlist OFF)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [promotionsOffers, setPromotionsOffers] = useState(true)
  const [wishlistAlerts, setWishlistAlerts] = useState(false)

  // Privacy Dialog
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (user) {
      if (user.name && user.name !== 'Sameer Joshi') {
        setFullName(user.name)
        setEditName(user.name)
      }
      if (user.email && user.email !== 'sameer.joshi@example.com') {
        setEmail(user.email)
        setEditEmail(user.email)
      }
      if (user.phone) {
        setPhone(user.phone)
        setEditPhone(user.phone)
      }
    }
  }, [user])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setFullName(editName)
    setEmail(editEmail)
    setPhone(editPhone)
    updateProfile({ name: editName, email: editEmail, phone: editPhone })
    showToast('Personal details updated successfully')
    setIsEditModalOpen(false)
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      alert('Please enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showToast('Password updated successfully')
  }

  const handleDownloadData = () => {
    const data = {
      user: { name: fullName, email, phone, memberSince },
      exportDate: new Date().toISOString(),
      platform: 'TEESGARAGE E-Commerce'
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teesgarage-account-data-${fullName.toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Account data downloaded')
  }

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action is permanent and cannot be undone.'
      )
    ) {
      logout()
      window.location.href = '/'
    }
  }

  const handleChangePhoto = () => {
    showToast('Upload photo dialog')
  }

  return (
    <>
      {/* Header */}
            <header className="mb-7">
              <h1 className="text-[32px] md:text-[36px] font-extrabold tracking-[-0.03em] text-[#111111] leading-tight">
                Account Settings
              </h1>
              <p className="mt-1 text-[15px] text-[#666666]">
                Manage your account details, preferences and security.
              </p>
            </header>

            {/* Top Profile Avatar Card */}
            <div className="rounded-[18px] bg-white border border-black/8 px-6 py-5.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-5 max-[640px]:flex-col max-[640px]:items-start">
              <div className="flex items-center gap-5">
                {/* 1:1 Circular Profile Avatar with Camera badge */}
                <div className="relative w-[90px] h-[90px] shrink-0">
                  <Image
                    src="/mock-assets/settings-avatar-mock.png"
                    alt={fullName}
                    fill
                    sizes="90px"
                    className="object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleChangePhoto}
                    className="absolute inset-0 w-full h-full rounded-full cursor-pointer opacity-0"
                    aria-label="Change profile photo"
                    title="Change profile photo"
                  />
                </div>

                {/* Identity Info */}
                <div className="min-w-0">
                  <h2 className="text-[19px] font-extrabold text-[#111111] tracking-[-0.02em] leading-snug">
                    {fullName}
                  </h2>
                  <p className="text-[13px] text-[#555555] mt-0.5 font-normal">
                    {email}
                  </p>
                  <p className="text-[13px] text-[#555555] font-normal leading-snug">
                    {phone}
                  </p>
                  <p className="text-[12px] text-[#888888] mt-1.5 font-normal">
                    Member since {memberSince}
                  </p>
                </div>
              </div>

              {/* Change Photo Outline Button */}
              <button
                type="button"
                onClick={handleChangePhoto}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] text-[12px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs shrink-0 self-start sm:self-center"
              >
                <Camera className="w-3.5 h-3.5 stroke-[1.8]" />
                <span>Change Photo</span>
              </button>
            </div>

            {/* 2-Column Grid: Personal Information & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mt-4.5">
              {/* Card 1: Personal Information */}
              <div className="rounded-[18px] bg-white border border-black/8 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between pb-4">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#111111] tracking-tight">
                        Personal Information
                      </h3>
                      <p className="text-[12px] text-[#777777] mt-0.5">
                        Update your personal details.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[7px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] text-[12px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs shrink-0"
                    >
                      <Pencil className="w-3 h-3 stroke-[2]" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="space-y-0 text-[13px]">
                    <div className="grid grid-cols-[125px_1fr] items-center py-2.5 border-b border-black/5">
                      <span className="text-[#666666] font-normal">Full name</span>
                      <span className="font-semibold text-[#111111]">{fullName}</span>
                    </div>

                    <div className="grid grid-cols-[125px_1fr] items-center py-2.5 border-b border-black/5">
                      <span className="text-[#666666] font-normal">Email address</span>
                      <span className="font-semibold text-[#111111] truncate">{email}</span>
                    </div>

                    <div className="grid grid-cols-[125px_1fr] items-center py-2.5">
                      <span className="text-[#666666] font-normal">Phone number</span>
                      <span className="font-semibold text-[#111111]">{phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Password */}
              <div className="rounded-[18px] bg-white border border-black/8 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="pb-3.5">
                    <h3 className="text-[16px] font-bold text-[#111111] tracking-tight">
                      Password
                    </h3>
                    <p className="text-[12px] text-[#777777] mt-0.5">
                      Keep your account secure.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-2.5">
                    {/* Current password */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-2 max-[500px]:grid-cols-1">
                      <label className="text-[12.5px] text-[#666666] font-normal">
                        Current password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full h-8.5 px-3 pr-8 rounded-[8px] border border-black/15 text-[12.5px] text-[#111] placeholder:text-[#888888] focus:outline-hidden focus:border-black bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#111] cursor-pointer"
                        >
                          {showCurrentPass ? (
                            <EyeOff className="w-3.5 h-3.5 stroke-[1.8]" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 stroke-[1.8]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-2 max-[500px]:grid-cols-1">
                      <label className="text-[12.5px] text-[#666666] font-normal">
                        New password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full h-8.5 px-3 pr-8 rounded-[8px] border border-black/15 text-[12.5px] text-[#111] placeholder:text-[#888888] focus:outline-hidden focus:border-black bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#111] cursor-pointer"
                        >
                          {showNewPass ? (
                            <EyeOff className="w-3.5 h-3.5 stroke-[1.8]" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 stroke-[1.8]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div className="grid grid-cols-[140px_1fr] items-center gap-2 max-[500px]:grid-cols-1">
                      <label className="text-[12.5px] text-[#666666] font-normal">
                        Confirm new password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full h-8.5 px-3 pr-8 rounded-[8px] border border-black/15 text-[12.5px] text-[#111] placeholder:text-[#888888] focus:outline-hidden focus:border-black bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#111] cursor-pointer"
                        >
                          {showConfirmPass ? (
                            <EyeOff className="w-3.5 h-3.5 stroke-[1.8]" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 stroke-[1.8]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-1.5 flex justify-end">
                      <button
                        type="submit"
                        className="py-2 px-4 rounded-[8px] bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* 2-Column Grid: Notification Preferences & Privacy & Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mt-4.5">
              {/* Card 3: Notification Preferences */}
              <div className="rounded-[18px] bg-white border border-black/8 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="pb-3.5">
                    <h3 className="text-[16px] font-bold text-[#111111] tracking-tight">
                      Notification Preferences
                    </h3>
                    <p className="text-[12px] text-[#777777] mt-0.5">
                      Choose what you want to be notified about.
                    </p>
                  </div>

                  <div className="space-y-0">
                    {/* Item 1: Order updates */}
                    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-black/5">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Mail className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                        <div>
                          <h4 className="text-[13px] font-bold text-[#111111] leading-tight">
                            Order updates
                          </h4>
                          <p className="text-[11.5px] text-[#777777] mt-0.5">
                            Get notified about order status, shipping and delivery.
                          </p>
                        </div>
                      </div>

                      {/* 1:1 Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          setOrderUpdates(!orderUpdates)
                          showToast(`Order updates ${!orderUpdates ? 'enabled' : 'disabled'}`)
                        }}
                        className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          orderUpdates ? 'bg-[#141414]' : 'bg-[#e5e5e5]'
                        }`}
                        role="switch"
                        aria-checked={orderUpdates}
                      >
                        <span
                          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            orderUpdates ? 'translate-x-[20px]' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Item 2: Promotions & offers */}
                    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-black/5">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Tag className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                        <div>
                          <h4 className="text-[13px] font-bold text-[#111111] leading-tight">
                            Promotions &amp; offers
                          </h4>
                          <p className="text-[11.5px] text-[#777777] mt-0.5">
                            Receive exclusive deals and new arrivals.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPromotionsOffers(!promotionsOffers)
                          showToast(`Promotions & offers ${!promotionsOffers ? 'enabled' : 'disabled'}`)
                        }}
                        className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          promotionsOffers ? 'bg-[#141414]' : 'bg-[#e5e5e5]'
                        }`}
                        role="switch"
                        aria-checked={promotionsOffers}
                      >
                        <span
                          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            promotionsOffers ? 'translate-x-[20px]' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Item 3: Wishlist alerts */}
                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Heart className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                        <div>
                          <h4 className="text-[13px] font-bold text-[#111111] leading-tight">
                            Wishlist alerts
                          </h4>
                          <p className="text-[11.5px] text-[#777777] mt-0.5">
                            Get notified when wishlist items are on sale.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setWishlistAlerts(!wishlistAlerts)
                          showToast(`Wishlist alerts ${!wishlistAlerts ? 'enabled' : 'disabled'}`)
                        }}
                        className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          wishlistAlerts ? 'bg-[#141414]' : 'bg-[#e5e5e5]'
                        }`}
                        role="switch"
                        aria-checked={wishlistAlerts}
                      >
                        <span
                          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            wishlistAlerts ? 'translate-x-[20px]' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Privacy & Data */}
              <div className="rounded-[18px] bg-white border border-black/8 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="pb-3.5">
                    <h3 className="text-[16px] font-bold text-[#111111] tracking-tight">
                      Privacy &amp; Data
                    </h3>
                    <p className="text-[12px] text-[#777777] mt-0.5">
                      Manage your data and account preferences.
                    </p>
                  </div>

                  <div className="rounded-[12px] border border-black/8 overflow-hidden divide-y divide-black/6">
                    {/* Row 1: Download your data */}
                    <button
                      type="button"
                      onClick={handleDownloadData}
                      className="w-full flex items-center justify-between p-3 hover:bg-black/2 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Download className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-[#111111] leading-tight">
                            Download your data
                          </h4>
                          <p className="text-[11px] text-[#777777] mt-0.5 leading-snug">
                            Get a copy of your account data, including orders and profile information.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#888888] shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Row 2: Manage privacy preferences */}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="w-full flex items-center justify-between p-3 hover:bg-black/2 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Shield className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-[#111111] leading-tight">
                            Manage privacy preferences
                          </h4>
                          <p className="text-[11px] text-[#777777] mt-0.5 leading-snug">
                            Control how your data is used and stored.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#888888] shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  {/* Row 3: Delete account (Separate pink card with thin red border) */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="w-full flex items-center justify-between p-3 rounded-[12px] border border-[#fbd3d3] bg-[#fff5f5] hover:bg-[#ffebeb] transition-all duration-150 text-left group cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Trash2 className="w-5 h-5 text-[#d93838] shrink-0 mt-0.5 stroke-[1.8]" />
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold text-[#d93838] leading-tight">
                            Delete account
                          </h4>
                          <p className="text-[11px] text-[#e05252] mt-0.5 leading-snug">
                            Permanently delete your account and all associated data.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#d93838] shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>


      {/* ── Edit Personal Details Modal ────────────────────────────── */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <h3 className="text-[18px] font-extrabold text-[#111111]">
                Edit Personal Information
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="py-4 space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#333333] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-[10px] border border-black/15 text-[14px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#333333] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 rounded-[10px] border border-black/15 text-[14px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#333333] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[10px] border border-black/15 text-[14px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="pt-3 border-t border-black/8 flex justify-end gap-2.5">
                <button
                  type="button"
                  className="py-2.5 px-4 rounded-[10px] bg-white border border-black/15 text-[#111] text-[13px] font-semibold hover:bg-black/4 cursor-pointer"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Privacy Preferences Modal ──────────────────────────────── */}
      {isPrivacyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <h3 className="text-[18px] font-extrabold text-[#111111]">
                Privacy Preferences
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => setIsPrivacyModalOpen(false)}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-[13.5px]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#111]">Analytics &amp; Usage</h4>
                  <p className="text-[12px] text-[#666]">Help us improve storefront performance.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded-xs accent-black cursor-pointer" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#111]">Personalized Recommendations</h4>
                  <p className="text-[12px] text-[#666]">Tailor fits and style recommendations to your tastes.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded-xs accent-black cursor-pointer" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#111]">Cookie Tracking</h4>
                  <p className="text-[12px] text-[#666]">Remember your bag items and filter preferences across sessions.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded-xs accent-black cursor-pointer" />
              </div>
            </div>

            <div className="pt-3 border-t border-black/8 flex justify-end">
              <button
                type="button"
                className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer shadow-xs"
                onClick={() => {
                  setIsPrivacyModalOpen(false)
                  showToast('Privacy preferences updated')
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
