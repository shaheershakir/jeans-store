'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpDown,
  BarChart2,
  Calendar,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Kanban as KanbanIcon,
  LayoutList,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toastSuccess } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'
import type { FulfillmentStatus, Order } from '@/lib/types'
import { fetchBackendOrders } from '@/services/commerce'
import { KanbanBoard } from '@/components/orders/kanban-board'
import type { OrderItemCardData } from '@/components/orders/kanban-card'
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'

// Reference product images for apparel items
const ORDER_PRODUCT_IMAGES: Record<string, string> = {
  blackTee:
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=80',
  stripedTee:
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=120&q=80',
  plainTee:
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=120&q=80',
  trackpants:
    'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=120&q=80',
  sweatshirt:
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=120&q=80',
  cap: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=120&q=80',
  cargo:
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=120&q=80',
}

const FALLBACK_IMAGE = ORDER_PRODUCT_IMAGES.blackTee

// 41 reference mockup orders matching the exact UI counts and orders from Image 1 & Image 2
const REFERENCE_ORDERS: OrderItemCardData[] = [
  // --- 19 Pending Orders (Increasing date order: 19 Oct first, 20 Oct, and so on) ---
  {
    id: 101,
    number: 'TGE-712345',
    productName: 'Heavyweight Graphic Tee & Sweatshirt',
    productColor: 'Olive',
    variantLabel: 'Olive Green / L • Qty: 2',
    customerName: 'Arjun Nair',
    customerAddress1: 'Marine Drive, Flat 4B',
    customerAddress2: 'Kochi, Kerala',
    locationShort: 'Kochi, KL',
    state: 'Kerala',
    date: '19 Oct, 09:10 am',
    rawDate: '2026-10-19T09:10:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 2898,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.blackTee, ORDER_PRODUCT_IMAGES.sweatshirt],
  },
  {
    id: 102,
    number: 'TGE-712301',
    productName: 'Striped Oversized Tee',
    productColor: 'Cream',
    variantLabel: 'Cream/Striped / M • Qty: 1',
    customerName: 'Sneha Pillai',
    customerAddress1: 'TC 14/221, Kowdiar',
    customerAddress2: 'Thiruvananthapuram, Kerala',
    locationShort: 'Thiruvananthapuram, KL',
    state: 'Kerala',
    date: '19 Oct, 02:45 pm',
    rawDate: '2026-10-19T14:45:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 1299,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 103,
    number: 'TGE-712276',
    productName: 'Essential Summer Drop Combo',
    productColor: 'Olive',
    variantLabel: 'Olive Green / L • Qty: 3',
    customerName: 'Rohit Sharma',
    customerAddress1: '12th Main, Indiranagar',
    customerAddress2: 'Bengaluru, Karnataka',
    locationShort: 'Bengaluru, KA',
    state: 'Karnataka',
    date: '20 Oct, 10:15 am',
    rawDate: '2026-10-20T10:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 4157,
    itemsCount: 3,
    images: [ORDER_PRODUCT_IMAGES.plainTee, ORDER_PRODUCT_IMAGES.trackpants, ORDER_PRODUCT_IMAGES.cap],
  },
  {
    id: 104,
    number: 'TGE-711982',
    productName: 'Essential Trackpants',
    productColor: 'Black',
    variantLabel: 'Black / M • Qty: 1',
    customerName: 'Ananya Roy',
    customerAddress1: 'Salt Lake Sector 5',
    customerAddress2: 'Kolkata, West Bengal',
    locationShort: 'Kolkata, WB',
    state: 'West Bengal',
    date: '20 Oct, 04:30 pm',
    rawDate: '2026-10-20T16:30:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1599,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.trackpants],
  },
  {
    id: 105,
    number: 'TGE-711540',
    productName: 'Oversized Graphic Tee',
    productColor: 'Charcoal',
    variantLabel: 'Charcoal / XL • Qty: 2',
    customerName: 'Deepak Verma',
    customerAddress1: 'Connaught Place, B-Block',
    customerAddress2: 'New Delhi, Delhi',
    locationShort: 'Delhi, DL',
    state: 'Delhi',
    date: '21 Oct, 11:20 am',
    rawDate: '2026-10-21T11:20:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 2399,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.blackTee, ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 106,
    number: 'TGE-711204',
    productName: 'Striped Oversized Tee',
    productColor: 'Navy',
    variantLabel: 'Navy / S • Qty: 1',
    customerName: 'Priya Patel',
    customerAddress1: 'SG Highway, Bodakdev',
    customerAddress2: 'Ahmedabad, Gujarat',
    locationShort: 'Ahmedabad, GJ',
    state: 'Gujarat',
    date: '21 Oct, 05:15 pm',
    rawDate: '2026-10-21T17:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1199,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 107,
    number: 'TGE-710892',
    productName: 'Classic Sweatshirt & Tee',
    productColor: 'Grey',
    variantLabel: 'Grey / L • Qty: 2',
    customerName: 'Rahul Mehta',
    customerAddress1: 'Bandra West, Hill Road',
    customerAddress2: 'Mumbai, Maharashtra',
    locationShort: 'Mumbai, MH',
    state: 'Maharashtra',
    date: '22 Oct, 09:40 am',
    rawDate: '2026-10-22T09:40:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 3499,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.sweatshirt, ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 108,
    number: 'TGE-710433',
    productName: 'Essential Plain Tee',
    productColor: 'White',
    variantLabel: 'White / M • Qty: 1',
    customerName: 'Kavita Iyer',
    customerAddress1: 'Anna Nagar West',
    customerAddress2: 'Chennai, Tamil Nadu',
    locationShort: 'Chennai, TN',
    state: 'Tamil Nadu',
    date: '22 Oct, 03:25 pm',
    rawDate: '2026-10-22T15:25:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1899,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 109,
    number: 'TGE-709912',
    productName: 'Heavyweight Cargo Pants',
    productColor: 'Olive',
    variantLabel: 'Olive / 32 • Qty: 2',
    customerName: 'Suresh Raina',
    customerAddress1: 'Gomti Nagar, Vibhuti Khand',
    customerAddress2: 'Lucknow, Uttar Pradesh',
    locationShort: 'Lucknow, UP',
    state: 'Uttar Pradesh',
    date: '23 Oct, 10:50 am',
    rawDate: '2026-10-23T10:50:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 2150,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.cargo],
  },
  {
    id: 110,
    number: 'TGE-709450',
    productName: 'Striped Boxy Tee',
    productColor: 'Black',
    variantLabel: 'Black / M • Qty: 1',
    customerName: 'Meera Nambiar',
    customerAddress1: 'Mavoor Road',
    customerAddress2: 'Kozhikode, Kerala',
    locationShort: 'Kozhikode, KL',
    state: 'Kerala',
    date: '23 Oct, 06:10 pm',
    rawDate: '2026-10-23T18:10:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1499,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 111,
    number: 'TGE-708991',
    productName: 'Sweatshirt & Cap Set',
    productColor: 'Melange',
    variantLabel: 'Melange / L • Qty: 2',
    customerName: 'Akhil Thomas',
    customerAddress1: 'Panampilly Nagar',
    customerAddress2: 'Kochi, Kerala',
    locationShort: 'Kochi, KL',
    state: 'Kerala',
    date: '24 Oct, 08:30 am',
    rawDate: '2026-10-24T08:30:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 2750,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.sweatshirt, ORDER_PRODUCT_IMAGES.cap],
  },
  {
    id: 112,
    number: 'TGE-708320',
    productName: 'Essential Plain Tee',
    productColor: 'Sage Green',
    variantLabel: 'Sage Green / L • Qty: 1',
    customerName: 'Divya Krishna',
    customerAddress1: 'Round West',
    customerAddress2: 'Thrissur, Kerala',
    locationShort: 'Thrissur, KL',
    state: 'Kerala',
    date: '24 Oct, 02:15 pm',
    rawDate: '2026-10-24T14:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1299,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 113,
    number: 'TGE-707884',
    productName: 'Double Drop Cargo & Tee',
    productColor: 'Black',
    variantLabel: 'Black / 34 • Qty: 2',
    customerName: 'Gautam Das',
    customerAddress1: 'Koregaon Park, Lane 5',
    customerAddress2: 'Pune, Maharashtra',
    locationShort: 'Pune, MH',
    state: 'Maharashtra',
    date: '25 Oct, 11:00 am',
    rawDate: '2026-10-25T11:00:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 3199,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.cargo, ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 114,
    number: 'TGE-707412',
    productName: 'Essential Trackpants',
    productColor: 'Navy',
    variantLabel: 'Navy / XL • Qty: 1',
    customerName: 'Harish Joshi',
    customerAddress1: 'C-Scheme, Subhash Marg',
    customerAddress2: 'Jaipur, Rajasthan',
    locationShort: 'Jaipur, RJ',
    state: 'Rajasthan',
    date: '25 Oct, 04:45 pm',
    rawDate: '2026-10-25T16:45:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 1450,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.trackpants],
  },
  {
    id: 115,
    number: 'TGE-706950',
    productName: 'Graphic Tee & Cap',
    productColor: 'White',
    variantLabel: 'White / M • Qty: 2',
    customerName: 'Shalini Rao',
    customerAddress1: 'Jubilee Hills, Road No 36',
    customerAddress2: 'Hyderabad, Telangana',
    locationShort: 'Hyderabad, TG',
    state: 'Telangana',
    date: '26 Oct, 09:20 am',
    rawDate: '2026-10-26T09:20:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 2600,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.plainTee, ORDER_PRODUCT_IMAGES.cap],
  },
  {
    id: 116,
    number: 'TGE-706501',
    productName: 'Classic Sweatshirt',
    productColor: 'Black',
    variantLabel: 'Black / L • Qty: 1',
    customerName: 'Vikas Khanna',
    customerAddress1: 'Sector 17 Market',
    customerAddress2: 'Chandigarh, Chandigarh',
    locationShort: 'Chandigarh, CH',
    state: 'Chandigarh',
    date: '26 Oct, 03:50 pm',
    rawDate: '2026-10-26T15:50:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 1999,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.sweatshirt],
  },
  {
    id: 117,
    number: 'TGE-705980',
    productName: 'Striped Oversized Tee',
    productColor: 'Grey',
    variantLabel: 'Grey / M • Qty: 1',
    customerName: 'Ritu Sen',
    customerAddress1: 'GS Road, Dispur',
    customerAddress2: 'Guwahati, Assam',
    locationShort: 'Guwahati, AS',
    state: 'Assam',
    date: '27 Oct, 10:15 am',
    rawDate: '2026-10-27T10:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1750,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 118,
    number: 'TGE-705342',
    productName: 'Cargo Pants & Plain Tee',
    productColor: 'Charcoal',
    variantLabel: 'Charcoal / 32 • Qty: 2',
    customerName: 'Manoj Tiwari',
    customerAddress1: 'Boring Road',
    customerAddress2: 'Patna, Bihar',
    locationShort: 'Patna, BR',
    state: 'Bihar',
    date: '27 Oct, 05:30 pm',
    rawDate: '2026-10-27T17:30:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Prepaid',
    fulfillmentStatus: 'Pending',
    total: 2299,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.cargo, ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 119,
    number: 'TGE-704890',
    productName: 'Oversized Plain Tee',
    productColor: 'Beige',
    variantLabel: 'Beige / L • Qty: 1',
    customerName: 'Farhan Akhtar',
    customerAddress1: 'Arera Colony',
    customerAddress2: 'Bhopal, Madhya Pradesh',
    locationShort: 'Bhopal, MP',
    state: 'Madhya Pradesh',
    date: '28 Oct, 10:24 am',
    rawDate: '2026-10-28T10:24:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Pending',
    total: 1350,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.plainTee],
  },

  // --- 14 Confirmed Orders ---
  {
    id: 120,
    number: 'TGE-692247',
    productName: 'Striped Oversized Tee',
    productColor: 'Black',
    variantLabel: 'White/Black / M • Qty: 1',
    customerName: 'Muhammed Shaheer',
    customerAddress1: 'Vadakke Avarakkan',
    customerAddress2: 'Kannur, Kerala',
    locationShort: 'Kannur, KL',
    state: 'Kerala',
    date: '25 Oct, 06:05 am',
    rawDate: '2026-10-25T06:05:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 2179,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 121,
    number: 'TGE-480007',
    productName: 'Classic Sweatshirt',
    productColor: 'Melange',
    variantLabel: 'Melange Grey / M • Qty: 1',
    customerName: 'Naveen Kumar',
    customerAddress1: 'T Nagar, Usman Road',
    customerAddress2: 'Chennai, Tamil Nadu',
    locationShort: 'Chennai, TN',
    state: 'Tamil Nadu',
    date: '25 Oct, 02:31 am',
    rawDate: '2026-10-25T02:31:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 1458,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.sweatshirt],
  },
  {
    id: 122,
    number: 'TGE-405496',
    productName: 'Oversized Tee & Olive Cargo',
    productColor: 'Black',
    variantLabel: 'Black / L • Qty: 2',
    customerName: 'Irfan Ali',
    customerAddress1: 'Banjara Hills, Road No 10',
    customerAddress2: 'Hyderabad, Telangana',
    locationShort: 'Hyderabad, TG',
    state: 'Telangana',
    date: '23 Oct, 06:15 pm',
    rawDate: '2026-10-23T18:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 2799,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.blackTee, ORDER_PRODUCT_IMAGES.cargo],
  },
  {
    id: 123,
    number: 'TGE-120027',
    productName: 'Essential Plain Tee',
    productColor: 'Olive',
    variantLabel: 'Olive Green / L • Qty: 1',
    customerName: 'Muhammed Shaheer',
    customerAddress1: 'Vadakke Avarakkan',
    customerAddress2: 'Kannur, Kerala',
    locationShort: 'Kannur, KL',
    state: 'Kerala',
    date: '25 Oct, 02:55 am',
    rawDate: '2026-10-25T02:55:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 1409,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 124,
    number: 'TGE-689120',
    productName: 'Heavyweight Cargo Combo',
    productColor: 'Beige',
    variantLabel: 'Black / 32 • Qty: 2',
    customerName: 'Alok Gupta',
    customerAddress1: 'Sector 62',
    customerAddress2: 'Noida, Uttar Pradesh',
    locationShort: 'Noida, UP',
    state: 'Uttar Pradesh',
    date: '25 Oct, 01:20 am',
    rawDate: '2026-10-25T01:20:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 2499,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.cargo, ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 125,
    number: 'TGE-688432',
    productName: 'Striped Boxy Tee',
    productColor: 'Red',
    variantLabel: 'Red/White / L • Qty: 1',
    customerName: 'Sunita Menon',
    customerAddress1: 'Sultanpet',
    customerAddress2: 'Palakkad, Kerala',
    locationShort: 'Palakkad, KL',
    state: 'Kerala',
    date: '24 Oct, 11:45 pm',
    rawDate: '2026-10-24T23:45:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 1699,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 126,
    number: 'TGE-687901',
    productName: 'Trackpants & Sweatshirt',
    productColor: 'Grey',
    variantLabel: 'Grey / M • Qty: 2',
    customerName: 'Kishore Kumar',
    customerAddress1: 'Koramangala 4th Block',
    customerAddress2: 'Bengaluru, Karnataka',
    locationShort: 'Bengaluru, KA',
    state: 'Karnataka',
    date: '24 Oct, 09:30 pm',
    rawDate: '2026-10-24T21:30:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 3250,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.trackpants, ORDER_PRODUCT_IMAGES.sweatshirt],
  },
  {
    id: 127,
    number: 'TGE-686540',
    productName: 'Essential Plain Tee',
    productColor: 'Navy',
    variantLabel: 'Navy / S • Qty: 1',
    customerName: 'Nandini Sharma',
    customerAddress1: 'Malviya Nagar',
    customerAddress2: 'Jaipur, Rajasthan',
    locationShort: 'Jaipur, RJ',
    state: 'Rajasthan',
    date: '24 Oct, 07:15 pm',
    rawDate: '2026-10-24T19:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 1399,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 128,
    number: 'TGE-685210',
    productName: 'Oversized Graphic Tee',
    productColor: 'Black',
    variantLabel: 'Black / XL • Qty: 1',
    customerName: 'Biju Varghese',
    customerAddress1: 'Baker Junction',
    customerAddress2: 'Kottayam, Kerala',
    locationShort: 'Kottayam, KL',
    state: 'Kerala',
    date: '24 Oct, 05:00 pm',
    rawDate: '2026-10-24T17:00:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 2150,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 129,
    number: 'TGE-684903',
    productName: 'Casual Striped Pack',
    productColor: 'Olive',
    variantLabel: 'Multi / L • Qty: 2',
    customerName: 'Pooja Hegde',
    customerAddress1: 'Kadri Road',
    customerAddress2: 'Mangalore, Karnataka',
    locationShort: 'Mangalore, KA',
    state: 'Karnataka',
    date: '24 Oct, 02:40 pm',
    rawDate: '2026-10-24T14:40:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 2899,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.stripedTee, ORDER_PRODUCT_IMAGES.plainTee],
  },
  {
    id: 130,
    number: 'TGE-683419',
    productName: 'Essential Trackpants',
    productColor: 'Black',
    variantLabel: 'Black / L • Qty: 1',
    customerName: 'Arun Prasad',
    customerAddress1: 'RS Puram',
    customerAddress2: 'Coimbatore, Tamil Nadu',
    locationShort: 'Coimbatore, TN',
    state: 'Tamil Nadu',
    date: '24 Oct, 12:10 pm',
    rawDate: '2026-10-24T12:10:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 1550,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.trackpants],
  },
  {
    id: 131,
    number: 'TGE-682104',
    productName: 'Classic Sweatshirt',
    productColor: 'Navy',
    variantLabel: 'Navy / M • Qty: 1',
    customerName: 'Tanvi Deshmukh',
    customerAddress1: 'Dharampeth',
    customerAddress2: 'Nagpur, Maharashtra',
    locationShort: 'Nagpur, MH',
    state: 'Maharashtra',
    date: '24 Oct, 10:00 am',
    rawDate: '2026-10-24T10:00:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 2299,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.sweatshirt],
  },
  {
    id: 132,
    number: 'TGE-681550',
    productName: 'Striped Oversized Tee',
    productColor: 'Black',
    variantLabel: 'Black / M • Qty: 1',
    customerName: 'Rajesh Pillai',
    customerAddress1: 'Chinnakada',
    customerAddress2: 'Kollam, Kerala',
    locationShort: 'Kollam, KL',
    state: 'Kerala',
    date: '23 Oct, 11:30 pm',
    rawDate: '2026-10-23T23:30:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 1799,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 133,
    number: 'TGE-680412',
    productName: 'Summer Cargo & Tee Set',
    productColor: 'Beige',
    variantLabel: 'Beige / 32 • Qty: 2',
    customerName: 'Sanjay Dutt',
    customerAddress1: 'DLF Phase 4',
    customerAddress2: 'Gurgaon, Haryana',
    locationShort: 'Gurgaon, HR',
    state: 'Haryana',
    date: '23 Oct, 09:20 pm',
    rawDate: '2026-10-23T21:20:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Confirmed',
    total: 3499,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.cargo, ORDER_PRODUCT_IMAGES.plainTee],
  },

  // --- 1 Processing Order ---
  {
    id: 134,
    number: 'TGE-335003',
    productName: 'Essential Trackpants',
    productColor: 'Brown',
    variantLabel: 'Brown / M • Qty: 1',
    customerName: 'Aditya Menon',
    customerAddress1: 'Palayam Junction',
    customerAddress2: 'Kozhikode, Kerala',
    locationShort: 'Kozhikode, KL',
    state: 'Kerala',
    date: '23 Oct, 06:46 pm',
    rawDate: '2026-10-23T18:46:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Processing',
    total: 1359,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.trackpants],
  },

  // --- 7 Shipped Orders ---
  {
    id: 135,
    number: 'TGE-971626',
    productName: 'Heavyweight Plain Tee',
    productColor: 'Charcoal',
    variantLabel: 'Charcoal / XL • Qty: 1',
    customerName: 'Vishnu Raj',
    customerAddress1: 'Juhu Tara Road',
    customerAddress2: 'Mumbai, Maharashtra',
    locationShort: 'Mumbai, MH',
    state: 'Maharashtra',
    date: '25 Oct, 01:47 am',
    rawDate: '2026-10-25T01:47:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 1459,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 136,
    number: 'TGE-498841',
    productName: 'Essential Trackpants',
    productColor: 'Black',
    variantLabel: 'Black / L • Qty: 1',
    customerName: 'Sidharth R',
    customerAddress1: 'Greater Kailash 1',
    customerAddress2: 'New Delhi, Delhi',
    locationShort: 'Delhi, DL',
    state: 'Delhi',
    date: '25 Oct, 02:45 am',
    rawDate: '2026-10-25T02:45:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 1659,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.trackpants],
  },
  {
    id: 137,
    number: 'TGE-383127',
    productName: 'Oversized Graphic Tee',
    productColor: 'Black',
    variantLabel: 'Black / L • Qty: 1',
    customerName: 'Karthik S',
    customerAddress1: 'Race Course Road',
    customerAddress2: 'Coimbatore, Tamil Nadu',
    locationShort: 'Coimbatore, TN',
    state: 'Tamil Nadu',
    date: '25 Oct, 06:20 am',
    rawDate: '2026-10-25T06:20:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 2179,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 138,
    number: 'TGE-381327',
    productName: 'Striped Oversized Tee',
    productColor: 'Cream',
    variantLabel: 'Olive/Cream / L • Qty: 1',
    customerName: 'Muhammed Shaheer',
    customerAddress1: 'Vadakke Avarakkan',
    customerAddress2: 'Kannur, Kerala',
    locationShort: 'Kannur, KL',
    state: 'Kerala',
    date: '25 Oct, 06:20 am',
    rawDate: '2026-10-25T06:20:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 2179,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.stripedTee],
  },
  {
    id: 139,
    number: 'TGE-965412',
    productName: 'Classic Sweatshirt',
    productColor: 'Navy',
    variantLabel: 'Navy / L • Qty: 1',
    customerName: 'Vijay Joseph',
    customerAddress1: 'Velachery Main Road',
    customerAddress2: 'Chennai, Tamil Nadu',
    locationShort: 'Chennai, TN',
    state: 'Tamil Nadu',
    date: '24 Oct, 08:30 pm',
    rawDate: '2026-10-24T20:30:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 1899,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.sweatshirt],
  },
  {
    id: 140,
    number: 'TGE-964201',
    productName: 'Heavyweight Cargo Combo',
    productColor: 'Olive',
    variantLabel: 'Olive / 32 • Qty: 2',
    customerName: 'Ramesh Babu',
    customerAddress1: 'Beach Road',
    customerAddress2: 'Visakhapatnam, Andhra Pradesh',
    locationShort: 'Visakhapatnam, AP',
    state: 'Andhra Pradesh',
    date: '24 Oct, 04:15 pm',
    rawDate: '2026-10-24T16:15:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 2450,
    itemsCount: 2,
    images: [ORDER_PRODUCT_IMAGES.cargo, ORDER_PRODUCT_IMAGES.blackTee],
  },
  {
    id: 141,
    number: 'TGE-963110',
    productName: 'Essential Plain Tee',
    productColor: 'Charcoal',
    variantLabel: 'Charcoal / M • Qty: 1',
    customerName: 'Ashish Mishra',
    customerAddress1: 'Vijay Nagar',
    customerAddress2: 'Indore, Madhya Pradesh',
    locationShort: 'Indore, MP',
    state: 'Madhya Pradesh',
    date: '24 Oct, 01:00 pm',
    rawDate: '2026-10-24T13:00:00.000Z',
    paymentStatus: 'Paid',
    paymentMethod: 'Razorpay',
    fulfillmentStatus: 'Shipped',
    total: 1699,
    itemsCount: 1,
    images: [ORDER_PRODUCT_IMAGES.plainTee],
  },
]

export default function OrdersPage() {
  const storeOrders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)
  const products = useAdminStore((s) => s.data.products)
  const settings = useAdminStore((s) => s.data.settings)

  // View mode switcher: 'kanban' or 'list'
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban')

  // Status overrides when dragging/dropping
  const [statusOverrides, setStatusOverrides] = React.useState<
    Record<string, FulfillmentStatus>
  >({})

  // Filters & State
  const [activeTab, setActiveTab] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const [paymentFilter, setPaymentFilter] = React.useState('all')
  const [regionFilter, setRegionFilter] = React.useState('all')
  const [dateFilter, setDateFilter] = React.useState('all')
  const [sortBy, setSortBy] = React.useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([])
  const [printQueue, setPrintQueue] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)

  // Order Detail Sheet state for mobile
  const [selectedDetailOrder, setSelectedDetailOrder] = React.useState<OrderItemCardData | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)

  // Create Order Dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newCustomerName, setNewCustomerName] = React.useState('')
  const [newCity, setNewCity] = React.useState('Kochi')
  const [newState, setNewState] = React.useState('Kerala')
  const [newPaymentStatus, setNewPaymentStatus] = React.useState('Paid')
  const [newAmount, setNewAmount] = React.useState('1499')

  React.useEffect(() => {
    let active = true
    void fetchBackendOrders().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  // Build unified normalized list of orders
  const displayOrders = React.useMemo<OrderItemCardData[]>(() => {
    const list: OrderItemCardData[] = []

    // 1. Add reference mockup orders
    for (const ref of REFERENCE_ORDERS) {
      const currentStatus = statusOverrides[String(ref.id)] || ref.fulfillmentStatus
      list.push({
        ...ref,
        fulfillmentStatus: currentStatus,
      })
    }

    // 2. Add existing store orders if any
    for (const order of storeOrders) {
      if (list.some((item) => item.number === order.number)) continue

      const customer = customers.find((c) => c.id === order.customerId)
      const firstItem = order.items[0]
      const matchingProduct = products.find((p) => p.id === firstItem?.productId)

      const formattedDate =
        new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }) +
        ', ' +
        new Date(order.createdAt)
          .toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
          .toLowerCase()

      const currentStatus =
        statusOverrides[String(order.id)] || (order.fulfillmentStatus as FulfillmentStatus)

      const cityName = order.shippingAddress?.city || customer?.city || 'Kannur'
      const stateName = order.shippingAddress?.state || customer?.state || 'Kerala'
      const stateShort = stateName.toLowerCase().includes('kerala') ? 'KL' : 'IN'
      const productColor =
        firstItem?.variantLabel?.split('/')[0]?.trim() ||
        'Black'

      list.push({
        id: order.id,
        number: order.number,
        productName: firstItem?.productName || matchingProduct?.name || 'Heavyweight Cotton Tee',
        productColor,
        variantLabel: firstItem?.variantLabel
          ? `${firstItem.variantLabel} • Qty: ${firstItem.quantity}`
          : 'Black / L • Qty: 1',
        customerName: customer?.name || 'Customer',
        customerAddress1: order.shippingAddress?.line1 || customer?.city || 'Main Street',
        customerAddress2: `${cityName}, ${stateName}`,
        locationShort: `${cityName}, ${stateShort}`,
        state: stateName,
        date: formattedDate,
        rawDate: order.createdAt,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        fulfillmentStatus: currentStatus,
        total: order.total,
        itemsCount: order.items.length || 1,
        images: [
          matchingProduct?.image ||
            ORDER_PRODUCT_IMAGES.blackTee ||
            FALLBACK_IMAGE,
        ],
      })
    }

    return list
  }, [storeOrders, customers, products, statusOverrides])

  // Compute status tab counts dynamically
  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: displayOrders.length,
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
      Returned: 0,
    }
    for (const o of displayOrders) {
      if (counts[o.fulfillmentStatus] !== undefined) {
        counts[o.fulfillmentStatus]++
      }
    }
    return counts
  }, [displayOrders])

  // Filter orders according to active filters
  const filteredOrders = React.useMemo(() => {
    const filtered = displayOrders.filter((order) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        order.number.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.productName.toLowerCase().includes(q) ||
        order.locationShort.toLowerCase().includes(q) ||
        (order.customerAddress2 && order.customerAddress2.toLowerCase().includes(q))

      // In list view, filter by active tab. In kanban view, all statuses are shown in their columns
      const matchesTab =
        viewMode === 'kanban' ||
        activeTab === 'all' ||
        order.fulfillmentStatus.toLowerCase() === activeTab.toLowerCase()

      const matchesPayment =
        paymentFilter === 'all' ||
        order.paymentStatus.toLowerCase() === paymentFilter.toLowerCase()

      const isKerala = order.state.trim().toLowerCase() === 'kerala'
      const matchesRegion =
        regionFilter === 'all' || (regionFilter === 'kerala' ? isKerala : !isKerala)

      return matchesQuery && matchesTab && matchesPayment && matchesRegion
    })

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
      }
      if (sortBy === 'date-asc') {
        return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
      }
      if (sortBy === 'amount-desc') {
        return b.total - a.total
      }
      if (sortBy === 'amount-asc') {
        return a.total - b.total
      }
      return 0
    })
  }, [displayOrders, query, activeTab, paymentFilter, regionFilter, sortBy, viewMode])

  // Move order status handler (drag & drop or menu action)
  const handleMoveOrder = React.useCallback(
    (orderId: string | number, newStatus: FulfillmentStatus) => {
      const strId = String(orderId)
      setStatusOverrides((prev) => ({
        ...prev,
        [strId]: newStatus,
      }))

      // Sync to store if it exists
      useAdminStore.setState((state) => ({
        data: {
          ...state.data,
          orders: state.data.orders.map((o) =>
            String(o.id) === strId ? { ...o, fulfillmentStatus: newStatus } : o
          ),
        },
      }))

      const targetOrder = displayOrders.find((o) => String(o.id) === strId)
      const orderLabel = targetOrder?.number || `Order #${strId}`
      toastSuccess(`${orderLabel} moved to ${newStatus}`)
    },
    [displayOrders]
  )

  // Handle Quick Create Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedTotal = parseInt(newAmount, 10) || 1499
    const orderNumber = `TGE-${Math.floor(100000 + Math.random() * 899999)}`
    const isKerala = newState.trim().toLowerCase() === 'kerala'

    const newOrder: OrderItemCardData = {
      id: Date.now(),
      number: orderNumber,
      productName: 'Heavyweight Cotton Tee',
      productColor: 'Black',
      variantLabel: 'Black / L • Qty: 1',
      customerName: newCustomerName.trim() || 'New Customer',
      customerAddress1: 'Main Street',
      customerAddress2: `${newCity.trim() || 'Kochi'}, ${newState.trim() || 'Kerala'}`,
      locationShort: `${newCity.trim() || 'Kochi'}, ${isKerala ? 'KL' : 'IN'}`,
      state: newState.trim() || 'Kerala',
      date: 'Just now',
      rawDate: new Date().toISOString(),
      paymentStatus: 'Paid',
      paymentMethod: 'Prepaid',
      fulfillmentStatus: 'Pending',
      total: parsedTotal,
      itemsCount: 1,
      images: [ORDER_PRODUCT_IMAGES.plainTee],
    }

    // Add to REFERENCE_ORDERS at index 0
    REFERENCE_ORDERS.unshift(newOrder)
    setStatusOverrides((prev) => ({ ...prev, [String(newOrder.id)]: 'Pending' }))
    setCreateDialogOpen(false)
    setNewCustomerName('')
    toastSuccess(`Created order ${orderNumber}`)
  }

  // Checkbox selection for list view
  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(String(o.id)))

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => String(o.id)))
    }
  }

  const toggleSelectOrder = (id: string | number) => {
    const strId = String(id)
    setSelectedOrderIds((curr) =>
      curr.includes(strId) ? curr.filter((i) => i !== strId) : [...curr, strId]
    )
  }

  // Handle Export
  const handleExport = (format = 'CSV') => {
    const csvContent =
      'Order Number,Customer,Product,Date,Payment Status,Payment Method,Fulfillment,Total\n' +
      filteredOrders
        .map(
          (o) =>
            `"${o.number}","${o.customerName}","${o.productName}","${o.date}","${o.paymentStatus}","${o.paymentMethod}","${o.fulfillmentStatus}",₹${o.total}`
        )
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `teesgarage-orders-${Date.now()}.${format.toLowerCase()}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess(`Exported ${filteredOrders.length} orders as ${format}`)
  }

  // Handle Print Slips
  React.useEffect(() => {
    if (!printQueue.length) return
    const timer = window.setTimeout(() => window.print(), 100)
    const reset = () => setPrintQueue([])
    window.addEventListener('afterprint', reset)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', reset)
    }
  }, [printQueue])

  const triggerPrintOrders = (items: OrderItemCardData[]) => {
    const queue: Order[] = items.map((item, idx) => {
      return {
        id: idx + 900,
        number: item.number,
        customerId: 1,
        items: [],
        subtotal: item.total,
        discount: 0,
        shippingFee: 0,
        tax: 0,
        total: item.total,
        paymentMethod: (item.paymentMethod as any) || 'Razorpay',
        paymentStatus: (item.paymentStatus as any) || 'Paid',
        transactionId: null,
        fulfillmentStatus: item.fulfillmentStatus,
        shippingAddress: {
          id: 1,
          label: 'Home',
          line1: item.customerAddress1 || 'Main Street',
          line2: '',
          city: item.locationShort.split(',')[0]?.trim() || 'Kochi',
          state: item.state || 'Kerala',
          pincode: '670001',
          phone: '+91 98765 43210',
        },
        carrier: 'Delhivery',
        trackingNumber: 'TRK-987654',
        shippedAt: null,
        deliveredAt: null,
        timeline: [],
        notes: [],
        createdAt: item.rawDate,
        updatedAt: item.rawDate,
      }
    })
    setPrintQueue(queue)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-background/80 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Print sheet for shipping address slips */}
      {printQueue.length > 0 && (
        <div className="print-sheet" aria-hidden="true">
          {printQueue.map((order) => {
            const recipient = customers.find((c) => c.id === order.customerId)
            const address = order.shippingAddress
            return (
              <article className="address-slip" key={order.id}>
                <div className="slip-order">Order: {order.number}</div>
                <div className="slip-columns">
                  <section>
                    <h2>From</h2>
                    <strong>{settings.storeName || 'TEESGARAGE'}</strong>
                    {settings.address && <p>{settings.address}</p>}
                    {settings.supportPhone && <p>Phone: {settings.supportPhone}</p>}
                  </section>
                  <section>
                    <h2>To</h2>
                    <strong>{recipient?.name || 'Customer'}</strong>
                    {[address?.line1, address?.line2, address?.city, address?.state, address?.pincode]
                      .filter(Boolean)
                      .map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                    {address?.phone && <p>Phone: {address.phone}</p>}
                  </section>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Page Header: Title and Subtitle                                        */}
      {/* ========================================================================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">
          Orders
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground hidden md:block">
          Track, manage, and fulfill customer orders
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground md:hidden">
          Manage customer orders ({tabCounts.all} total)
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top Metric KPI Stat Cards                                              */}
      {/* ========================================================================= */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total orders */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                Total orders
              </p>
              <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum leading-tight mt-0.5">
                {tabCounts.all}
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ +12%
              </span>
              <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">
                vs last month
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum leading-tight mt-0.5">
                {tabCounts.Pending}
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                ↗ +3%
              </span>
              <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">
                vs last month
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                Revenue
              </p>
              <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum leading-tight mt-0.5">
                ₹68,420
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ +18%
              </span>
              <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">
                vs last month
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Ready to ship */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                Ready to ship
              </p>
              <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum leading-tight mt-0.5">
                {tabCounts.Shipped}
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                ↗ +2
              </span>
              <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">
                vs last month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3a. Mobile View Switcher, Filter Pills & Search Bar (Screen 1 & 2)        */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3">
        {/* View Switcher Tabs (Equal Width) */}
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-border text-center">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`relative flex items-center justify-center gap-2 pb-2.5 text-xs font-semibold transition-colors ${
              viewMode === 'list'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-foreground'
            }`}
          >
            <LayoutList className="h-4 w-4" />
            <span>List View</span>
            {viewMode === 'list' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`relative flex items-center justify-center gap-2 pb-2.5 text-xs font-semibold transition-colors ${
              viewMode === 'kanban'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-foreground'
            }`}
          >
            <KanbanIcon className="h-4 w-4" />
            <span>Kanban View</span>
            {viewMode === 'kanban' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {/* Status / All Orders Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs whitespace-nowrap"
              >
                <span>{activeTab === 'all' ? (viewMode === 'kanban' ? 'All Orders' : `All (${tabCounts.all})`) : activeTab}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setActiveTab('all')}>All ({tabCounts.all})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('Pending')}>Pending ({tabCounts.Pending})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('Confirmed')}>Confirmed ({tabCounts.Confirmed})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('Processing')}>Processing ({tabCounts.Processing})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('Shipped')}>Shipped ({tabCounts.Shipped})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('Delivered')}>Delivered ({tabCounts.Delivered})</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Payment Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs whitespace-nowrap"
              >
                <span>{paymentFilter === 'all' ? 'Payment' : paymentFilter}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setPaymentFilter('all')}>All Payments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter('Paid')}>Paid</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Region Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs whitespace-nowrap"
              >
                <span>{regionFilter === 'all' ? 'Region' : regionFilter === 'kerala' ? 'Kerala' : 'Other'}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setRegionFilter('all')}>All Regions</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRegionFilter('kerala')}>Kerala</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRegionFilter('other')}>Other States</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* In List View: Calendar Icon; In Kanban View: Sort Icon */}
          {viewMode === 'list' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-slate-400 shadow-2xs shrink-0"
                  aria-label="Date filter"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
                <DropdownMenuItem onClick={() => setDateFilter('all')}>All dates</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('Today (25 Oct)')}>Today (25 Oct)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('Last 7 days')}>Last 7 days</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-slate-400 shadow-2xs shrink-0"
                  aria-label="Sort orders"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
                <DropdownMenuItem onClick={() => setSortBy('date-desc')}>Date (Newest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date-asc')}>Date (Oldest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount-desc')}>Amount (High to Low)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount-asc')}>Amount (Low to High)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Search Bar + Action Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={viewMode === 'list' ? 'Search orders, customers...' : 'Search orders...'}
              className="w-full rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            />
          </div>
          {viewMode === 'list' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card text-slate-700 dark:text-slate-300 shadow-2xs shrink-0"
                  aria-label="Sort orders"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
                <DropdownMenuItem onClick={() => setSortBy('date-desc')}>Date (Newest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date-asc')}>Date (Oldest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount-desc')}>Amount (High to Low)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount-asc')}>Amount (Low to High)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs shrink-0"
              aria-label="Create Order"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3b. Desktop View Switcher and Kanban / List Control Bar                   */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2">
        {/* Left: View Switcher Tabs (List View / Kanban View) */}
        <div className="flex items-center gap-6 border-b lg:border-b-0 border-slate-200 dark:border-border pb-2 lg:pb-0">
          {/* List View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`relative inline-flex items-center gap-2 pb-2.5 pt-1 text-sm font-semibold transition-colors ${
              viewMode === 'list'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-foreground'
            }`}
          >
            <LayoutList className="h-4 w-4" />
            <span>List View</span>
            {viewMode === 'list' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          {/* Kanban View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`relative inline-flex items-center gap-2 pb-2.5 pt-1 text-sm font-semibold transition-colors ${
              viewMode === 'kanban'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-foreground'
            }`}
          >
            <KanbanIcon className="h-4 w-4" />
            <span>Kanban View</span>
            {viewMode === 'kanban' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Right: Search, Filter, Sort, and Create Order Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Payment Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-colors"
              >
                <span>{paymentFilter === 'all' ? 'All Payment Status' : paymentFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setPaymentFilter('all')}>
                All Payment Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter('Paid')}>Paid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter('Pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter('Failed')}>Failed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter('Refunded')}>
                Refunded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delivery Region Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-colors"
              >
                <span>
                  {regionFilter === 'all'
                    ? 'All delivery regions'
                    : regionFilter === 'kerala'
                      ? 'Inside Kerala'
                      : 'Outside Kerala'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setRegionFilter('all')}>
                All delivery regions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRegionFilter('kerala')}>
                Inside Kerala
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRegionFilter('outside')}>
                Outside Kerala
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort By Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {sortBy === 'date-desc'
                    ? 'Sort by: Date (Newest)'
                    : sortBy === 'date-asc'
                      ? 'Sort by: Date (Oldest)'
                      : sortBy === 'amount-desc'
                        ? 'Sort by: Amount (High to Low)'
                        : 'Sort by: Amount (Low to High)'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setSortBy('date-desc')}>
                Sort by: Date (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date-asc')}>
                Sort by: Date (Oldest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('amount-desc')}>
                Sort by: Amount (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('amount-asc')}>
                Sort by: Amount (Low to High)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Order Button & Modal */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Order</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateOrder}>
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                  <DialogDescription>
                    Add a quick customer order to the dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Varma"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-border p-2.5 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-border p-2.5 bg-white dark:bg-card"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-border p-2.5 bg-white dark:bg-card"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Payment Status
                      </label>
                      <select
                        value={newPaymentStatus}
                        onChange={(e) => setNewPaymentStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-border p-2.5 bg-white dark:bg-card"
                      >
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Order Total (₹)
                      </label>
                      <input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-border p-2.5 bg-white dark:bg-card"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setCreateDialogOpen(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xs"
                  >
                    Confirm & Save
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Kanban View: Pragmatic Drag and Drop Board                             */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          orders={filteredOrders}
          countsByStatus={tabCounts}
          onMoveOrder={handleMoveOrder}
          onPrint={(order) => triggerPrintOrders([order])}
          onCardClick={(order) => {
            setSelectedDetailOrder(order)
            setDetailSheetOpen(true)
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. List View: Preserves Status Tabs (Image 2) and Full Orders Table       */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Mobile Order Cards List (Screen 1) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-8 text-center text-xs text-slate-400">
                No orders match your filters.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedDetailOrder(order)
                    setDetailSheetOpen(true)
                  }}
                  className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-3.5 shadow-2xs active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Square Thumbnail */}
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-slate-700">
                      <Image
                        src={order.images[0] || FALLBACK_IMAGE}
                        alt={order.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    {/* Middle Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-foreground">
                          {order.number}
                        </span>
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 text-[10px] font-bold">
                          Paid
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            order.fulfillmentStatus === 'Confirmed'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                              : order.fulfillmentStatus === 'Processing'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                                : order.fulfillmentStatus === 'Shipped'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                          }`}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5 truncate">
                        {order.itemsCount} item • {order.variantLabel ? order.variantLabel.split('•')[0].trim() : 'Standard'}
                      </p>

                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                        {order.customerName}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{order.customerAddress2 || order.locationShort}</span>
                      </div>
                    </div>

                    {/* Right Price & Date */}
                    <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDetailOrder(order)
                          setDetailSheetOpen(true)
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label="Options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      <div className="mt-auto">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-foreground tnum">
                          {formatINR(order.total)}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-muted-foreground">
                          {order.paymentMethod || 'Razorpay'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-muted-foreground whitespace-nowrap mt-0.5">
                          {order.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Status Tabs, Action Buttons & Full Table (DO NOT REMOVE TABS OR TABLE) */}
          <div className="hidden md:block space-y-4">
            {/* Status Tabs for List View (DO NOT REMOVE THESE TABS - User Request) */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-border overflow-x-auto scrollbar-thin">
            {[
              { label: 'All Orders', value: 'all', count: tabCounts.all },
              { label: 'Pending', value: 'Pending', count: tabCounts.Pending },
              { label: 'Confirmed', value: 'Confirmed', count: tabCounts.Confirmed },
              { label: 'Processing', value: 'Processing', count: tabCounts.Processing },
              { label: 'Shipped', value: 'Shipped', count: tabCounts.Shipped },
              { label: 'Delivered', value: 'Delivered', count: tabCounts.Delivered },
              { label: 'Cancelled', value: 'Cancelled', count: tabCounts.Cancelled },
              { label: 'Returned', value: 'Returned', count: tabCounts.Returned },
            ].map((tab) => {
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`relative flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>

                  {/* Active Underline */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* List View Action Buttons (Print, Export, Date Range) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Date Range Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{dateFilter === 'all' ? 'Select date range' : dateFilter}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 rounded-xl p-1 shadow-md">
                  <DropdownMenuItem onClick={() => setDateFilter('all')}>
                    All dates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('Today (25 Oct)')}>
                    Today (25 Oct)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('Last 7 days')}>
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter('Oct 1 - Oct 31, 2026')}>
                    Oct 1 - Oct 31, 2026
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Print Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-800 dark:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
                  >
                    <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span>Print</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
                  <DropdownMenuItem onClick={() => triggerPrintOrders(filteredOrders)}>
                    Print all visible ({filteredOrders.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectedOrderIds.length === 0}
                    onClick={() =>
                      triggerPrintOrders(
                        filteredOrders.filter((o) => selectedOrderIds.includes(String(o.id)))
                      )
                    }
                  >
                    Print selected ({selectedOrderIds.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()}>
                    Print summary page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                    <ChevronDown className="h-3.5 w-3.5 text-white/80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-md">
                  <DropdownMenuItem onClick={() => handleExport('CSV')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('Excel')}>
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('JSON')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Full Orders Table (DO NOT DELETE LIST - User Request) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 dark:border-border bg-white dark:bg-card text-slate-500 dark:text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all orders"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4 font-semibold">Order Number</th>
                    <th className="py-3.5 px-4 font-semibold">Product</th>
                    <th className="py-3.5 px-4 font-semibold">Customer</th>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Payment</th>
                    <th className="py-3.5 px-4 font-semibold">Fulfillment</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Total</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isChecked = selectedOrderIds.includes(String(order.id))

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isChecked ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              aria-label={`Select order ${order.number}`}
                              checked={isChecked}
                              onChange={() => toggleSelectOrder(order.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Order Number */}
                          <td className="py-4 px-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-bold text-slate-900 dark:text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {order.number}
                            </Link>
                            <p className="text-[11px] text-slate-400 dark:text-muted-foreground font-normal mt-0.5">
                              {order.itemsCount} item{order.itemsCount > 1 ? 's' : ''}
                            </p>
                          </td>

                          {/* Product */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-slate-700">
                                <Image
                                  src={order.images[0] || FALLBACK_IMAGE}
                                  alt={order.productName}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-foreground truncate max-w-[200px]">
                                  {order.productName}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5 truncate">
                                  {order.variantLabel}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-900 dark:text-foreground">
                              {order.customerName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                              {order.customerAddress1}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-muted-foreground">
                              {order.customerAddress2}
                            </p>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {order.date}
                          </td>

                          {/* Payment */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                                order.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                            <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-1">
                              {order.paymentMethod}
                            </p>
                          </td>

                          {/* Fulfillment */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                                order.fulfillmentStatus === 'Confirmed'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : order.fulfillmentStatus === 'Processing'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                                    : order.fulfillmentStatus === 'Shipped'
                                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                                      : order.fulfillmentStatus === 'Pending'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {order.fulfillmentStatus}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-foreground tnum whitespace-nowrap">
                            {formatINR(order.total)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => triggerPrintOrders([order])}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Print</span>
                              </button>

                              <Link
                                href={`/orders/${order.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View</span>
                              </Link>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label="More options"
                                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-md">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/orders/${order.id}`}>View Details</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toastSuccess(`Packing slip generated for ${order.number}`)
                                    }
                                  >
                                    Download Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toastSuccess(`Tracking details copied for ${order.number}`)
                                    }
                                  >
                                    Copy Tracking Info
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Print Slip Styles */}
      <style jsx global>{`
        .print-sheet {
          display: none;
        }
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          .print-sheet,
          .print-sheet * {
            visibility: visible !important;
          }
          .print-sheet {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            color: #111;
            font-family: Arial, sans-serif;
          }
          .address-slip {
            box-sizing: border-box;
            height: 128mm;
            padding: 10mm;
            border: 1px solid #222;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 8mm;
          }
          .slip-order {
            font-size: 11pt;
            margin-bottom: 12mm;
          }
          .slip-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12mm;
          }
          .slip-columns h2 {
            font-size: 18pt;
            margin: 0 0 7mm;
            text-transform: uppercase;
          }
          .slip-columns strong {
            font-size: 12pt;
          }
          .slip-columns p {
            font-size: 11pt;
            line-height: 1.45;
            margin: 2mm 0 0;
            overflow-wrap: anywhere;
          }
          .address-slip:nth-child(2n) {
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>
      {/* Order Detail Bottom Sheet for Mobile (Screen 3) */}
      <OrderDetailSheet
        order={selectedDetailOrder}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onStatusChange={handleMoveOrder}
        onPrint={(o) => triggerPrintOrders([o])}
      />
    </div>
  )
}
