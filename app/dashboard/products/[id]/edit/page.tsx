import { ProductForm } from '@/components/forms/product-form'
import { products } from '@/lib/dummy-data'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Edit Product - Store Admin',
  description: 'Edit product details',
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const product = products.find((p) => p.id === id)

  if (!product) {
    notFound()
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">{product.name}</p>
        {product.updatedAt && (
          <p className="text-xs text-muted-foreground mt-2">Last updated: {product.updatedAt}</p>
        )}
      </div>

      <ProductForm initialData={product} isEdit={true} />
    </div>
  )
}
