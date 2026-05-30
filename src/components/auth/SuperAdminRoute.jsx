import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function SuperAdminRoute({ children }) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(undefined)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setIsSuperAdmin(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('role, approved')
        .eq('id', userData.user.id)
        .single()

      setIsSuperAdmin(data?.role === 'super-admin' && data?.approved === true)
    }

    checkSuperAdmin()
  }, [])

  if (isSuperAdmin === undefined) {
    return <div className="p-6 text-muted-foreground">Checking permissions...</div>
  }

  return isSuperAdmin ? children : <Navigate to="/dashboard" replace />
}

export default SuperAdminRoute
