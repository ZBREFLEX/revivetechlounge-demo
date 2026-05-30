import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)
  const [approved, setApproved] = useState(undefined)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setApproved(false)
      return undefined
    }

    const checkAccess = async (nextSession) => {
      setSession(nextSession)

      if (!nextSession) {
        setApproved(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', nextSession.user.id)
        .single()

      const hasAccess = profile?.approved === true
      setApproved(hasAccess)

      if (!hasAccess) {
        await supabase.auth.signOut()
      }
    }

    supabase.auth.getSession().then(({ data }) => checkAccess(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      checkAccess(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined || approved === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Checking your session...
      </div>
    )
  }

  return session && approved
    ? children
    : <Navigate to="/login" replace state={{ accessError: 'Your account is waiting for super admin approval.' }} />
}

export default ProtectedRoute
