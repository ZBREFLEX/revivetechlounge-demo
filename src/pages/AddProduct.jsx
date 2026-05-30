import ProductEditor from '../components/products/ProductEditor'

function AddProduct() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground mt-1">Create a product in your catalog.</p>
      </div>
      <ProductEditor />
    </div>
  )
}

export default AddProduct
