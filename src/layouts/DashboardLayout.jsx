import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layouts/Sidebar'
import Topbar from '../components/layouts/Topbar'

function DashboardLayout() {
  const location = useLocation()
  const contentRef = useRef(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main ref={contentRef} className="min-h-0 flex-1 overflow-auto bg-background">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
