export type StockStatus = 'available' | 'low_stock' | 'out_of_stock'

export interface ProductGalleryItem {
  id: string
  url: string
  alt: string
  label: 'Front' | 'Back' | 'Detail' | 'Lifestyle'
}

export interface ProductColor {
  name: string
  hex: string
  inStock?: boolean
  imageIndex?: number
}

export interface ProductSizeOption {
  size: string
  status: StockStatus
  stockCount?: number
  measurements?: {
    chestInches: number
    lengthInches: number
    shoulderInches: number
  }
}

export interface ModelInfo {
  height: string
  weight: string
  chest?: string
  sizeWorn: string
  fitNote: string
}

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductReview {
  id: string
  author: string
  location?: string
  rating: number
  date: string
  sizePurchased: string
  fitFeedback: 'Runs Small' | 'True to Size' | 'Slightly Oversized' | 'Runs Large'
  title: string
  comment: string
  verified: boolean
  helpfulCount: number
  photoUrl?: string
}

export interface ReviewsSummary {
  rating: number
  reviewCount: number
  recommendPercentage: number
  distribution: {
    stars: number
    percentage: number
  }[]
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ClothingProduct {
  id: number
  store: 'clothing-store'
  category: 't-shirts' | 'shirts' | 'hoodies' | 'hats' | 'accessories'
  name: string
  fit: string
  price: string
  originalPrice?: string
  priceNum: number
  originalPriceNum?: number
  badge?: string
  sellingPoint: string
  desc: string
  detailsStory?: string
  img: string
  img2?: string
  gallery: ProductGalleryItem[]
  colors: ProductColor[]
  sizes: ProductSizeOption[]
  modelInfo: ModelInfo
  specs: ProductSpec[]
  reviewsSummary: ReviewsSummary
  reviews: ProductReview[]
  faqs: FAQItem[]
}

export interface CartItem {
  id: string // unique cart item key: `${productId}-${size}-${color}`
  productId: number
  name: string
  price: string
  priceNum: number
  size: string
  color: string
  img: string
  quantity: number
  fit: string
}
