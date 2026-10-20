'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  Truck,
  User,
  Pencil,
  Plus,
  ArrowRight,
  X
} from 'lucide-react'
import { useCartStore, useUIStore, useAuthStore, useFavoriteStore } from '@/lib/store'

// ─── Sidebar Navigation Links ────────────────────────────────────────────────

const ACCOUNT_NAV_LINKS = [
  { label: 'My Account', href: '/profile', Icon: User, id: 'account' },
  { label: 'Orders', href: '/orders', Icon: Package, id: 'orders' },
  { label: 'Wishlist', href: '/wishlist', Icon: Heart, id: 'wishlist' },
  { label: 'Addresses', href: '/addresses', Icon: MapPin, id: 'addresses' },
  { label: 'Payment Methods', href: '/profile?tab=payment', Icon: CreditCard, id: 'payment' },
  { label: 'Account Settings', href: '/profile?tab=settings', Icon: Settings, id: 'settings' },
]

// ─── Mock Recent Orders for Profile Overview ─────────────────────────────────

interface ProfileRecentOrder {
  orderId: string
  date: string
  status: 'Delivered' | 'Shipped'
  productName: string
  variant: string
  price: string
  deliveryStatus: string
  deliverySubtext: string
  deliveryIcon: 'package' | 'truck'
  thumbnail: string
  primaryAction: {
    label: string
    variant: 'solid'
    actionType: 'buy-again' | 'track'
  }
}

const PROFILE_RECENT_ORDERS: ProfileRecentOrder[] = [
  {
    orderId: 'TG128450',
    date: '12 Oct 2026',
    status: 'Delivered',
    productName: 'Vintage Skate Micro-Stripe Tee',
    variant: 'Washed Black / Ash  •  L  •  1 × ₹1,249',
    price: '₹1,249',
    deliveryStatus: 'Delivered on 15 Oct 2026',
    deliverySubtext: 'Your order has been delivered.',
    deliveryIcon: 'package',
    thumbnail: '/mock-assets/product-vintage-skate-clean.jpg',
    primaryAction: { label: 'Buy Again', variant: 'solid', actionType: 'buy-again' },
  },
  {
    orderId: 'TG128312',
    date: '05 Oct 2026',
    status: 'Shipped',
    productName: 'Doodle Archive Oversized Tee',
    variant: 'Off White  •  XL  •  1 × ₹1,099',
    price: '₹1,099',
    deliveryStatus: 'Shipped on 07 Oct 2026',
    deliverySubtext: 'Arriving by 10 Oct 2026',
    deliveryIcon: 'truck',
    thumbnail: '/mock-assets/product-doodle-archive-clean.jpg',
    primaryAction: { label: 'Track Order', variant: 'solid', actionType: 'track' },
  },
]

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const addresses = useAuthStore((s) => s.addresses)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const addAddress = useAuthStore((s) => s.addAddress)
  const logout = useAuthStore((s) => s.logout)
  const favorites = useFavoriteStore((s) => s.favorites)
  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)

  // Profile details state with fallback matching the mockup
  const [fullName, setFullName] = useState(user?.name || 'Shaheer')
  const [email, setEmail] = useState(user?.email || 'shaheer@example.com')
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210')
  const memberSince = '2025'

  // Edit Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false)
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ProfileRecentOrder | null>(null)

  // Address state
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
  const [addressData, setAddressData] = useState({
    name: defaultAddr?.fullName || 'Shaheer',
    line: defaultAddr?.addressLine || '12 Lake View Road',
    cityStatePin: `${defaultAddr?.city || 'Bengaluru'}, ${defaultAddr?.state || 'Karnataka'} ${defaultAddr?.pincode || '560001'}`,
    country: 'India',
  })

  // Address form inputs for Add/Edit
  const [addrForm, setAddrForm] = useState({
    fullName: addressData.name,
    addressLine: addressData.line,
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    phone: phone,
  })

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (user) {
      if (user.name && user.name !== 'Sameer Joshi') setFullName(user.name)
      if (user.email && user.email !== 'sameer.joshi@example.com') setEmail(user.email)
      if (user.phone) setPhone(user.phone)
    }
  }, [user])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ name: fullName, email, phone })
    showToast('Profile updated successfully')
    setIsEditProfileOpen(false)
    setIsEditDetailsOpen(false)
  }

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    setAddressData({
      name: addrForm.fullName,
      line: addrForm.addressLine,
      cityStatePin: `${addrForm.city}, ${addrForm.state} ${addrForm.pincode}`,
      country: 'India',
    })
    addAddress({
      fullName: addrForm.fullName,
      addressLine: addrForm.addressLine,
      city: addrForm.city,
      state: addrForm.state,
      pincode: addrForm.pincode,
      phone: addrForm.phone || phone,
      isDefault: true,
    })
    showToast('Address updated successfully')
    setIsEditAddressOpen(false)
    setIsAddAddressOpen(false)
  }

  const handleBuyAgain = (productName: string) => {
    addItem(101, 'L')
    showToast(`Added ${productName} to bag`)
    openOverlay('cart')
  }

  const handleTrackOrder = (orderId: string) => {
    const whatsappNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'
    window.open(
      `https://wa.me/${whatsappNum}?text=${encodeURIComponent(`Hi TEESGARAGE, please share tracking status for order #${orderId}.`)}`,
      '_blank'
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-black selection:text-white">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8 py-10 max-[768px]:py-6">
        <div className="flex gap-10 lg:gap-14 max-[860px]:flex-col">
          {/* ── Left Sidebar Navigation ─────────────────────────────── */}
          <aside className="w-[220px] shrink-0 max-[860px]:w-full" aria-label="Account Navigation">
            <nav className="flex flex-col gap-1 sticky top-[96px] max-[860px]:static max-[860px]:flex-row max-[860px]:overflow-x-auto max-[860px]:pb-3 max-[860px]:border-b max-[860px]:border-black/8 scrollbar-none">
              {ACCOUNT_NAV_LINKS.map(({ label, href, Icon, id }) => {
                const isActive = id === 'account'
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-[12px] text-[13.5px] transition-colors whitespace-nowrap ${
                      isActive
                        ? 'font-bold text-[#111111] bg-[#e8e6e1]'
                        : 'font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0 stroke-[1.8]" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                )
              })}

              <div className="my-3.5 h-px bg-black/8 mx-2 max-[860px]:hidden" />

              <button
                type="button"
                className="flex items-center gap-3.5 px-4 py-3 rounded-[12px] text-[13.5px] font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4 transition-colors text-left cursor-pointer max-[860px]:whitespace-nowrap"
                onClick={logout}
              >
                <LogOut className="w-[18px] h-[18px] shrink-0 stroke-[1.8]" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            </nav>
          </aside>

          {/* ── Right Content Area ─────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Page Header */}
            <header className="mb-7">
              <h1 className="text-[32px] md:text-[36px] font-extrabold tracking-[-0.03em] text-[#111111] leading-tight">
                My Account
              </h1>
              <p className="mt-1 text-[15px] text-[#666666]">
                Manage your details and preferences.
              </p>
            </header>

            {/* Top Welcome Banner Card */}
            <div className="rounded-[20px] bg-white border border-black/8 p-6 lg:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between gap-5 max-[640px]:flex-col max-[640px]:items-start">
              <div className="flex items-center gap-5">
                <div className="w-[68px] h-[68px] rounded-full bg-[#e8e6e1] text-[#111111] text-[28px] font-medium flex items-center justify-center shrink-0">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[20px] lg:text-[22px] font-extrabold text-[#111111] tracking-[-0.02em] leading-snug">
                    Welcome back, {fullName}
                  </h2>
                  <p className="text-[13.5px] text-[#777777] mt-0.5 font-normal">
                    Member since {memberSince}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] text-[13px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                <span>Edit profile</span>
              </button>
            </div>

            {/* 2-Column Grid: Personal Information & Default Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {/* Card 1: Personal Information */}
              <div className="rounded-[20px] bg-white border border-black/8 p-6 lg:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-6">
                    <h3 className="text-[17px] font-bold text-[#111111] tracking-tight">
                      Personal information
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditDetailsOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] text-[12.5px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Edit details</span>
                    </button>
                  </div>

                  <div className="space-y-4 text-[13.5px]">
                    <div className="grid grid-cols-[100px_1fr] items-center">
                      <span className="text-[#666666] font-normal">Full name</span>
                      <span className="font-semibold text-[#111111]">{fullName}</span>
                    </div>

                    <div className="grid grid-cols-[100px_1fr] items-center">
                      <span className="text-[#666666] font-normal">Email</span>
                      <span className="font-semibold text-[#111111] truncate">{email}</span>
                    </div>

                    <div className="grid grid-cols-[100px_1fr] items-center">
                      <span className="text-[#666666] font-normal">Phone</span>
                      <span className="font-semibold text-[#111111]">{phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Default Address */}
              <div className="rounded-[20px] bg-white border border-black/8 p-6 lg:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4">
                    <h3 className="text-[17px] font-bold text-[#111111] tracking-tight">
                      Default address
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditAddressOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] text-[12.5px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                      <span>Edit address</span>
                    </button>
                  </div>

                  <div className="text-[13.5px] leading-relaxed text-[#555555]">
                    <p className="font-bold text-[#111111] mb-1">{addressData.name}</p>
                    <p>{addressData.line}</p>
                    <p>{addressData.cityStatePin}</p>
                    <p className="font-bold text-[#111111] mt-0.5">{addressData.country}</p>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddAddressOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] text-[12.5px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Add new address</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Overview Quick-Link Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
              {/* Card 1: Recent orders */}
              <Link
                href="/orders"
                className="group rounded-[20px] bg-white border border-black/8 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all duration-150 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:border-black/15"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-[14px] bg-[#FAF9F6] border border-black/6 flex items-center justify-center shrink-0 text-[#111111]">
                    <Package className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-bold text-[#111111] tracking-tight leading-tight">
                      Recent orders
                    </h4>
                    <p className="text-[12.5px] text-[#777777] mt-0.5 truncate">
                      View order history
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#888888] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Card 2: Wishlist */}
              <Link
                href="/favorites"
                className="group rounded-[20px] bg-white border border-black/8 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all duration-150 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:border-black/15"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-[14px] bg-[#FAF9F6] border border-black/6 flex items-center justify-center shrink-0 text-[#111111]">
                    <Heart className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-bold text-[#111111] tracking-tight leading-tight">
                      Wishlist
                    </h4>
                    <p className="text-[12.5px] text-[#777777] mt-0.5 truncate">
                      12 saved items
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#888888] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Card 3: Addresses */}
              <Link
                href="/profile?tab=addresses"
                className="group rounded-[20px] bg-white border border-black/8 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all duration-150 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:border-black/15"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-[14px] bg-[#FAF9F6] border border-black/6 flex items-center justify-center shrink-0 text-[#111111]">
                    <MapPin className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-bold text-[#111111] tracking-tight leading-tight">
                      Addresses
                    </h4>
                    <p className="text-[12.5px] text-[#777777] mt-0.5 truncate">
                      1 saved address
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#888888] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Recent Orders Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold text-[#111111] tracking-tight">
                  Recent orders
                </h3>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#111111] hover:underline"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </Link>
              </div>

              {/* Order Cards Stack */}
              <div className="space-y-4">
                {PROFILE_RECENT_ORDERS.map((order) => {
                  const isDelivered = order.status === 'Delivered'
                  const isShipped = order.status === 'Shipped'

                  return (
                    <article
                      key={order.orderId}
                      className="rounded-[20px] bg-white border border-black/8 p-5 lg:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex items-center justify-between gap-6 max-[768px]:flex-col max-[768px]:items-start">
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                          <div className="relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-[14px] overflow-hidden bg-[#eeece6] shrink-0 border border-black/6">
                            <Image
                              src={order.thumbnail}
                              alt={order.productName}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            {/* Order ID & Date Header */}
                            <div className="flex items-baseline gap-2.5">
                              <span className="text-[14.5px] font-extrabold text-[#111111] tracking-tight">
                                #{order.orderId}
                              </span>
                              <span className="text-[12.5px] text-[#777777]">
                                {order.date}
                              </span>
                            </div>

                            <h4 className="text-[14.5px] font-bold text-[#111111] truncate leading-snug mt-0.5">
                              {order.productName}
                            </h4>

                            <p className="text-[12px] text-[#666666] mt-0.5 truncate">
                              {order.variant}
                            </p>

                            <strong className="text-[16px] font-extrabold text-[#111111] mt-1 tracking-tight">
                              {order.price}
                            </strong>
                          </div>
                        </div>

                        {/* Middle: Delivery Status & Subtext */}
                        <div className="w-[200px] shrink-0 flex flex-col items-start max-[768px]:w-full">
                          {isDelivered && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#eaf5ed] text-[#1e833a] mb-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1e833a]" />
                              Delivered
                            </span>
                          )}
                          {isShipped && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#ebf3fc] text-[#1d6ee5] mb-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1d6ee5]" />
                              Shipped
                            </span>
                          )}

                          <div className="flex items-start gap-2.5">
                            {order.deliveryIcon === 'package' ? (
                              <Package className="w-4 h-4 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                            ) : (
                              <Truck className="w-4 h-4 text-[#222222] shrink-0 mt-0.5 stroke-[1.8]" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-[12.5px] font-bold text-[#111111] leading-tight">
                                {order.deliveryStatus}
                              </span>
                              <span className="text-[11.5px] text-[#777777] leading-tight mt-0.5">
                                {order.deliverySubtext}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="w-[145px] shrink-0 flex flex-col gap-2 max-[768px]:w-full max-[768px]:flex-row">
                          <button
                            type="button"
                            className="w-full py-2 px-3 rounded-[9px] text-[12.5px] font-semibold text-center bg-[#141414] hover:bg-[#262626] text-white shadow-2xs transition-all duration-150 active:scale-[0.98] cursor-pointer max-[768px]:flex-1"
                            onClick={() => {
                              if (order.primaryAction.actionType === 'buy-again') {
                                handleBuyAgain(order.productName)
                              } else {
                                handleTrackOrder(order.orderId)
                              }
                            }}
                          >
                            {order.primaryAction.label}
                          </button>

                          <button
                            type="button"
                            className="w-full py-2 px-3 rounded-[9px] text-[12.5px] font-semibold text-center bg-white hover:bg-black/3 border border-black/15 text-[#111111] transition-all duration-150 active:scale-[0.98] cursor-pointer max-[768px]:flex-1"
                            onClick={() => setSelectedOrderDetails(order)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── Edit Profile Modal ─────────────────────────────────────── */}
      {(isEditProfileOpen || isEditDetailsOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <h3 className="text-[18px] font-extrabold text-[#111111]">
                Edit Profile Information
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => {
                  setIsEditProfileOpen(false)
                  setIsEditDetailsOpen(false)
                }}
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[10px] border border-black/15 text-[14px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="pt-3 border-t border-black/8 flex justify-end gap-2.5">
                <button
                  type="button"
                  className="py-2.5 px-4 rounded-[10px] bg-white border border-black/15 text-[#111] text-[13px] font-semibold hover:bg-black/4 cursor-pointer"
                  onClick={() => {
                    setIsEditProfileOpen(false)
                    setIsEditDetailsOpen(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit / Add Address Modal ───────────────────────────────── */}
      {(isEditAddressOpen || isAddAddressOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <h3 className="text-[18px] font-extrabold text-[#111111]">
                {isEditAddressOpen ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => {
                  setIsEditAddressOpen(false)
                  setIsAddAddressOpen(false)
                }}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="py-4 space-y-3.5">
              <div>
                <label className="block text-[12px] font-bold text-[#333333] mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={addrForm.fullName}
                  onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                  required
                  className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#333333] mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={addrForm.addressLine}
                  onChange={(e) => setAddrForm({ ...addrForm, addressLine: e.target.value })}
                  required
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
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
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
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
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
                    value={addrForm.pincode}
                    onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-[10px] border border-black/15 text-[13.5px] text-[#111] focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#333333] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value="India"
                    disabled
                    className="w-full h-10 px-3.5 rounded-[10px] border border-black/10 bg-black/3 text-[13.5px] text-[#555]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/8 flex justify-end gap-2.5">
                <button
                  type="button"
                  className="py-2.5 px-4 rounded-[10px] bg-white border border-black/15 text-[#111] text-[13px] font-semibold hover:bg-black/4 cursor-pointer"
                  onClick={() => {
                    setIsEditAddressOpen(false)
                    setIsAddAddressOpen(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Order Details Dialog Modal ─────────────────────────────── */}
      {selectedOrderDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#111111]">
                  Order #{selectedOrderDetails.orderId}
                </h3>
                <p className="text-[13px] text-[#666666] mt-0.5">
                  Placed on {selectedOrderDetails.date}
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => setSelectedOrderDetails(null)}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-[14px]">
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Status</span>
                <span className="font-semibold text-[#111]">{selectedOrderDetails.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Product</span>
                <span className="font-semibold text-[#111] text-right">{selectedOrderDetails.productName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Total Amount</span>
                <span className="font-extrabold text-[#111]">{selectedOrderDetails.price}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Delivery Address</span>
                <span className="font-medium text-[#111] text-right max-w-[240px]">
                  {addressData.line}, {addressData.cityStatePin}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Payment Method</span>
                <span className="font-medium text-[#111]">UPI / Razorpay</span>
              </div>
            </div>

            <div className="pt-4 border-t border-black/8 flex justify-end">
              <button
                type="button"
                className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold cursor-pointer"
                onClick={() => setSelectedOrderDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
