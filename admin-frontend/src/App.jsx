import { useEffect } from 'react'
import useAdminStore from './stores/adminStore'
import AdminLogin from './components/Auth/AdminLogin'
import AdminLayout from './components/Layout/AdminLayout'

function App() {
  const { initAuth, admin } = useAdminStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (!admin) {
    return <AdminLogin />
  }

  return <AdminLayout />
}

export default App
