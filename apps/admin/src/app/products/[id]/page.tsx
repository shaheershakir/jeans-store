'use client'

import * as React from 'react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { ProductForm } from '@/components/product-form'

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  const productId = parseInt(resolvedParams.id, 10)
  const products = useAdminStore((s) => s.data.products)
  const product = products.find((p) => p.id === productId)

  if (!product) {
    return (
      <div>
        <PageHeader
          title="Product Not Found"
          breadcrumbs={[{ label: 'Products', href: '/products' }, { label: 'Error' }]}
        />
        <PageContent>
          <div className="py-12 text-center text-ink-3">
            Product with ID #{resolvedParams.id} could not be found.
          </div>
        </PageContent>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Edit "${product.name}"`}
        description={`Product ID #${product.id} &bull; ${product.sku}`}
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name },
        ]}
      />
      <PageContent>
        <ProductForm product={product} />
      </PageContent>
    </div>
  )
}
