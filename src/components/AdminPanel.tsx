import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Ban, Trophy, Calendar, DollarSign, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

interface AdminPanelProps {
  user: any;
  accessToken: string;
  onBack: () => void;
}

export function AdminPanel({ user, accessToken, onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'tournaments'>('users');
  
  // Tournament form
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [prizePool, setPrizePool] = useState(1000);

  useEffect(() => {
    fetchUsers();
    fetchTournaments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch users error:', err);
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/tournaments`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (err) {
      console.error('Fetch tournaments error:', err);
    }
  };

  const toggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/admin/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ userId, ban: !currentlyBanned })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || 'Greška pri blokiranju korisnika');
      }
    } catch (err) {
      console.error('Ban user error:', err);
      alert('Greška pri blokiranju korisnika');
    }
  };

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tournamentName || !tournamentDate) {
      alert('Molimo popunite sva polja');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15/admin/tournament`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            name: tournamentName,
            startDate: tournamentDate,
            maxPlayers,
            prizePool
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('Turnir je uspešno kreiran!');
        setTournamentName('');
        setTournamentDate('');
        setMaxPlayers(16);
        setPrizePool(1000);
        fetchTournaments();
      } else {
        alert(data.error || 'Greška pri kreiranju turnira');
      }
    } catch (err) {
      console.error('Create tournament error:', err);
      alert('Greška pri kreiranju turnira');
    }
  };

  if (!user.isAdmin) {
    return (
      <div className="fixed inset-0 bg-[var(--color-fircik-green-dark)] flex items-center justify-center landscape-only">
        <div className="bg-white rounded-2xl p-12 text-center">
          <Shield className="w-24 h-24 mx-auto mb-6 text-[var(--color-fircik-red)]" />
          <h2 className="text-3xl text-[var(--color-fircik-green-dark)] mb-4">
            Pristup odbijen
          </h2>
          <p className="text-[var(--color-fircik-gray)] mb-8">
            Nemate administratorske privilegije.
          </p>
          <button
            onClick={onBack}
            className="bg-[var(--color-fircik-green)] text-white px-8 py-3 rounded-lg hover:bg-[var(--color-fircik-green-light)] transition-colors"
          >
            Nazad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] landscape-only">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-[var(--color-fircik-green-dark)] bg-opacity-80 backdrop-blur-sm p-4 flex justify-between items-center">
        <button
          onClick={onBack}
          className="bg-[var(--color-fircik-green-light)] hover:bg-[var(--color-fircik-green-lighter)] px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Nazad
        </button>
        
        <h1 className="text-3xl">
          <Shield className="inline w-8 h-8 mr-3" />
          Admin Panel
        </h1>
        
        <div className="w-32" />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-8 h-full">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] shadow-lg'
                : 'bg-[var(--color-fircik-white)] bg-opacity-20 hover:bg-opacity-30'
            }`}
          >
            <Users className="inline w-5 h-5 mr-2" />
            Korisnici
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-8 py-3 rounded-xl transition-all ${
              activeTab === 'tournaments'
                ? 'bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] shadow-lg'
                : 'bg-[var(--color-fircik-white)] bg-opacity-20 hover:bg-opacity-30'
            }`}
          >
            <Trophy className="inline w-5 h-5 mr-2" />
            Turniri
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl h-[calc(100%-5rem)] overflow-y-auto"
          >
            <h2 className="text-2xl text-[var(--color-fircik-green-dark)] mb-6">
              Upravljanje korisnicima ({users.length})
            </h2>

            {loading ? (
              <p className="text-center text-[var(--color-fircik-gray)] py-12">
                Učitavanje...
              </p>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 bg-[var(--color-fircik-beige)] rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={u.avatar}
                        alt={u.username}
                        className="w-16 h-16 rounded-full border-2 border-[var(--color-fircik-green)]"
                      />
                      <div>
                        <p className="text-lg text-[var(--color-fircik-green-dark)]">
                          {u.username}
                          {u.isAdmin && (
                            <span className="ml-2 text-xs bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] px-2 py-1 rounded">
                              ADMIN
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="ml-2 text-xs bg-[var(--color-fircik-red)] text-white px-2 py-1 rounded">
                              BLOKIRAN
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-[var(--color-fircik-gray)]">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm text-[var(--color-fircik-gray)]">Partije</p>
                        <p className="text-lg text-[var(--color-fircik-green-dark)]">
                          {u.ukupnoOdigranihPartija}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--color-fircik-gray)]">Pobede</p>
                        <p className="text-lg text-[var(--color-fircik-green-dark)]">
                          {u.ukupnoPobeda}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--color-fircik-gray)]">Novčići</p>
                        <p className="text-lg text-[var(--color-fircik-gold)]">
                          {u.novčići}
                        </p>
                      </div>

                      {!u.isAdmin && (
                        <button
                          onClick={() => toggleBan(u.id, u.isBanned)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            u.isBanned
                              ? 'bg-[var(--color-fircik-green)] hover:bg-[var(--color-fircik-green-light)] text-white'
                              : 'bg-[var(--color-fircik-red)] hover:bg-[var(--color-fircik-red-light)] text-white'
                          }`}
                        >
                          <Ban className="inline w-4 h-4 mr-2" />
                          {u.isBanned ? 'Odblokiraj' : 'Blokiraj'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-8 h-[calc(100%-5rem)]"
          >
            {/* Create Tournament Form */}
            <div className="bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl text-[var(--color-fircik-green-dark)] mb-6">
                Kreiraj novi turnir
              </h2>

              <form onSubmit={createTournament} className="space-y-4">
                <div>
                  <label className="block text-[var(--color-fircik-gray)] mb-2">
                    Naziv turnira
                  </label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)]"
                    placeholder="Zimski Fircik Turnir 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[var(--color-fircik-gray)] mb-2">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Datum početka
                  </label>
                  <input
                    type="datetime-local"
                    value={tournamentDate}
                    onChange={(e) => setTournamentDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[var(--color-fircik-gray)] mb-2">
                    <Users className="inline w-4 h-4 mr-2" />
                    Maksimalan broj igrača
                  </label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)]"
                  >
                    <option value={8}>8 igrača</option>
                    <option value={16}>16 igrača</option>
                    <option value={32}>32 igrača</option>
                    <option value={64}>64 igrača</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--color-fircik-gray)] mb-2">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    Nagradni fond (novčići)
                  </label>
                  <input
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)]"
                    min={100}
                    step={100}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--color-fircik-gold)] hover:bg-[var(--color-fircik-gold-light)] text-[var(--color-fircik-green-dark)] py-4 rounded-lg transition-colors shadow-lg"
                >
                  <Trophy className="inline w-5 h-5 mr-2" />
                  Kreiraj turnir
                </button>
              </form>
            </div>

            {/* Tournaments List */}
            <div className="bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl overflow-y-auto">
              <h2 className="text-2xl text-[var(--color-fircik-green-dark)] mb-6">
                Aktivni turniri ({tournaments.length})
              </h2>

              {tournaments.length === 0 ? (
                <p className="text-center text-[var(--color-fircik-gray)] py-12">
                  Trenutno nema aktivnih turnira
                </p>
              ) : (
                <div className="space-y-4">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="p-6 bg-[var(--color-fircik-beige)] rounded-xl"
                    >
                      <h3 className="text-xl text-[var(--color-fircik-green-dark)] mb-3">
                        <Trophy className="inline w-5 h-5 mr-2 text-[var(--color-fircik-gold)]" />
                        {tournament.name}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-[var(--color-fircik-gray)]">
                          <Calendar className="inline w-4 h-4 mr-2" />
                          {new Date(tournament.startDate).toLocaleString('sr-RS')}
                        </p>
                        <p className="text-[var(--color-fircik-gray)]">
                          <Users className="inline w-4 h-4 mr-2" />
                          {tournament.participants?.length || 0} / {tournament.maxPlayers} igrača
                        </p>
                        <p className="text-[var(--color-fircik-gray)]">
                          <DollarSign className="inline w-4 h-4 mr-2" />
                          Nagradni fond: {tournament.prizePool} novčića
                        </p>
                        <p className="text-[var(--color-fircik-gray)]">
                          Status: <span className={`px-2 py-1 rounded ${
                            tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                            tournament.status === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tournament.status === 'upcoming' ? 'Nadolazeći' :
                             tournament.status === 'active' ? 'Aktivan' : 'Završen'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
