import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Crown, Coins, Star, Users } from 'lucide-react';
import { Card } from './Card.tsx';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

interface GameScreenProps {
  gameId: string;
  user: any;
  accessToken: string;
  onBackToLobby: () => void;
}

export function GameScreen({ gameId, user, accessToken, onBackToLobby }: GameScreenProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTalonCards, setSelectedTalonCards] = useState<any[]>([]);

  useEffect(() => {
    if (gameId) {
      fetchGameState();
      const interval = setInterval(fetchGameState, 2000);
      return () => clearInterval(interval);
    } else {
      setError('Nema ID igre');
      setLoading(false);
    }
  }, [gameId]);

  const fetchGameState = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/game/${gameId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }

      const data = await response.json();
      
      if (data.gameState) {
        setGameState(data.gameState);
        setError('');
      } else {
        setError('Igra nije pronađena');
      }
    } catch (err: any) {
      console.error('Fetch game state error:', err);
      setError('Greška pri učitavanju igre');
    } finally {
      setLoading(false);
    }
  };

  const makeBid = async (bid: string, trumpSuit?: string, additionalGame?: string, partnerCard?: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/game/bid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ gameId, bid, trumpSuit, additionalGame, partnerCard })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setGameState(data.gameState);
      } else {
        alert(data.error || 'Greška pri bidding-u');
      }
    } catch (err) {
      console.error('Bid error:', err);
      alert('Greška pri bidding-u');
    }
  };

  const exchangeTalon = async () => {
    if (selectedTalonCards.length !== 2) {
      alert('Morate odabrati tačno 2 karte');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/game/talon-exchange`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ gameId, returnedCards: selectedTalonCards })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setGameState(data.gameState);
        setSelectedTalonCards([]);
      } else {
        alert(data.error || 'Greška pri razmeni talona');
      }
    } catch (err) {
      console.error('Talon exchange error:', err);
      alert('Greška pri razmeni talona');
    }
  };

  const playCard = async (card: any) => {
    if (!isMyTurn()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/game/play`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ gameId, card })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setGameState(data.gameState);
      } else {
        alert(data.error || 'Greška pri igranju karte');
      }
    } catch (err) {
      console.error('Play card error:', err);
      alert('Greška pri igranju karte');
    }
  };

  const callCvancik = async (suit: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/game/call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ gameId, suit })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setGameState(data.gameState);
        setShowNotification(data.message);
        setTimeout(() => setShowNotification(null), 3000);
      } else {
        alert(data.error || 'Greška pri pozivu');
      }
    } catch (err) {
      console.error('Call error:', err);
      alert('Greška pri pozivu');
    }
  };

  const isMyTurn = () => {
    if (!gameState || gameState.phase !== 'playing') return false;
    const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];
    return currentPlayer?.id === user?.id;
  };

  const getCurrentPlayerName = () => {
    if (!gameState) return '';
    const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];
    return currentPlayer?.username || 'Nepoznato';
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--color-fircik-green-dark)] flex items-center justify-center landscape-only">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🂠</div>
          <p className="text-xl text-[var(--color-fircik-gold)]">Učitavanje igre...</p>
          <p className="text-sm text-[var(--color-fircik-gray-light)] mt-2">Game ID: {gameId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !gameState) {
    return (
      <div className="fixed inset-0 bg-[var(--color-fircik-green-dark)] flex items-center justify-center landscape-only p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        >
          <h2 className="text-2xl text-[var(--color-fircik-red)] mb-4">Greška</h2>
          <p className="text-[var(--color-fircik-gray)] mb-2">{error || 'Igra nije pronađena'}</p>
          <p className="text-sm text-[var(--color-fircik-gray-light)] mb-6">Game ID: {gameId}</p>
          <button
            onClick={onBackToLobby}
            className="w-full bg-[var(--color-fircik-green)] text-white px-8 py-3 rounded-xl hover:bg-[var(--color-fircik-green-light)] transition-colors"
          >
            Vrati se u lobi
          </button>
        </motion.div>
      </div>
    );
  }

  // Game finished state
  if (gameState.status === 'finished') {
    const winnerId = gameState.winner;
    const isTeamGame = gameState.variant === '4-player';
    
    let winnerDisplay = '';
    let isWinner = false;
    
    if (isTeamGame) {
      winnerDisplay = winnerId === 'team1' ? 'Tim 1' : 'Tim 2';
      // Determine if current user is on winning team
      // This would need proper team checking logic
    } else {
      const winner = gameState.players?.find((p: any) => p.id === winnerId);
      winnerDisplay = winner?.username || 'Nepoznato';
      isWinner = winnerId === user?.id;
    }

    return (
      <div className="fixed inset-0 bg-[var(--color-fircik-green-dark)] flex items-center justify-center landscape-only p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-4xl w-full"
        >
          <div className="text-center mb-8">
            <h2 className="text-5xl mb-4 text-[var(--color-fircik-green-dark)]">
              {isWinner ? '🎉 Pobeda!' : 'Kraj igre'}
            </h2>
            <p className="text-2xl text-[var(--color-fircik-gray)]">
              Pobednik: <span className="text-[var(--color-fircik-green)] font-semibold">{winnerDisplay}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {Object.entries(gameState.gamePoints || {}).map(([playerId, points]) => {
              const player = gameState.players?.find((p: any) => p.id === playerId);
              if (!player && !playerId.startsWith('team')) return null;
              
              const displayName = player?.username || playerId;
              const isWinningEntry = playerId === winnerId;
              
              return (
                <div
                  key={playerId}
                  className={`p-6 rounded-xl ${isWinningEntry ? 'bg-[var(--color-fircik-gold)] bg-opacity-20 border-2 border-[var(--color-fircik-gold)]' : 'bg-[var(--color-fircik-beige)]'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {player && (
                        <img 
                          src={player.avatar} 
                          alt={player.username} 
                          className="w-12 h-12 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      )}
                      <span className="text-xl text-[var(--color-fircik-green-dark)] font-medium">{displayName}</span>
                      {isWinningEntry && <Crown className="w-6 h-6 text-[var(--color-fircik-gold)]" />}
                    </div>
                    <p className="text-3xl text-[var(--color-fircik-green)] font-bold">{points as number}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBackToLobby}
            className="w-full bg-[var(--color-fircik-green)] text-white px-8 py-4 rounded-xl hover:bg-[var(--color-fircik-green-light)] transition-colors font-semibold text-lg"
          >
            Vrati se u lobi
          </button>
        </motion.div>
      </div>
    );
  }

  // Bidding Phase
  if (gameState.phase === 'bidding') {
    const suits = ['♠', '♥', '♦', '♣'];
    const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];
    const isMyBid = currentPlayer?.id === user?.id;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] landscape-only p-8">
        <div className="h-full flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full"
          >
            <h2 className="text-3xl text-[var(--color-fircik-green-dark)] mb-6 text-center font-semibold">
              Bidding faza
            </h2>

            {isMyBid ? (
              <div className="space-y-6">
                <p className="text-center text-[var(--color-fircik-gray)] mb-4 text-lg">
                  Vaš red - odaberite adut ili predajte
                </p>

                <div>
                  <label className="block text-[var(--color-fircik-gray)] mb-3 text-lg font-medium">Odaberite adut:</label>
                  <div className="grid grid-cols-4 gap-4">
                    {suits.map((suit) => (
                      <button
                        key={suit}
                        onClick={() => makeBid('call', suit)}
                        className="bg-[var(--color-fircik-green)] text-white p-6 rounded-xl hover:bg-[var(--color-fircik-green-light)] transition-colors text-4xl font-bold shadow-lg hover:scale-105 transform duration-200"
                      >
                        {suit}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => makeBid('dalje')}
                  className="w-full bg-[var(--color-fircik-gray)] text-white py-4 rounded-xl hover:bg-[var(--color-fircik-gray-light)] transition-colors font-semibold text-lg"
                >
                  Dalje (Predaj)
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-[var(--color-fircik-gray)]">
                  Čeka se na igrača: <span className="text-[var(--color-fircik-green)] font-semibold">{getCurrentPlayerName()}</span>
                </p>
                <div className="mt-6 animate-pulse">
                  <div className="w-16 h-16 mx-auto bg-[var(--color-fircik-green)] rounded-full"></div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[var(--color-fircik-gray-light)]">
              <p className="text-sm text-[var(--color-fircik-gray)] text-center">
                Bidding redosled: {(gameState.bids || []).map((b: any) => b.bid).join(' → ')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Talon Exchange Phase (3-player)
  if (gameState.phase === 'talon-exchange' && gameState.trumpCaller === user?.id) {
    const myHand = gameState.hands?.[user?.id] || [];

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] landscape-only p-8">
        <div className="h-full flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full"
          >
            <h2 className="text-3xl text-[var(--color-fircik-green-dark)] mb-6 text-center font-semibold">
              Razmena talona
            </h2>

            <p className="text-center text-[var(--color-fircik-gray)] mb-6 text-lg">
              Odaberite 2 karte za vraćanje (ne možete vratiti keca ili deseticu)
            </p>

            <div className="mb-6">
              <h3 className="text-xl text-[var(--color-fircik-green-dark)] mb-3 font-semibold">Talon (2 karte):</h3>
              <div className="flex gap-4 justify-center">
                {(gameState.talon || []).map((card: any, i: number) => (
                  <Card key={i} rank={card.rank} suit={card.suit} />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl text-[var(--color-fircik-green-dark)] mb-3 font-semibold">
                Vaše karte (odaberite 2 za vraćanje):
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {myHand.map((card: any, index: number) => {
                  const isSelected = selectedTalonCards.some(c => c.suit === card.suit && c.rank === card.rank);
                  const cannotReturn = card.rank === 'A' || card.rank === '10';
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (cannotReturn) {
                          alert('Ne možete vratiti keca ili deseticu');
                          return;
                        }
                        
                        if (isSelected) {
                          setSelectedTalonCards(selectedTalonCards.filter(c => !(c.suit === card.suit && c.rank === card.rank)));
                        } else {
                          if (selectedTalonCards.length < 2) {
                            setSelectedTalonCards([...selectedTalonCards, card]);
                          } else {
                            alert('Možete odabrati maksimalno 2 karte');
                          }
                        }
                      }}
                      className={`cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-110 ring-4 ring-[var(--color-fircik-gold)] rounded-lg' : ''} ${cannotReturn ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      <Card rank={card.rank} suit={card.suit} />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={exchangeTalon}
              disabled={selectedTalonCards.length !== 2}
              className="w-full bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] py-4 rounded-xl hover:bg-[var(--color-fircik-gold-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              Potvrdi razmenu ({selectedTalonCards.length}/2)
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Playing Phase
  const myHand = gameState.hands?.[user?.id] || [];
  const suits = ['♠', '♥', '♦', '♣'];
  const myGamePoints = gameState.variant === '4-player' 
    ? `${gameState.gamePoints?.team1 || 0} : ${gameState.gamePoints?.team2 || 0}`
    : (gameState.gamePoints?.[user?.id] || 0);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] landscape-only overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 bg-[var(--color-fircik-green-dark)] bg-opacity-90 backdrop-blur-sm p-3 flex justify-between items-center z-20 border-b-2 border-[var(--color-fircik-gold)]">
        <button
          onClick={onBackToLobby}
          className="bg-[var(--color-fircik-red)] hover:bg-[var(--color-fircik-red-light)] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Napusti
        </button>

        <div className="flex items-center gap-4">
          <div className="bg-[var(--color-fircik-gold)] bg-opacity-30 px-4 py-2 rounded-full border-2 border-[var(--color-fircik-gold)]">
            <span className="text-[var(--color-fircik-gold)] font-semibold">Adut: {gameState.trumpSuit}</span>
          </div>
          
          <div className="bg-[var(--color-fircik-white)] bg-opacity-20 px-4 py-2 rounded-full text-white">
            <span>Runda: {gameState.round}</span>
          </div>

          <div className="bg-[var(--color-fircik-green)] px-4 py-2 rounded-full text-white">
            <Star className="inline w-4 h-4 mr-2 text-[var(--color-fircik-gold)]" />
            <span>Poeni: {myGamePoints} / 12</span>
          </div>
        </div>

        <div className="bg-[var(--color-fircik-green)] px-4 py-2 rounded-lg text-white">
          <Coins className="inline w-5 h-5 mr-2 text-[var(--color-fircik-gold)]" />
          <span>{user?.novčići || 0}</span>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] px-8 py-4 rounded-xl shadow-2xl z-30 font-semibold text-lg"
          >
            <Star className="inline w-6 h-6 mr-2" />
            {showNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Table - Main playing area */}
      <div className="h-full pt-16 pb-4 px-6 flex flex-col">
        {/* Opponents Area - Top section */}
        <div className="flex justify-around items-start py-4">
          {gameState.players
            ?.filter((p: any) => p.id !== user?.id)
            .map((opponent: any) => {
              const isCurrentPlayer = gameState.players?.[gameState.currentPlayerIndex]?.id === opponent.id;
              const opponentPoints = gameState.gamePoints?.[opponent.id] || 0;
              
              return (
                <div key={opponent.id} className="flex flex-col items-center">
                  <img
                    src={opponent.avatar}
                    alt={opponent.username}
                    className={`w-14 h-14 rounded-full border-4 mb-2 ${
                      isCurrentPlayer
                        ? 'border-[var(--color-fircik-gold)] shadow-lg shadow-[var(--color-fircik-gold)]'
                        : 'border-[var(--color-fircik-white)]'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                  <p className="text-sm text-white mb-1 font-medium">{opponent.username}</p>
                  <p className="text-sm text-[var(--color-fircik-gold)] mb-2">{opponentPoints} poena</p>
                  
                  <div className="flex gap-1">
                    {[...Array(gameState.hands?.[opponent.id]?.length || 0)].map((_, i) => (
                      <div key={i} className="w-10 h-14 bg-gradient-to-br from-[var(--color-fircik-green)] to-[var(--color-fircik-green-light)] rounded border-2 border-[var(--color-fircik-gold)] flex items-center justify-center">
                        <span className="text-2xl text-[var(--color-fircik-gold)]">🂠</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Center - Trick Area - Properly centered */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="relative bg-[var(--color-fircik-green)] bg-opacity-40 rounded-3xl p-8 min-w-[500px] min-h-[240px] flex items-center justify-center border-4 border-[var(--color-fircik-gold)] border-dashed">
            {gameState.currentTrick?.length === 0 ? (
              <div className="text-center">
                <p className="text-xl text-[var(--color-fircik-beige)] mb-2 font-medium">
                  {isMyTurn() ? '🎯 Vaš red - odigrajte kartu' : `⏳ Red igrača ${getCurrentPlayerName()}`}
                </p>
                {isMyTurn() && (
                  <p className="text-sm text-[var(--color-fircik-gold)]">
                    Morate pratiti boju ako možete
                  </p>
                )}
              </div>
            ) : (
              <div className="flex gap-4">
                {gameState.currentTrick?.map((card: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: -30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card rank={card.rank} suit={card.suit} className="transform scale-125" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Hand - Bottom section, properly spaced */}
        <div className="pb-2">
          {/* Player Info Bar */}
          <div className="flex items-center justify-between mb-3 bg-[var(--color-fircik-green-dark)] bg-opacity-50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar}
                alt={user?.username}
                className={`w-12 h-12 rounded-full border-4 ${
                  isMyTurn() ? 'border-[var(--color-fircik-gold)] shadow-lg shadow-[var(--color-fircik-gold)]' : 'border-[var(--color-fircik-white)]'
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
              <div>
                <p className="text-sm text-white font-medium">{user?.username}</p>
                <p className="text-sm text-[var(--color-fircik-gold)]">{myGamePoints} / 12 poena</p>
              </div>
            </div>

            {/* Cvancik/Fircik Buttons */}
            <div className="flex gap-2">
              {suits.map((suit) => {
                const hasKing = myHand.some((c: any) => c.rank === 'K' && c.suit === suit);
                const hasQueen = myHand.some((c: any) => c.rank === 'Q' && c.suit === suit);
                const canCall = hasKing && hasQueen;
                const isFircik = suit === gameState.trumpSuit;
                const playerCvanciks = gameState.cvancikCount?.[user?.id] || 0;
                const maxReached = playerCvanciks >= 3;

                return (
                  <button
                    key={suit}
                    onClick={() => canCall && !maxReached && callCvancik(suit)}
                    disabled={!canCall || maxReached}
                    className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                      canCall && !maxReached
                        ? 'bg-[var(--color-fircik-gold)] hover:bg-[var(--color-fircik-gold-light)] text-[var(--color-fircik-green-dark)] hover:scale-105'
                        : 'bg-[var(--color-fircik-gray)] bg-opacity-30 cursor-not-allowed opacity-40 text-white'
                    }`}
                    title={isFircik ? 'Fircik +40' : 'Cvancik +20'}
                  >
                    {suit} K+Q
                  </button>
                );
              })}
            </div>

            <div className="text-sm text-[var(--color-fircik-beige)]">
              Cvancik: {gameState.cvancikCount?.[user?.id] || 0}/3
            </div>
          </div>

          {/* Cards - Properly centered and spaced */}
          <div className="flex justify-center gap-2 px-4">
            {myHand.map((card: any, index: number) => (
              <div
                key={index}
                className={isMyTurn() ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : 'opacity-50 cursor-not-allowed'}
              >
                <Card
                  rank={card.rank}
                  suit={card.suit}
                  onClick={() => isMyTurn() && playCard(card)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
