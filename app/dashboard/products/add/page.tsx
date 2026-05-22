import { ProductForm } from '@/components/forms/product-form'

export const metadata = {
  title: 'Add Product - Store Admin',
  description: 'Add a new product to the store',
}

export default function AddProductPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="text-muted-foreground mt-1">Create a new product</p>
      </div>

      <ProductForm />
    </div>
  )
}
