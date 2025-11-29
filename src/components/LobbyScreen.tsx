import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Search, X, LogOut, User, Trophy, Coins } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

interface LobbyScreenProps {
  user: any;
  accessToken: string;
  onGameStart: (gameId: string) => void;
  onLogout: () => void;
  onViewProfile: () => void;
}

export function LobbyScreen({ user, accessToken, onGameStart, onLogout, onViewProfile }: LobbyScreenProps) {
  const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    joinLobby();
    const interval = setInterval(fetchLobbyPlayers, 3000);
    return () => {
      clearInterval(interval);
      leaveLobby();
    };
  }, []);

  const joinLobby = async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/lobby/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    } catch (err) {
      console.error('Join lobby error:', err);
    }
  };

  const leaveLobby = async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/lobby/leave`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    } catch (err) {
      console.error('Leave lobby error:', err);
    }
  };

  const fetchLobbyPlayers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/lobby/players`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      setLobbyPlayers(data.players || []);
    } catch (err) {
      console.error('Fetch lobby players error:', err);
    }
  };

  const startMatchmaking = async () => {
    setSearching(true);
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/matchmaking/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ playerCount })
        }
      );

      const data = await response.json();

      if (data.success && data.gameId) {
        // Initialize game
        const initResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/game/init`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({ gameId: data.gameId })
          }
        );

        const initData = await initResponse.json();
        
        if (initData.success) {
          onGameStart(data.gameId);
        }
      } else if (data.waiting) {
        alert('Nema dovoljno igrača u lobiju. Molimo sačekajte...');
        setSearching(false);
      }
    } catch (err) {
      console.error('Matchmaking error:', err);
      alert('Greška pri traženju protivnika');
      setSearching(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelSearch = () => {
    setSearching(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] landscape-only">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-[var(--color-fircik-green-dark)] bg-opacity-80 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl">🂡 Fircik</h1>
          <div className="flex items-center gap-2 bg-[var(--color-fircik-green)] px-4 py-2 rounded-full">
            <Coins className="w-5 h-5 text-[var(--color-fircik-gold)]" />
            <span className="text-[var(--color-fircik-gold)]">{user.novčići}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onViewProfile}
            className="bg-[var(--color-fircik-green-light)] hover:bg-[var(--color-fircik-green-lighter)] px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            Profil
          </button>
          <button
            onClick={onLogout}
            className="bg-[var(--color-fircik-red)] hover:bg-[var(--color-fircik-red-light)] px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Odjavi se
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-8 h-full flex gap-8">
        {/* Left Panel - Player Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-3xl text-[var(--color-fircik-green-dark)] mb-6">
            <Trophy className="inline w-8 h-8 mr-3" />
            Novi meč
          </h2>

          <div className="mb-8">
            <label className="block text-[var(--color-fircik-gray)] mb-4">
              Broj igrača
            </label>
            <div className="flex gap-4">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  disabled={searching}
                  className={`
                    flex-1 py-6 rounded-xl transition-all
                    ${playerCount === count 
                      ? 'bg-[var(--color-fircik-green)] text-white shadow-lg scale-105' 
                      : 'bg-[var(--color-fircik-gray-light)] text-[var(--color-fircik-gray)] hover:bg-[var(--color-fircik-green-lighter)] hover:text-white'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="text-2xl mb-1">{count}</div>
                  <div className="text-sm opacity-80">
                    {count === 2 ? 'Brza igra' : count === 3 ? '1 vs 2 (Talon)' : 'Parovi'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 p-6 bg-[var(--color-fircik-beige)] rounded-xl">
            <h3 className="text-xl text-[var(--color-fircik-green-dark)] mb-3">Cijena ulaska</h3>
            <p className="text-[var(--color-fircik-gray)]">
              <Coins className="inline w-5 h-5 mr-2 text-[var(--color-fircik-gold)]" />
              10 novčića po igri
            </p>
            <p className="text-sm text-[var(--color-fircik-gray)] mt-2">
              Pobednik osvaja novčiće na osnovu oklade
            </p>
          </div>

          {!searching ? (
            <button
              onClick={startMatchmaking}
              disabled={loading || user.novčići < 10}
              className="w-full bg-[var(--color-fircik-gold)] hover:bg-[var(--color-fircik-gold-light)] text-[var(--color-fircik-green-dark)] py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Search className="inline w-6 h-6 mr-3" />
              {user.novčići < 10 ? 'Nemate dovoljno novčića' : 'Pronađi protivnike'}
            </button>
          ) : (
            <button
              onClick={cancelSearch}
              className="w-full bg-[var(--color-fircik-red)] hover:bg-[var(--color-fircik-red-light)] text-white py-4 rounded-xl transition-colors shadow-lg"
            >
              <X className="inline w-6 h-6 mr-3" />
              Otkaži traženje
            </button>
          )}

          {searching && (
            <div className="mt-6 text-center">
              <div className="animate-pulse text-[var(--color-fircik-green)]">
                Tražimo protivnike...
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Panel - Online Players */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-96 bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-2xl text-[var(--color-fircik-green-dark)] mb-6">
            <Users className="inline w-7 h-7 mr-3" />
            Igrači online ({lobbyPlayers.length})
          </h2>

          <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {lobbyPlayers.length === 0 ? (
              <p className="text-center text-[var(--color-fircik-gray)] py-8">
                Trenutno nema drugih igrača u lobiju
              </p>
            ) : (
              lobbyPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-[var(--color-fircik-beige)] rounded-xl"
                >
                  <img
                    src={player.avatar}
                    alt={player.username}
                    className="w-12 h-12 rounded-full border-2 border-[var(--color-fircik-green)]"
                  />
                  <div className="flex-1">
                    <div className="text-[var(--color-fircik-green-dark)]">
                      {player.username}
                    </div>
                    <div className="text-sm text-[var(--color-fircik-gray)]">
                      {player.poeni} poena
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
