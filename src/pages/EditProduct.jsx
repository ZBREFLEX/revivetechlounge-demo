import { useParams } from 'react-router-dom'
import ProductEditor from '../components/products/ProductEditor'

function EditProduct() {
  const { id } = useParams()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">Update product details.</p>
      </div>
      <ProductEditor productId={id} />
    </div>
  )
}

export default EditProduct
