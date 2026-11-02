import React, { useEffect } from 'react'
import useAuthStore from './stores/authStore'
import KnowledgeAuth from './components/Auth/KnowledgeAuth'
import KnowledgeLayout from './components/Layout/KnowledgeLayout'

function App() {
  const { user, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (!user) {
    return <KnowledgeAuth />
  }

  return <KnowledgeLayout />
}

export default App
