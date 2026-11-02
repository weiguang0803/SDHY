import { useEffect } from 'react';
import useChatStore from './stores/chatStore';
import AuthPage from './components/Auth/AuthPage';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';

function App() {
  const user = useChatStore((state) => state.user);
  const token = useChatStore((state) => state.token);
  const initAuth = useChatStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!token || !user) {
    return <AuthPage />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <ChatArea />
    </div>
  );
}

export default App;
