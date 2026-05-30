import { useEffect, useState } from 'react'
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { supabase } from '../lib/supabase'

function Categories() {
  const [categories, setCategories] = useState([])
  const [canManage, setCanManage] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    setError('')

    const [{ data, error: categoryError }, { data: manageAccess }] = await Promise.all([
      supabase.rpc('list_categories'),
      supabase.rpc('can_manage_products'),
    ])

    if (categoryError) {
      setError(categoryError.message)
    } else {
      setCategories(data || [])
    }

    setCanManage(manageAccess === true)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openNewCategory = () => {
    setEditingCategory(null)
    setCategoryName('')
    setDialogOpen(true)
  }

  const openEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setDialogOpen(true)
  }

  const saveCategory = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const { error: saveError } = await supabase.rpc('save_category', {
      target_category_id: editingCategory?.id || null,
      category_name: categoryName.trim(),
    })

    if (saveError) {
      setError(saveError.message)
    } else {
      setMessage(editingCategory ? 'Category updated.' : 'Category created.')
      setDialogOpen(false)
      await loadCategories()
    }

    setSaving(false)
  }

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete ${category.name}?`)) {
      return
    }

    setError('')
    setMessage('')

    const { error: deleteError } = await supabase.rpc('delete_category', {
      target_category_id: category.id,
    })

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setMessage('Category deleted.')
      await loadCategories()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize products into catalog categories.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCategories} disabled={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {canManage && (
            <Button onClick={openNewCategory}>
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
      {message && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">{message}</div>}

      {loading ? (
        <p className="text-muted-foreground">Loading categories...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No categories found. Add a category to start organizing products.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{category.id}</p>
                <p className="text-sm text-muted-foreground mb-4">{category.product_count} products</p>
                {canManage && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditCategory(category)}>
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => deleteCategory(category)}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the category name shown in the product catalog.' : 'Create a category for grouping products.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input id="categoryName" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Example: Gaming Consoles" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Categories
