import Image from 'next/image'
import Link from 'next/link'
import type { ClothingProduct } from '@/lib/types'

export default function ProductCard({ product }: { product: ClothingProduct }) {
  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-card-image-box">
        <Image
          src={product.img}
          alt={product.name}
          width={600}
          height={750}
          className="product-card-img"
        />
        {product.badge && (
          <span className="product-card-badge">{product.badge}</span>
        )}
      </div>
      <h3 className="product-card-title">{product.name}</h3>
      <p className="product-card-fit">{product.fit}</p>
      <div className="product-card-price-row">
        <span className="product-card-price">{product.price}</span>
        {product.originalPrice && (
          <span className="product-card-original-price">
            {product.originalPrice}
          </span>
        )}
      </div>
    </Link>
  )
}
