/**
 * Shared PostHog Analytics Event Definitions and Types
 * Used by @jeans-store/storefront (client) and @jeans-store/api (server).
 */

export interface BaseProductProperties {
  product_id: string | number
  product_name: string
  product_slug?: string
  category?: string
  price: number
  currency?: string

  in_stock?: boolean
}

export interface ProductListItem {
  product_id: string | number
  product_name: string
  product_slug?: string
  category?: string
  price: number
  position?: number
}

export interface ProductListViewedProperties {
  list_id?: string
  list_name?: string
  products: ProductListItem[]
}

export interface ProductCardClickedProperties extends BaseProductProperties {
  position?: number
  source_location: string
}

export interface ProductViewedProperties extends BaseProductProperties {
  currency: string
  color?: string
  selected_size?: string
  sizes_available: string[]
  design?: string
  design_id?: number
  design_name?: string
  in_stock?: boolean
}

export interface ProductVariantSelectedProperties {
  product_id: string | number
  product_name: string
  product_slug?: string
  variant_type: 'color' | 'size' | 'design'
  color?: string
  size?: string
  design_id?: number
  design_name?: string
  design_slug?: string
  in_stock: boolean
}

export interface ProductSizeGuideOpenedProperties {
  product_id: string | number
  product_name: string
  category?: string
}

export interface ProductFavoritedProperties {
  product_id: string | number
  product_name: string
  category?: string
  price?: number
}

export interface ProductUnfavoritedProperties {
  product_id: string | number
  product_name: string
}

export interface ProductAddedToCartProperties extends BaseProductProperties {
  currency: string
  color?: string
  size: string
  quantity: number
  design_id?: number
  design_name?: string
  source_location?: 'pdp' | 'sticky_bar' | 'product_card' | 'quick_add' | string
}

export type AddToCartProperties = ProductAddedToCartProperties

export interface ProductBuyNowClickedProperties extends BaseProductProperties {
  currency: string
  color?: string
  size: string
  quantity: number
  design_id?: number
  design_name?: string
  source_location: 'pdp' | 'sticky_bar'
}

export interface CartItemSummary {
  product_id: string | number
  product_name: string
  size: string
  color?: string
  design_id?: number
  design_name?: string
  price: number
  quantity: number
}

export interface CheckoutStartedProperties {
  item_count: number
  subtotal: number
  currency: string
  direct_buy: boolean
  items: CartItemSummary[]
}

export interface PaymentSucceededProperties {
  order_id: string | number
  order_number: string
  payment_id: string
  gateway: 'razorpay' | 'cod' | string
  amount: number
  currency: string
  item_count: number
  items?: CartItemSummary[]
}

export interface PaymentFailedProperties {
  order_number?: string
  payment_id?: string
  gateway: 'razorpay' | 'cod' | string
  amount?: number
  currency?: string
  error_code?: string
  error_description?: string
  step?: 'initialization' | 'gateway' | 'verification' | 'order_placement' | string
}

export interface OrderCompletedProperties {
  order_id: string | number
  order_number: string
  total: number
  subtotal: number
  shipping: number
  currency: string
  item_count: number
  customer_email?: string
  payment_method?: string
  items: CartItemSummary[]
}

export interface AnalyticsUserTraits {
  email?: string
  name?: string
  phone?: string
  fit_preference?: string
  preferred_size?: string
  total_orders?: number
}

export type AnalyticsEventMap = {
  product_list_viewed: ProductListViewedProperties
  product_card_clicked: ProductCardClickedProperties
  product_viewed: ProductViewedProperties
  product_variant_selected: ProductVariantSelectedProperties
  product_size_guide_opened: ProductSizeGuideOpenedProperties
  product_favorited: ProductFavoritedProperties
  product_unfavorited: ProductUnfavoritedProperties
  add_to_cart: AddToCartProperties
  product_added_to_cart: ProductAddedToCartProperties
  product_buy_now_clicked: ProductBuyNowClickedProperties
  checkout_started: CheckoutStartedProperties
  payment_succeeded: PaymentSucceededProperties
  payment_failed: PaymentFailedProperties
  order_completed: OrderCompletedProperties
}

export type AnalyticsEventName = keyof AnalyticsEventMap
