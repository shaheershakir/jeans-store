'use client'

import { PageContent, PageHeader } from '@/components/ui/page-header'
import { ProductForm } from '@/components/product-form'

export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="Add New Product"
        description="Create a tee or bottomwear product with custom sizes, stock, and delivery weight."
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: 'New Product' },
        ]}
      />
      <PageContent>
        <ProductForm />
      </PageContent>
    </div>
  )
}
