'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  Mail,
  Lock,
  MapPin,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ShoppingBag,
  Phone,
  ShieldCheck,
  Check,
  ChevronRight,
  Package,
  Sparkles,
  LogOut,
  Ruler,
  Pencil,
  X
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FitPreferencesCard from '@/components/FitPreferencesCard'
import {
  useAuthStore,
  useFavoriteStore,
  useCartStore,
  useUIStore,
  usePreferencesStore,
  type UserAddress
} from '@/lib/store'
import { PRODUCTS, type Product } from '@/lib/constants'

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'info'

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences' | 'addresses' | 'favorites'>(
    (initialTab as any) || 'info'
  )

  // Auth store
  const user = useAuthStore((s) => s.user)
  const addresses = useAuthStore((s) => s.addresses)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const addAddress = useAuthStore((s) => s.addAddress)
  const deleteAddress = useAuthStore((s) => s.deleteAddress)
  const setDefaultAddress = useAuthStore((s) => s.setDefaultAddress)
  const logout = useAuthStore((s) => s.logout)

  // Preferences store
  const preferences = usePreferencesStore((s) => s.preferences)

  // Favorites store
  const favorites = useFavoriteStore((s) => s.favorites)
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite)

  // Cart & UI
  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)

  // Personal Info Form State
  const [name, setName] = useState(user?.name || 'Devon Vance')
  const [email, setEmail] = useState(user?.email || 'demo.member@teesgarage.in')
  const [phone, setPhone] = useState(user?.phone || '+91 98201 44521')
  const [infoSuccess, setInfoSuccess] = useState(false)
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // New Address Form State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)
  const [newAddrName, setNewAddrName] = useState('')
  const [newAddrPhone, setNewAddrPhone] = useState('')
  const [newAddrLine, setNewAddrLine] = useState('')
  const [newAddrCity, setNewAddrCity] = useState('')
  const [newAddrState, setNewAddrState] = useState('')
  const [newAddrPincode, setNewAddrPincode] = useState('')
  const [newAddrDefault, setNewAddrDefault] = useState(false)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void usePreferencesStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      if (user.phone) setPhone(user.phone)
    }
  }, [user])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['info', 'security', 'preferences', 'addresses', 'favorites'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    } else if (!tabParam) {
      setActiveTab('info')
    }
  }, [searchParams])

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!email.trim() || !email.includes('@')) return

    updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() })
    setInfoSuccess(true)
    setIsEditingInfo(false)
    showToast('Personal information updated')
    setTimeout(() => setInfoSuccess(false), 3000)
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSuccess(true)
    showToast('Password updated successfully')
    setTimeout(() => setPasswordSuccess(false), 4000)
  }

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAddrName.trim() || !newAddrLine.trim() || !newAddrPincode.trim()) {
      alert('Please fill out all required address fields.')
      return
    }

    addAddress({
      fullName: newAddrName.trim(),
      phone: newAddrPhone.trim() || '+91 98201 44521',
      addressLine: newAddrLine.trim(),
      city: newAddrCity.trim() || 'Mumbai',
      state: newAddrState.trim() || 'Maharashtra',
      pincode: newAddrPincode.trim(),
      isDefault: newAddrDefault
    })

    setNewAddrName('')
    setNewAddrPhone('')
    setNewAddrLine('')
    setNewAddrCity('')
    setNewAddrState('')
    setNewAddrPincode('')
    setNewAddrDefault(false)
    setShowAddAddressModal(false)
    showToast('Shipping address added')
  }

  const favoritedProducts: Product[] = PRODUCTS.filter((p) => favorites.includes(p.id))

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out from your account?')) {
      logout()
      router.push('/')
    }
  }

  return (
    <div className="apple-profile-page">
      <main className="apple-profile-container">
        {/* Breadcrumb Navigation */}
        <nav className="infit-breadcrumb-nav" aria-label="Breadcrumbs">
          <Link href="/" className="infit-breadcrumb-link">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="text-zinc-500">Account</span>
          <span>/</span>
          <span className="infit-breadcrumb-current">
            {activeTab === 'info' && 'Personal Information'}
            {activeTab === 'security' && 'Sign-In & Security'}
            {activeTab === 'preferences' && 'Fit & Size Preferences'}
            {activeTab === 'addresses' && 'Shipping Addresses'}
            {activeTab === 'favorites' && 'Saved Wishlist'}
          </span>
        </nav>

        {/* Mobile Horizontal Profile Identity Card */}
        <div className="lg:hidden apple-mobile-profile-card">
          <div className="apple-mobile-profile-main">
            <div className="apple-mobile-avatar">
              {(user?.name || name || 'D').charAt(0).toUpperCase()}
              <span className="apple-id-avatar-badge" title="Active member" />
            </div>
            <div className="apple-mobile-identity">
              <div className="apple-mobile-name-row">
                <h2 className="apple-mobile-name truncate">
                  {user?.name || name || 'Devon Vance'}
                </h2>
              </div>
              <p className="apple-mobile-email truncate" title={user?.email || email}>
                {user?.email || email || 'demo.member@teesgarage.in'}
              </p>
            </div>
          </div>

          <div className="apple-mobile-actions">
            <Link href="/orders" className="apple-mobile-btn-orders">
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Orders</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="apple-mobile-btn-signout"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Pills */}
        <div className="lg:hidden apple-sidebar-nav-mobile mb-4" role="tablist">
          <Link
            href="/profile"
            scroll={false}
            onClick={() => setActiveTab('info')}
            className={`apple-mobile-pill ${activeTab === 'info' ? 'active' : ''}`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Info</span>
          </Link>
          <Link
            href="/profile?tab=security"
            scroll={false}
            onClick={() => setActiveTab('security')}
            className={`apple-mobile-pill ${activeTab === 'security' ? 'active' : ''}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security</span>
          </Link>
          <Link
            href="/profile?tab=preferences"
            scroll={false}
            onClick={() => setActiveTab('preferences')}
            className={`apple-mobile-pill ${activeTab === 'preferences' ? 'active' : ''}`}
          >
            <Ruler className="w-3.5 h-3.5 text-indigo-500" />
            <span>Fit &amp; Size</span>
          </Link>
          <Link
            href="/profile?tab=addresses"
            scroll={false}
            onClick={() => setActiveTab('addresses')}
            className={`apple-mobile-pill ${activeTab === 'addresses' ? 'active' : ''}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Addresses ({addresses.length})</span>
          </Link>
          <Link
            href="/profile?tab=favorites"
            scroll={false}
            onClick={() => setActiveTab('favorites')}
            className={`apple-mobile-pill ${activeTab === 'favorites' ? 'active' : ''}`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Wishlist ({favorites.length})</span>
          </Link>
        </div>

        {/* Master-Detail Horizontal Split Layout */}
        <div className="apple-profile-layout">
          {/* Left Column: Apple Settings Sidebar */}
          <aside className="apple-profile-sidebar">
            <div className="apple-glass-card">
              {/* Apple ID Card Header */}
              <div className="apple-id-header">
                <div className="apple-id-avatar-row">
                  <div className="apple-id-avatar">
                    {(user?.name || name || 'D').charAt(0).toUpperCase()}
                    <span className="apple-id-avatar-badge" title="Active member" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="apple-id-name truncate">
                      {user?.name || name || 'Devon Vance'}
                    </h2>
                    <p className="apple-id-email" title={user?.email || email}>
                      {user?.email || email || 'demo.member@teesgarage.in'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Apple Inset Sidebar Navigation List (Hidden on mobile, prominent on desktop) */}
              <div className="hidden lg:flex apple-sidebar-nav" role="tablist">
                <Link
                  href="/profile"
                  scroll={false}
                  onClick={() => setActiveTab('info')}
                  className={`apple-nav-item ${activeTab === 'info' ? 'active' : ''}`}
                >
                  <div className="apple-nav-left">
                    <User className="apple-nav-icon" />
                    <span>Personal Info</span>
                  </div>
                  <div className="apple-nav-right">
                    <ChevronRight className="apple-nav-chevron" />
                  </div>
                </Link>

                <Link
                  href="/profile?tab=security"
                  scroll={false}
                  onClick={() => setActiveTab('security')}
                  className={`apple-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                >
                  <div className="apple-nav-left">
                    <ShieldCheck className="apple-nav-icon" />
                    <span>Sign-In &amp; Security</span>
                  </div>
                  <div className="apple-nav-right">
                    <ChevronRight className="apple-nav-chevron" />
                  </div>
                </Link>

                <Link
                  href="/profile?tab=preferences"
                  scroll={false}
                  onClick={() => setActiveTab('preferences')}
                  className={`apple-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
                >
                  <div className="apple-nav-left">
                    <Ruler className="apple-nav-icon text-indigo-500" />
                    <span>Fit &amp; Size Preferences</span>
                  </div>
                  <div className="apple-nav-right">
                    <span className="apple-nav-badge">{preferences.waistSize}&quot; / {preferences.topSize}</span>
                    <ChevronRight className="apple-nav-chevron" />
                  </div>
                </Link>

                <Link
                  href="/profile?tab=addresses"
                  scroll={false}
                  onClick={() => setActiveTab('addresses')}
                  className={`apple-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                >
                  <div className="apple-nav-left">
                    <MapPin className="apple-nav-icon" />
                    <span>Shipping Addresses</span>
                  </div>
                  <div className="apple-nav-right">
                    <span className="apple-nav-badge">{addresses.length}</span>
                    <ChevronRight className="apple-nav-chevron" />
                  </div>
                </Link>

                <Link
                  href="/profile?tab=favorites"
                  scroll={false}
                  onClick={() => setActiveTab('favorites')}
                  className={`apple-nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
                >
                  <div className="apple-nav-left">
                    <Heart className="apple-nav-icon text-rose-500" />
                    <span>Saved Wishlist</span>
                  </div>
                  <div className="apple-nav-right">
                    <span className="apple-nav-badge">{favorites.length}</span>
                    <ChevronRight className="apple-nav-chevron" />
                  </div>
                </Link>
              </div>

              {/* Sidebar Actions */}
              <div className="apple-sidebar-actions">
                <Link href="/orders" className="apple-btn-secondary">
                  <Package className="w-4 h-4 text-zinc-500" />
                  <span>My Orders &amp; Tracking</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="apple-btn-danger-ghost"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Column: Master Detail Canvas */}
          <section className="apple-profile-main">
            {/* Tab 1: Personal Information */}
            {activeTab === 'info' && (
              <div className="apple-detail-card">
                <div className="apple-card-header apple-card-header-split">
                  <div className="min-w-0 flex-1">
                    <h1 className="apple-card-title">Personal Information</h1>
                    <p className="apple-card-subtitle">
                      Manage your verified identity, display credentials, and primary dispatch contact details.
                    </p>
                  </div>

                  {!isEditingInfo ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(true)}
                      className="apple-edit-btn"
                      aria-label="Edit personal information"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingInfo(false)
                        if (user) {
                          setName(user.name)
                          setEmail(user.email)
                          if (user.phone) setPhone(user.phone)
                        }
                      }}
                      className="apple-edit-btn text-zinc-600 hover:text-black"
                      aria-label="Cancel editing"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                {infoSuccess && (
                  <div className="apple-status-toast">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Profile information saved securely to your account.</span>
                  </div>
                )}

                {!isEditingInfo ? (
                  /* ── Clean Display View Mode ── */
                  <div className="apple-info-display-container">
                    <div className="apple-info-display-grid">
                      <div className="apple-info-display-item">
                        <span className="apple-info-label">Full Name</span>
                        <div className="apple-info-value-row">
                          <User className="apple-info-icon" />
                          <span className="apple-info-value">{name}</span>
                        </div>
                      </div>

                      <div className="apple-info-display-item">
                        <span className="apple-info-label">Contact Phone</span>
                        <div className="apple-info-value-row">
                          <Phone className="apple-info-icon" />
                          <span className="apple-info-value">{phone || '+91 98201 44521'}</span>
                        </div>
                      </div>

                      <div className="apple-info-display-item">
                        <span className="apple-info-label">Email Address</span>
                        <div className="apple-info-value-row">
                          <Mail className="apple-info-icon" />
                          <span className="apple-info-value">{email}</span>
                        </div>
                      </div>

                      <div className="apple-info-display-item">
                        <span className="apple-info-label">Account Membership</span>
                        <div className="apple-info-value-row">
                          <ShieldCheck className="apple-info-icon text-emerald-600" />
                          <span className="apple-info-value">Verified Member</span>
                          <span className="text-[11px] font-mono text-zinc-500 ml-auto">ID #TG-2026</span>
                        </div>
                      </div>
                    </div>

                    {/* Apple Inset Grouped Callout */}
                    <div className="apple-grouped-box mt-3">
                      <div className="space-y-0.5">
                        <p className="font-ui text-xs font-semibold text-zinc-900">
                          Dispatch Notifications &amp; Order Alerts
                        </p>
                        <p className="font-ui text-[12px] text-zinc-500">
                          Your phone number receives live courier tracking updates via WhatsApp and SMS upon shipment.
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── Interactive Editable Form ── */
                  <form onSubmit={handleUpdateInfo} className="space-y-4">
                    {/* Horizontal 2-Column Form Row */}
                    <div className="apple-form-grid apple-form-grid-2col">
                      <div className="apple-input-wrapper">
                        <label className="apple-input-label">Full Name</label>
                        <div className="apple-input-shell">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Your full name"
                            className="apple-input"
                            autoFocus
                          />
                          <User className="apple-input-icon" />
                        </div>
                      </div>

                      <div className="apple-input-wrapper">
                        <label className="apple-input-label">Contact Phone</label>
                        <div className="apple-input-shell">
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98201 44521"
                            className="apple-input"
                          />
                          <Phone className="apple-input-icon" />
                        </div>
                      </div>
                    </div>

                    {/* Horizontal 2-Column Form Row for Email & Account Tier */}
                    <div className="apple-form-grid apple-form-grid-2col">
                      <div className="apple-input-wrapper">
                        <label className="apple-input-label">Email Address</label>
                        <div className="apple-input-shell">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@example.com"
                            className="apple-input"
                          />
                          <Mail className="apple-input-icon" />
                        </div>
                      </div>

                      <div className="apple-input-wrapper">
                        <label className="apple-input-label">Account Membership</label>
                        <div className="apple-grouped-box !py-2.5 !px-3.5 !rounded-[13px] border-[#e4e4e7] bg-[#fbfbfa]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-ui text-xs font-semibold text-zinc-900">
                              Verified Member
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">ID #TG-2026</span>
                        </div>
                      </div>
                    </div>

                    {/* Apple Inset Grouped Callout */}
                    <div className="apple-grouped-box">
                      <div className="space-y-0.5">
                        <p className="font-ui text-xs font-semibold text-zinc-900">
                          Dispatch Notifications &amp; Order Alerts
                        </p>
                        <p className="font-ui text-[12px] text-zinc-500">
                          Your phone number receives live courier tracking updates via WhatsApp and SMS upon shipment.
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingInfo(false)
                          if (user) {
                            setName(user.name)
                            setEmail(user.email)
                            if (user.phone) setPhone(user.phone)
                          }
                        }}
                        className="apple-btn-secondary !w-auto !h-10 !px-5 !text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="apple-btn-primary !w-auto !h-10 !px-5 !text-xs font-semibold">
                        <Check className="w-4 h-4 mr-1.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Tab 2: Sign-In & Security */}
            {activeTab === 'security' && (
              <div className="apple-detail-card">
                <div className="apple-card-header">
                  <h1 className="apple-card-title">Sign-In &amp; Security</h1>
                  <p className="apple-card-subtitle">
                    Keep your account secure with end-to-end credential verification and updated passkeys.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="apple-status-toast">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Your account password has been updated successfully.</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-800 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  {/* Current Password Field */}
                  <div className="apple-input-wrapper">
                    <label className="apple-input-label">Current Password</label>
                    <div className="apple-input-shell">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter current password"
                        className="apple-input !pr-11"
                      />
                      <Lock className="apple-input-icon" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="apple-input-action-btn"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Horizontal 2-Column Grid for New & Confirm Password */}
                  <div className="apple-form-grid apple-form-grid-2col">
                    <div className="apple-input-wrapper">
                      <label className="apple-input-label">New Password</label>
                      <div className="apple-input-shell">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="Min 8 characters"
                          className="apple-input"
                        />
                        <Lock className="apple-input-icon" />
                      </div>
                    </div>

                    <div className="apple-input-wrapper">
                      <label className="apple-input-label">Confirm New Password</label>
                      <div className="apple-input-shell">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Re-enter password"
                          className="apple-input"
                        />
                        <Lock className="apple-input-icon" />
                      </div>
                    </div>
                  </div>

                  {/* Apple Security Checkpoints */}
                  <div className="apple-grouped-box flex-col sm:flex-row items-start sm:items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-ui text-xs font-semibold text-zinc-900">
                          Password Security Criteria
                        </span>
                      </div>
                      <p className="font-ui text-[12px] text-zinc-500 leading-relaxed">
                        Use 8 or more characters combining uppercase letters, numbers, and symbols.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-400 self-end sm:self-center">
                      SHA-256 Encrypted
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button type="submit" className="apple-btn-primary">
                      <Check className="w-4 h-4" />
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Fit & Size Preferences */}
            {activeTab === 'preferences' && (
              <FitPreferencesCard />
            )}

            {/* Tab 3: Shipping Addresses */}
            {activeTab === 'addresses' && (
              <div className="apple-detail-card">
                <div className="apple-card-header apple-card-header-split">
                  <div>
                    <h1 className="apple-card-title">Saved Shipping Addresses</h1>
                    <p className="apple-card-subtitle">
                      Store addresses for instant 1-tap checkout and doorstep delivery.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(true)}
                    className="apple-btn-primary self-start sm:self-auto !h-10 !px-5 !text-xs mt-2 sm:mt-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Horizontal Card Grid for Addresses */}
                <div className="infit-address-grid">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`infit-address-card ${addr.isDefault ? 'default' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-brand font-bold text-zinc-900 text-sm m-0">
                            {addr.fullName}
                          </h3>
                          <p className="font-ui text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{addr.phone}</span>
                          </p>
                        </div>

                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white shadow-sm">
                            <Check className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(addr.id)}
                            className="font-ui text-xs font-semibold text-zinc-500 hover:text-black transition-colors bg-none border-none cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <p className="font-ui text-xs text-zinc-700 leading-relaxed mb-6">
                        {addr.addressLine}, {addr.city}, {addr.state} —{' '}
                        <strong className="text-zinc-900">{addr.pincode}</strong>
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-[#f4f4f2] text-xs">
                        <span className="font-ui text-zinc-400">India</span>
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this address?')) {
                                deleteAddress(addr.id)
                              }
                            }}
                            className="font-ui text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors bg-none border-none cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Address Apple Modal */}
                {showAddAddressModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="apple-glass-card max-w-lg w-full p-6 sm:p-8 shadow-2xl relative bg-white/95">
                      <div className="mb-5">
                        <h2 className="apple-card-title !text-lg">
                          Add New Shipping Address
                        </h2>
                        <p className="apple-card-subtitle !text-xs mt-1">
                          Enter recipient address for seamless doorstep order fulfillment.
                        </p>
                      </div>

                      <form onSubmit={handleSaveNewAddress} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="apple-input-wrapper">
                            <label className="apple-input-label">Recipient Name</label>
                            <input
                              type="text"
                              required
                              value={newAddrName}
                              onChange={(e) => setNewAddrName(e.target.value)}
                              placeholder="Full Name"
                              className="apple-input !h-10 !px-3.5 !text-xs"
                            />
                          </div>
                          <div className="apple-input-wrapper">
                            <label className="apple-input-label">Phone Number</label>
                            <input
                              type="tel"
                              required
                              value={newAddrPhone}
                              onChange={(e) => setNewAddrPhone(e.target.value)}
                              placeholder="+91 98201 44521"
                              className="apple-input !h-10 !px-3.5 !text-xs"
                            />
                          </div>
                        </div>

                        <div className="apple-input-wrapper">
                          <label className="apple-input-label">Street / Apartment / Locality</label>
                          <input
                            type="text"
                            required
                            value={newAddrLine}
                            onChange={(e) => setNewAddrLine(e.target.value)}
                            placeholder="House / Flat / Street address"
                            className="apple-input !h-10 !px-3.5 !text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="apple-input-wrapper">
                            <label className="apple-input-label">City</label>
                            <input
                              type="text"
                              required
                              value={newAddrCity}
                              onChange={(e) => setNewAddrCity(e.target.value)}
                              placeholder="City"
                              className="apple-input !h-10 !px-3.5 !text-xs"
                            />
                          </div>
                          <div className="apple-input-wrapper">
                            <label className="apple-input-label">State</label>
                            <input
                              type="text"
                              required
                              value={newAddrState}
                              onChange={(e) => setNewAddrState(e.target.value)}
                              placeholder="State"
                              className="apple-input !h-10 !px-3.5 !text-xs"
                            />
                          </div>
                          <div className="apple-input-wrapper">
                            <label className="apple-input-label">Pincode</label>
                            <input
                              type="text"
                              required
                              value={newAddrPincode}
                              onChange={(e) => setNewAddrPincode(e.target.value)}
                              placeholder="6 digits"
                              className="apple-input !h-10 !px-3.5 !text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="set-default"
                            checked={newAddrDefault}
                            onChange={(e) => setNewAddrDefault(e.target.checked)}
                            className="rounded border-zinc-300 text-black focus:ring-black"
                          />
                          <label htmlFor="set-default" className="font-ui text-xs text-zinc-700 font-medium cursor-pointer">
                            Set as primary default delivery destination
                          </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                          <button
                            type="button"
                            onClick={() => setShowAddAddressModal(false)}
                            className="apple-btn-secondary !w-auto !py-2 !px-4 !text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="apple-btn-primary !h-9 !py-0 !px-5 !text-xs"
                          >
                            Save Address
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Saved Wishlist */}
            {activeTab === 'favorites' && (
              <div className="apple-detail-card">
                <div className="apple-card-header">
                  <div className="wishlist-header-split">
                    <div>
                      <h1 className="apple-card-title">Saved Wishlist</h1>
                      <p className="apple-card-subtitle">
                        {favoritedProducts.length === 0
                          ? 'Bookmark denim fits to compare and shop later.'
                          : `${favoritedProducts.length} saved item${favoritedProducts.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    {favoritedProducts.length > 0 && (
                      <Link href="/shop" className="wishlist-add-more-btn">
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Add More</span>
                      </Link>
                    )}
                  </div>
                </div>

                {favoritedProducts.length === 0 ? (
                  <div className="wishlist-empty-state">
                    <div className="wishlist-empty-icon">
                      <Heart className="w-8 h-8 text-zinc-300 stroke-[1.5]" />
                    </div>
                    <h2 className="wishlist-empty-title">Your wishlist is empty</h2>
                    <p className="wishlist-empty-body">
                      Tap the heart on any product to save it here for easy comparison and fast checkout.
                    </p>
                    <Link href="/shop" className="apple-btn-primary" style={{ display: 'inline-flex' }}>
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>Browse Collection</span>
                    </Link>
                  </div>
                ) : (
                  <div className="wishlist-list">
                    {favoritedProducts.map((product) => (
                      <div key={product.id} className="wishlist-row">
                        {/* Fixed portrait image */}
                        <Link
                          href={`/product/${product.id}`}
                          className="wishlist-row-img-wrap"
                          aria-label={`View ${product.name}`}
                        >
                          <Image
                            src={product.img}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 88px, 112px"
                            className="object-cover"
                          />
                        </Link>

                        {/* Detail column */}
                        <div className="wishlist-row-body">
                          <div className="wishlist-row-meta">
                            <span className="wishlist-row-category">{product.fit || 'Denim'}</span>
                            <Link href={`/product/${product.id}`} className="wishlist-row-name">
                              {product.name}
                            </Link>
                            <span className="wishlist-row-price">{product.price}</span>
                          </div>

                          <div className="wishlist-row-actions">
                            <button
                              type="button"
                              className="wishlist-btn-add"
                              onClick={() => {
                                const recSize = usePreferencesStore.getState().getRecommendedSize(product.sizes || ['32'], product.category)
                                addItem(product.id, recSize)
                                showToast(`Added ${product.name} (Size ${recSize}) to bag`)
                                openOverlay('cart')
                              }}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                              <span>Move to Bag</span>
                            </button>
                            <button
                              type="button"
                              className="wishlist-btn-remove"
                              title="Remove from wishlist"
                              onClick={() => toggleFavorite(product.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="wishlist-btn-remove-label">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f6]">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
