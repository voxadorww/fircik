import { motion } from 'motion/react';
import { ArrowLeft, User, Trophy, Coins, Star, Award, TrendingUp } from 'lucide-react';

interface ProfileScreenProps {
  user: any;
  onBack: () => void;
}

export function ProfileScreen({ user, onBack }: ProfileScreenProps) {
  const winRate = user.ukupnoOdigranihPartija > 0
    ? ((user.ukupnoPobeda / user.ukupnoOdigranihPartija) * 100).toFixed(1)
    : 0;

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
        
        <h1 className="text-3xl">🂡 Profil</h1>
        
        <div className="w-32" />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-8 h-full flex gap-8">
        {/* Left Panel - User Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-96 bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-[var(--color-fircik-gold)]"
            />
            <h2 className="text-3xl text-[var(--color-fircik-green-dark)] mb-2">
              {user.username}
            </h2>
            <p className="text-[var(--color-fircik-gray)]">{user.email}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--color-fircik-gold)] bg-opacity-20 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--color-fircik-gray)]">Novčići</span>
                <Coins className="w-5 h-5 text-[var(--color-fircik-gold)]" />
              </div>
              <p className="text-3xl text-[var(--color-fircik-green-dark)]">
                {user.novčići}
              </p>
              <p className="text-sm text-[var(--color-fircik-gray)] mt-2">
                Dnevno: {user.dailyCoins} novčića
              </p>
            </div>

            <div className="bg-[var(--color-fircik-beige)] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--color-fircik-gray)]">Poeni</span>
                <Star className="w-5 h-5 text-[var(--color-fircik-gold)]" />
              </div>
              <p className="text-3xl text-[var(--color-fircik-green-dark)]">
                {user.poeni}
              </p>
            </div>

            <div className="bg-[var(--color-fircik-beige)] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--color-fircik-gray)]">Član od</span>
                <User className="w-5 h-5 text-[var(--color-fircik-green)]" />
              </div>
              <p className="text-[var(--color-fircik-green-dark)]">
                {new Date(user.createdAt).toLocaleDateString('sr-RS')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Statistics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-[var(--color-fircik-white)] rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-3xl text-[var(--color-fircik-green-dark)] mb-8">
            <Trophy className="inline w-8 h-8 mr-3" />
            Statistika
          </h2>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[var(--color-fircik-green)] to-[var(--color-fircik-green-light)] p-6 rounded-xl text-white text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3" />
              <p className="text-4xl mb-2">{user.ukupnoPobeda}</p>
              <p className="text-sm opacity-80">Pobeda</p>
            </div>

            <div className="bg-gradient-to-br from-[var(--color-fircik-gold)] to-[var(--color-fircik-gold-light)] p-6 rounded-xl text-[var(--color-fircik-green-dark)] text-center">
              <Award className="w-12 h-12 mx-auto mb-3" />
              <p className="text-4xl mb-2">{user.ukupnoOdigranihPartija}</p>
              <p className="text-sm opacity-80">Ukupno partija</p>
            </div>

            <div className="bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] p-6 rounded-xl text-white text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3" />
              <p className="text-4xl mb-2">{winRate}%</p>
              <p className="text-sm opacity-80">Stopa pobeda</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--color-fircik-beige)] p-6 rounded-xl">
              <h3 className="text-xl text-[var(--color-fircik-green-dark)] mb-4">
                Dostignuća
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-[var(--color-fircik-gold)] bg-opacity-20 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-[var(--color-fircik-gold)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-fircik-gray)]">Prva pobeda</p>
                    <p className="text-[var(--color-fircik-green-dark)]">
                      {user.ukupnoPobeda > 0 ? '✓ Otkljucano' : 'Zaključano'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-[var(--color-fircik-gold)] bg-opacity-20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-[var(--color-fircik-gold)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-fircik-gray)]">10 pobeda</p>
                    <p className="text-[var(--color-fircik-green-dark)]">
                      {user.ukupnoPobeda >= 10 ? '✓ Otkljucano' : `${user.ukupnoPobeda}/10`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-[var(--color-fircik-gold)] bg-opacity-20 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-[var(--color-fircik-gold)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-fircik-gray)]">50 partija</p>
                    <p className="text-[var(--color-fircik-green-dark)]">
                      {user.ukupnoOdigranihPartija >= 50 ? '✓ Otkljucano' : `${user.ukupnoOdigranihPartija}/50`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-[var(--color-fircik-gold)] bg-opacity-20 rounded-full flex items-center justify-center">
                    <Coins className="w-6 h-6 text-[var(--color-fircik-gold)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-fircik-gray)]">1000 novčića</p>
                    <p className="text-[var(--color-fircik-green-dark)]">
                      {user.novčići >= 1000 ? '✓ Otkljucano' : `${user.novčići}/1000`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-fircik-beige)] p-6 rounded-xl">
              <h3 className="text-xl text-[var(--color-fircik-green-dark)] mb-4">
                Kupovina novčića
              </h3>
              <p className="text-sm text-[var(--color-fircik-gray)] mb-4">
                Kupite dodatne novčiće da nastavite da igrate bez čekanja dnevnog osvežavanja.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button className="bg-[var(--color-fircik-green)] text-white p-4 rounded-lg hover:bg-[var(--color-fircik-green-light)] transition-colors">
                  <Coins className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xl">100</p>
                  <p className="text-sm opacity-80">$0.99</p>
                </button>
                <button className="bg-[var(--color-fircik-gold)] text-[var(--color-fircik-green-dark)] p-4 rounded-lg hover:bg-[var(--color-fircik-gold-light)] transition-colors">
                  <Coins className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xl">500</p>
                  <p className="text-sm opacity-80">$3.99</p>
                </button>
                <button className="bg-[var(--color-fircik-green-dark)] text-white p-4 rounded-lg hover:bg-[var(--color-fircik-green)] transition-colors">
                  <Coins className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xl">1000</p>
                  <p className="text-sm opacity-80">$6.99</p>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
