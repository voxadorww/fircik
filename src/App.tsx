import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen.tsx';
import { PortraitWarning } from './components/PortraitWarning.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { LobbyScreen } from './components/LobbyScreen.tsx';
import { GameScreen } from './components/GameScreen.tsx';
import { ProfileScreen } from './components/ProfileScreen.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { projectId, publicAnonKey } from './utils/supabase/info.tsx';

type Screen = 'splash' | 'auth' | 'lobby' | 'game' | 'profile' | 'admin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('fircik_access_token');
    const storedUser = localStorage.getItem('fircik_user');
    
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verify session is still valid
      verifySession(storedToken);
    }
  }, []);

  const verifySession = async (token: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('fircik_user', JSON.stringify(data.user));
      } else {
        // Session invalid, clear storage
        handleLogout();
      }
    } catch (err) {
      console.error('Verify session error:', err);
    }
  };

  const handleSplashComplete = () => {
    if (user && accessToken) {
      setCurrentScreen('lobby');
    } else {
      setCurrentScreen('auth');
    }
  };

  const handleAuthSuccess = (userData: any, token: string) => {
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('fircik_access_token', token);
    localStorage.setItem('fircik_user', JSON.stringify(userData));
    setCurrentScreen('lobby');
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken('');
    setGameId(null);
    localStorage.removeItem('fircik_access_token');
    localStorage.removeItem('fircik_user');
    setCurrentScreen('auth');
  };

  const handleGameStart = (newGameId: string) => {
    setGameId(newGameId);
    setCurrentScreen('game');
  };

  const handleBackToLobby = () => {
    setGameId(null);
    setCurrentScreen('lobby');
    
    // Refresh user data
    if (accessToken) {
      verifySession(accessToken);
    }
  };

  const handleViewProfile = () => {
    setCurrentScreen('profile');
  };

  const handleViewAdmin = () => {
    setCurrentScreen('admin');
  };

  return (
    <>
      <PortraitWarning />
      
      <AnimatePresence mode="wait">
        {currentScreen === 'splash' && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen key="auth" onAuthSuccess={handleAuthSuccess} />
        )}

        {currentScreen === 'lobby' && user && (
          <LobbyScreen
            key="lobby"
            user={user}
            accessToken={accessToken}
            onGameStart={handleGameStart}
            onLogout={handleLogout}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentScreen === 'game' && gameId && user && (
          <GameScreen
            key="game"
            gameId={gameId}
            user={user}
            accessToken={accessToken}
            onBackToLobby={handleBackToLobby}
          />
        )}

        {currentScreen === 'profile' && user && (
          <ProfileScreen
            key="profile"
            user={user}
            onBack={handleBackToLobby}
          />
        )}

        {currentScreen === 'admin' && user && (
          <AdminPanel
            key="admin"
            user={user}
            accessToken={accessToken}
            onBack={handleBackToLobby}
          />
        )}
      </AnimatePresence>

      {/* Admin Access Button (only visible in lobby for admin users) */}
      {currentScreen === 'lobby' && user?.isAdmin && (
        <button
          onClick={handleViewAdmin}
          className="fixed bottom-4 right-4 bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] px-6 py-3 rounded-full shadow-2xl hover:bg-[var(--color-fircik-gold-light)] transition-all z-50"
        >
          🛡️ Admin Panel
        </button>
      )}
    </>
  );
}
