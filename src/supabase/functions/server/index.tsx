import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase client helper
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// ============= AUTH ROUTES =============

// Sign up
app.post('/make-server-efd87c15/signup', async (c) => {
  try {
    const { email, password, username } = await c.req.json();
    
    if (!email || !password || !username) {
      return c.json({ error: 'Sva polja su obavezna' }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Check if user already exists
    const existingUser = await kv.get(`user:email:${email}`);
    if (existingUser) {
      return c.json({ error: 'Korisnik sa ovim emailom već postoji' }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    });

    if (authError) {
      console.log('Auth signup error:', authError);
      return c.json({ error: 'Greška pri registraciji: ' + authError.message }, 400);
    }

    // Create user profile
    const userProfile = {
      id: authData.user.id,
      username,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      ukupnoOdigranihPartija: 0,
      ukupnoPobeda: 0,
      poeni: 0,
      novčići: 100, // Starting coins
      dailyCoins: 50, // Daily refresh
      lastCoinRefresh: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      isAdmin: false,
      isBanned: false
    };

    await kv.set(`user:${authData.user.id}`, userProfile);
    await kv.set(`user:email:${email}`, authData.user.id);
    await kv.set(`user:username:${username}`, authData.user.id);

    return c.json({ 
      success: true, 
      user: userProfile,
      message: 'Uspešno registrovan!' 
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Greška servera pri registraciji' }, 500);
  }
});

// Sign in
app.post('/make-server-efd87c15/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email i lozinka su obavezni' }, 400);
    }

    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('Auth signin error:', authError);
      return c.json({ error: 'Neispravni podaci za prijavu' }, 400);
    }

    const userId = authData.user.id;
    const userProfile = await kv.get(`user:${userId}`);

    if (!userProfile) {
      return c.json({ error: 'Korisnički profil nije pronađen' }, 404);
    }

    if (userProfile.isBanned) {
      return c.json({ error: 'Vaš nalog je blokiran' }, 403);
    }

    // Refresh daily coins
    const today = new Date().toISOString().split('T')[0];
    if (userProfile.lastCoinRefresh !== today) {
      userProfile.dailyCoins = 50;
      userProfile.lastCoinRefresh = today;
      await kv.set(`user:${userId}`, userProfile);
    }

    return c.json({ 
      success: true, 
      accessToken: authData.session.access_token,
      user: userProfile
    });
  } catch (error) {
    console.log('Signin error:', error);
    return c.json({ error: 'Greška servera pri prijavi' }, 500);
  }
});

// Get current user
app.get('/make-server-efd87c15/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: 'Profil nije pronađen' }, 404);
    }

    return c.json({ user: userProfile });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Greška servera' }, 500);
  }
});

// ============= LOBBY & MATCHMAKING =============

// Join lobby
app.post('/make-server-efd87c15/lobby/join', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.isBanned) {
      return c.json({ error: 'Ne možete pristupiti lobiju' }, 403);
    }

    // Add to lobby
    const lobbyPlayer = {
      id: user.id,
      username: userProfile.username,
      avatar: userProfile.avatar,
      poeni: userProfile.poeni,
      joinedAt: Date.now()
    };

    await kv.set(`lobby:player:${user.id}`, lobbyPlayer);

    return c.json({ success: true, player: lobbyPlayer });
  } catch (error) {
    console.log('Join lobby error:', error);
    return c.json({ error: 'Greška pri priključivanju lobiju' }, 500);
  }
});

// Get lobby players
app.get('/make-server-efd87c15/lobby/players', async (c) => {
  try {
    const players = await kv.getByPrefix('lobby:player:');
    
    // Remove stale players (older than 5 minutes)
    const now = Date.now();
    const activePlayers = [];
    for (const player of players) {
      if (now - player.joinedAt < 5 * 60 * 1000) {
        activePlayers.push(player);
      } else {
        await kv.del(`lobby:player:${player.id}`);
      }
    }

    return c.json({ players: activePlayers });
  } catch (error) {
    console.log('Get lobby players error:', error);
    return c.json({ error: 'Greška pri učitavanju igrača' }, 500);
  }
});

// Leave lobby
app.post('/make-server-efd87c15/lobby/leave', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    await kv.del(`lobby:player:${user.id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Leave lobby error:', error);
    return c.json({ error: 'Greška pri napuštanju lobija' }, 500);
  }
});

// Start matchmaking
app.post('/make-server-efd87c15/matchmaking/start', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const { playerCount } = await c.req.json();
    if (![2, 3, 4].includes(playerCount)) {
      return c.json({ error: 'Neispravan broj igrača' }, 400);
    }

    // Get available lobby players
    const lobbyPlayers = await kv.getByPrefix('lobby:player:');
    const availablePlayers = lobbyPlayers.filter(p => p.id !== user.id);

    if (availablePlayers.length < playerCount - 1) {
      return c.json({ 
        success: false, 
        message: 'Nema dovoljno igrača u lobiju',
        waiting: true 
      });
    }

    // Match with random players
    const selectedPlayers = availablePlayers
      .sort(() => Math.random() - 0.5)
      .slice(0, playerCount - 1);

    const currentPlayer = await kv.get(`lobby:player:${user.id}`);
    const allPlayers = [currentPlayer, ...selectedPlayers];

    // Create game
    const gameId = `game:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const game = {
      id: gameId,
      players: allPlayers,
      playerCount,
      status: 'starting',
      createdAt: Date.now()
    };

    await kv.set(gameId, game);

    // Remove players from lobby
    for (const player of allPlayers) {
      await kv.del(`lobby:player:${player.id}`);
    }

    return c.json({ success: true, gameId, game });
  } catch (error) {
    console.log('Start matchmaking error:', error);
    return c.json({ error: 'Greška pri traženju protivnika' }, 500);
  }
});

// ============= GAME LOGIC =============

// Initialize game
app.post('/make-server-efd87c15/game/init', async (c) => {
  try {
    const { gameId } = await c.req.json();
    const game = await kv.get(gameId);
    
    if (!game) {
      return c.json({ error: 'Igra nije pronađena' }, 404);
    }

    // Create deck (32 cards) - Marijaš standard
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, value: getCardValue(rank) });
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const hands = {};
    const playerCount = game.playerCount;
    
    // Deal cards based on player count
    if (playerCount === 3) {
      // 3-player: Deal 5 cards each, 2 to talon, then 5 more = 12 cards per player
      game.players.forEach((player, index) => {
        hands[player.id] = deck.slice(index * 5, (index + 1) * 5);
      });
      
      const talon = deck.slice(15, 17); // 2 cards for talon
      
      // Second deal (5 more cards each)
      game.players.forEach((player, index) => {
        hands[player.id] = [
          ...hands[player.id],
          ...deck.slice(17 + index * 5, 17 + (index + 1) * 5)
        ];
      });

      // Initialize game state for 3 players
      const gameState = {
        ...game,
        status: 'bidding',
        phase: 'bidding',
        hands,
        talon,
        trumpSuit: null,
        trumpCaller: null,
        currentPlayerIndex: 0,
        dealerIndex: 0,
        currentTrick: [],
        tricks: [],
        gamePoints: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}), // Game points (to 12)
        roundScores: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}), // Round scores
        cvancikCount: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
        additionalGame: null,
        bids: [],
        round: 1,
        targetScore: 12,
        coinCost: 10,
        variant: '3-player'
      };

      await kv.set(gameId, gameState);
      return c.json({ success: true, gameState });
      
    } else if (playerCount === 4) {
      // 4-player pairs: Deal 4 cards, then 4 more = 8 cards per player
      game.players.forEach((player, index) => {
        hands[player.id] = deck.slice(index * 4, (index + 1) * 4);
      });

      // Initialize game state for 4 players
      const gameState = {
        ...game,
        status: 'bidding',
        phase: 'bidding',
        hands,
        trumpSuit: null,
        trumpCaller: null,
        partnerCard: null,
        partnerPlayerId: null,
        revealedPartner: false,
        teams: { team1: [], team2: [] },
        currentPlayerIndex: 0,
        dealerIndex: 0,
        currentTrick: [],
        tricks: [],
        gamePoints: { team1: 0, team2: 0 },
        roundScores: { team1: 0, team2: 0 },
        cvancikCount: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
        additionalGame: null,
        bids: [],
        round: 1,
        targetScore: 12,
        coinCost: 10,
        variant: '4-player',
        firstDealComplete: false
      };

      await kv.set(gameId, gameState);
      return c.json({ success: true, gameState });
      
    } else if (playerCount === 2) {
      // 2-player: Deal 6 cards each (simplified variant)
      game.players.forEach((player, index) => {
        hands[player.id] = deck.slice(index * 6, (index + 1) * 6);
      });

      const gameState = {
        ...game,
        status: 'bidding',
        phase: 'bidding',
        hands,
        trumpSuit: null,
        currentPlayerIndex: 0,
        dealerIndex: 0,
        currentTrick: [],
        tricks: [],
        gamePoints: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
        roundScores: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
        cvancikCount: game.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
        round: 1,
        targetScore: 12,
        coinCost: 10,
        variant: '2-player'
      };

      await kv.set(gameId, gameState);
      return c.json({ success: true, gameState });
    }

    return c.json({ error: 'Neispravan broj igrača' }, 400);
  } catch (error) {
    console.log('Init game error:', error);
    return c.json({ error: 'Greška pri inicijalizaciji igre' }, 500);
  }
});

// Get game state
app.get('/make-server-efd87c15/game/:gameId', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    const gameState = await kv.get(gameId);
    
    if (!gameState) {
      return c.json({ error: 'Igra nije pronađena' }, 404);
    }

    return c.json({ gameState });
  } catch (error) {
    console.log('Get game error:', error);
    return c.json({ error: 'Greška pri učitavanju igre' }, 500);
  }
});

// Play card
app.post('/make-server-efd87c15/game/play', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const { gameId, card } = await c.req.json();
    const gameState = await kv.get(gameId);
    
    if (!gameState) {
      return c.json({ error: 'Igra nije pronađena' }, 404);
    }

    // Validate turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== user.id) {
      return c.json({ error: 'Nije vaš red' }, 400);
    }

    // Remove card from hand
    const playerHand = gameState.hands[user.id];
    const cardIndex = playerHand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
    
    if (cardIndex === -1) {
      return c.json({ error: 'Nemate tu kartu' }, 400);
    }

    playerHand.splice(cardIndex, 1);

    // Add card to current trick
    gameState.currentTrick.push({ ...card, playerId: user.id });

    // Check if trick is complete
    if (gameState.currentTrick.length === gameState.playerCount) {
      // Determine winner
      const winner = determineTrickWinner(gameState.currentTrick, gameState.trumpSuit);
      const winnerIndex = gameState.players.findIndex(p => p.id === winner.playerId);

      // Calculate points
      const trickPoints = gameState.currentTrick.reduce((sum, c) => sum + c.value, 0);
      
      // Update scores based on variant
      if (gameState.variant === '4-player') {
        // 4-player: Add to team score
        const winnerTeam = getPlayerTeam(gameState, winner.playerId);
        if (winnerTeam) {
          gameState.roundScores[winnerTeam] += trickPoints;
        }
      } else {
        // 2 or 3-player: Individual scores
        gameState.roundScores[winner.playerId] += trickPoints;
      }

      // Store trick
      gameState.tricks.push({
        cards: [...gameState.currentTrick],
        winner: winner.playerId,
        points: trickPoints
      });

      // Reset trick and set next player
      gameState.currentTrick = [];
      gameState.currentPlayerIndex = winnerIndex;

      // Check if round is over (all cards played)
      const allHandsEmpty = Object.values(gameState.hands).every((hand: any) => hand.length === 0);
      
      if (allHandsEmpty) {
        // Add last trick bonus (+10 points)
        const lastTrickWinner = gameState.tricks[gameState.tricks.length - 1].winner;
        
        if (gameState.variant === '4-player') {
          const winnerTeam = getPlayerTeam(gameState, lastTrickWinner);
          if (winnerTeam) {
            gameState.roundScores[winnerTeam] += 10;
          }
        } else {
          gameState.roundScores[lastTrickWinner] += 10;
        }

        // Calculate round results and update game points
        if (gameState.variant === '3-player') {
          // 3-player: Trump caller vs others
          const callerScore = gameState.roundScores[gameState.trumpCaller] || 0;
          const opponentsScore = Object.entries(gameState.roundScores)
            .filter(([id]) => id !== gameState.trumpCaller)
            .reduce((sum, [, score]) => sum + (score as number), 0);

          if (callerScore > opponentsScore) {
            // Caller won
            gameState.gamePoints[gameState.trumpCaller] = (gameState.gamePoints[gameState.trumpCaller] || 0) + 1;
          } else if (opponentsScore > callerScore) {
            // Opponents won
            gameState.players.forEach(p => {
              if (p.id !== gameState.trumpCaller) {
                gameState.gamePoints[p.id] = (gameState.gamePoints[p.id] || 0) + 1;
              }
            });
          }
        } else if (gameState.variant === '4-player') {
          // 4-player: Team with more points wins
          if (gameState.roundScores.team1 > gameState.roundScores.team2) {
            gameState.gamePoints.team1++;
          } else if (gameState.roundScores.team2 > gameState.roundScores.team1) {
            gameState.gamePoints.team2++;
          }
        } else {
          // 2-player
          const [p1, p2] = gameState.players;
          if (gameState.roundScores[p1.id] > gameState.roundScores[p2.id]) {
            gameState.gamePoints[p1.id] = (gameState.gamePoints[p1.id] || 0) + 1;
          } else if (gameState.roundScores[p2.id] > gameState.roundScores[p1.id]) {
            gameState.gamePoints[p2.id] = (gameState.gamePoints[p2.id] || 0) + 1;
          }
        }

        // Check if game is over (reached 12 points)
        const maxPoints = Math.max(...Object.values(gameState.gamePoints).map(p => Number(p)));
        
        if (maxPoints >= gameState.targetScore) {
          // Game over
          gameState.status = 'finished';
          
          if (gameState.variant === '4-player') {
            gameState.winner = gameState.gamePoints.team1 > gameState.gamePoints.team2 ? 'team1' : 'team2';
          } else {
            const winnerId = Object.entries(gameState.gamePoints)
              .reduce((max, [id, pts]) => (pts as number) > (max.points as number) ? { id, points: pts } : max, { id: null, points: 0 }).id;
            gameState.winner = winnerId;
          }

          // Update user stats and coins
          for (const player of gameState.players) {
            const userProfile = await kv.get(`user:${player.id}`);
            if (userProfile) {
              userProfile.ukupnoOdigranihPartija++;
              
              let isWinner = false;
              if (gameState.variant === '4-player') {
                const playerTeam = getPlayerTeam(gameState, player.id);
                isWinner = playerTeam === gameState.winner;
              } else {
                isWinner = player.id === gameState.winner;
              }
              
              if (isWinner) {
                userProfile.ukupnoPobeda++;
                userProfile.novčići += gameState.coinCost * 2;
              } else {
                userProfile.novčići -= gameState.coinCost;
              }
              
              userProfile.poeni += (gameState.gamePoints[player.id] || 0);
              await kv.set(`user:${player.id}`, userProfile);
            }
          }
        } else {
          // Start new round
          gameState.round++;
          gameState.phase = 'redeal';
          gameState.roundScores = gameState.variant === '4-player' 
            ? { team1: 0, team2: 0 }
            : gameState.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
          gameState.tricks = [];
          gameState.bids = [];
        }
      }
    } else {
      // Next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.playerCount;
    }

    await kv.set(gameId, gameState);

    return c.json({ success: true, gameState });
  } catch (error) {
    console.log('Play card error:', error);
    return c.json({ error: 'Greška pri igranju karte' }, 500);
  }
});

// Call Cvancik/Fircik
app.post('/make-server-efd87c15/game/call', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const { gameId, suit } = await c.req.json();
    const gameState = await kv.get(gameId);
    
    if (!gameState) {
      return c.json({ error: 'Igra nije pronađena' }, 404);
    }

    // Validate call
    const playerHand = gameState.hands[user.id];
    const hasKing = playerHand.some((c: any) => c.rank === 'K' && c.suit === suit);
    const hasQueen = playerHand.some((c: any) => c.rank === 'Q' && c.suit === suit);

    if (!hasKing || !hasQueen) {
      return c.json({ error: 'Nemate kralja i kraljicu tog znaka' }, 400);
    }

    // Check max 3 cvanciks per player
    const playerCvanciks = gameState.cvancikCount[user.id] || 0;
    if (playerCvanciks >= 3) {
      return c.json({ error: 'Maksimalno 3 cvancika po igri' }, 400);
    }

    const isFircik = suit === gameState.trumpSuit;
    const points = isFircik ? 40 : 20;

    // Add points to round score
    if (gameState.variant === '4-player') {
      const playerTeam = getPlayerTeam(gameState, user.id);
      if (playerTeam) {
        gameState.roundScores[playerTeam] += points;
      }
    } else {
      gameState.roundScores[user.id] = (gameState.roundScores[user.id] || 0) + points;
    }
    
    gameState.cvancikCount[user.id] = playerCvanciks + 1;
    
    if (!gameState.calls) {
      gameState.calls = [];
    }
    
    gameState.calls.push({
      playerId: user.id,
      type: isFircik ? 'Fircik' : 'Cvancik',
      suit,
      points,
      timestamp: Date.now()
    });

    await kv.set(gameId, gameState);

    return c.json({ 
      success: true, 
      message: isFircik ? 'Fircik! +40 poena' : 'Cvancik! +20 poena',
      points,
      gameState 
    });
  } catch (error) {
    console.log('Call error:', error);
    return c.json({ error: 'Greška pri pozivu' }, 500);
  }
});

// Bidding - Make bid or pass
app.post('/make-server-efd87c15/game/bid', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const { gameId, bid, trumpSuit, additionalGame, partnerCard } = await c.req.json();
    const gameState = await kv.get(gameId);
    
    if (!gameState) {
      return c.json({ error: 'Igra nije pronađena' }, 404);
    }

    if (gameState.phase !== 'bidding') {
      return c.json({ error: 'Bidding faza je završena' }, 400);
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== user.id) {
      return c.json({ error: 'Nije vaš red' }, 400);
    }

    // Record bid
    gameState.bids.push({
      playerId: user.id,
      bid,
      trumpSuit,
      additionalGame,
      partnerCard
    });

    if (bid === 'dalje') {
      // Pass - move to next player
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.playerCount;
      
      // Check if all passed
      if (gameState.bids.filter(b => b.bid === 'dalje').length === gameState.playerCount) {
        // All passed - new deal
        gameState.status = 'redeal';
      }
    } else {
      // Player called trump
      gameState.trumpCaller = user.id;
      gameState.trumpSuit = trumpSuit;
      gameState.additionalGame = additionalGame || null;
      
      if (gameState.variant === '3-player' && gameState.talon) {
        // 3-player: Enter talon exchange phase
        gameState.phase = 'talon-exchange';
      } else if (gameState.variant === '4-player') {
        // 4-player: Set partner card and deal remaining cards
        gameState.partnerCard = partnerCard;
        gameState.phase = 'second-deal';
        
        // Deal remaining 4 cards to each player
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        for (const suit of suits) {
          for (const rank of ranks) {
            deck.push({ suit, rank, value: getCardValue(rank) });
          }
        }
        
        // Filter out already dealt cards
        const dealtCards = Object.values(gameState.hands).flat();
        const remainingDeck = deck.filter(card => 
          !dealtCards.some(c => c.suit === card.suit && c.rank === card.rank)
        );
        
        // Shuffle
        for (let i = remainingDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remainingDeck[i], remainingDeck[j]] = [remainingDeck[j], remainingDeck[i]];
        }
        
        // Deal 4 more cards to each player
        gameState.players.forEach((player, index) => {
          gameState.hands[player.id] = [
            ...gameState.hands[player.id],
            ...remainingDeck.slice(index * 4, (index + 1) * 4)
          ];
        });
        
        gameState.firstDealComplete = true;
        gameState.phase = 'playing';
        gameState.status = 'playing';
      } else {
        gameState.phase = 'playing';
        gameState.status = 'playing';
      }
    }

    await kv.set(gameId, gameState);
    return c.json({ success: true, gameState });
  } catch (error) {
    console.log('Bid error:', error);
    return c.json({ error: 'Greška pri bidding-u' }, 500);
  }
});

// Talon exchange (3-player)
app.post('/make-server-efd87c15/game/talon-exchange', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const { gameId, returnedCards } = await c.req.json();
    const gameState = await kv.get(gameId);
    
    if (!gameState) {
      return c.json({ error: 'Igra nije pronađena' }, 404);
    }

    if (gameState.trumpCaller !== user.id) {
      return c.json({ error: 'Niste zvali adut' }, 400);
    }

    if (returnedCards.length !== 2) {
      return c.json({ error: 'Morate vratiti tačno 2 karte' }, 400);
    }

    // Validate: cannot return Ace or 10
    const hasAceOrTen = returnedCards.some(card => card.rank === 'A' || card.rank === '10');
    if (hasAceOrTen) {
      return c.json({ error: 'Ne možete vratiti keca ili deseticu' }, 400);
    }

    // Add talon to hand
    const playerHand = gameState.hands[user.id];
    playerHand.push(...gameState.talon);

    // Remove returned cards
    returnedCards.forEach(card => {
      const index = playerHand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
      if (index !== -1) {
        playerHand.splice(index, 1);
      }
    });

    gameState.talon = returnedCards;
    gameState.phase = 'playing';
    gameState.status = 'playing';

    await kv.set(gameId, gameState);
    return c.json({ success: true, gameState });
  } catch (error) {
    console.log('Talon exchange error:', error);
    return c.json({ error: 'Greška pri razmeni talona' }, 500);
  }
});

// ============= ADMIN ROUTES =============

// Get all users (admin only)
app.get('/make-server-efd87c15/admin/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const adminProfile = await kv.get(`user:${user.id}`);
    if (!adminProfile || !adminProfile.isAdmin) {
      return c.json({ error: 'Niste administrator' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    const userList = users.filter(u => typeof u === 'object' && u.id);

    return c.json({ users: userList });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Greška pri učitavanju korisnika' }, 500);
  }
});

// Ban/unban user (admin only)
app.post('/make-server-efd87c15/admin/ban', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const adminProfile = await kv.get(`user:${user.id}`);
    if (!adminProfile || !adminProfile.isAdmin) {
      return c.json({ error: 'Niste administrator' }, 403);
    }

    const { userId, ban } = await c.req.json();
    const targetUser = await kv.get(`user:${userId}`);
    
    if (!targetUser) {
      return c.json({ error: 'Korisnik nije pronađen' }, 404);
    }

    targetUser.isBanned = ban;
    await kv.set(`user:${userId}`, targetUser);

    return c.json({ 
      success: true, 
      message: ban ? 'Korisnik je blokiran' : 'Korisnik je odblokiran' 
    });
  } catch (error) {
    console.log('Ban user error:', error);
    return c.json({ error: 'Greška pri blokiranju korisnika' }, 500);
  }
});

// Create tournament (admin only)
app.post('/make-server-efd87c15/admin/tournament', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Niste autorizovani' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Neispravna sesija' }, 401);
    }

    const adminProfile = await kv.get(`user:${user.id}`);
    if (!adminProfile || !adminProfile.isAdmin) {
      return c.json({ error: 'Niste administrator' }, 403);
    }

    const { name, startDate, maxPlayers, prizePool } = await c.req.json();
    
    const tournamentId = `tournament:${Date.now()}`;
    const tournament = {
      id: tournamentId,
      name,
      startDate,
      maxPlayers,
      prizePool,
      participants: [],
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    await kv.set(tournamentId, tournament);

    return c.json({ success: true, tournament });
  } catch (error) {
    console.log('Create tournament error:', error);
    return c.json({ error: 'Greška pri kreiranju turnira' }, 500);
  }
});

// Get tournaments
app.get('/make-server-efd87c15/tournaments', async (c) => {
  try {
    const tournaments = await kv.getByPrefix('tournament:');
    return c.json({ tournaments });
  } catch (error) {
    console.log('Get tournaments error:', error);
    return c.json({ error: 'Greška pri učitavanju turnira' }, 500);
  }
});

// ============= HELPER FUNCTIONS =============

function getCardValue(rank: string): number {
  const values: Record<string, number> = {
    'A': 10,  // Marijaš: Ace = 10 points
    '10': 10, // Ten = 10 points
    'K': 0,
    'Q': 0,
    'J': 0,
    '9': 0,
    '8': 0,
    '7': 0
  };
  return values[rank] || 0;
}

function determineTrickWinner(trick: any[], trumpSuit: string) {
  const leadSuit = trick[0].suit;
  
  // Find highest trump
  const trumpCards = trick.filter(c => c.suit === trumpSuit);
  if (trumpCards.length > 0) {
    return trumpCards.reduce((highest, card) => {
      const rankOrder = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'];
      const highestRank = rankOrder.indexOf(highest.rank);
      const cardRank = rankOrder.indexOf(card.rank);
      return cardRank > highestRank ? card : highest;
    });
  }
  
  // Find highest card of lead suit
  const leadCards = trick.filter(c => c.suit === leadSuit);
  return leadCards.reduce((highest, card) => {
    const rankOrder = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'];
    const highestRank = rankOrder.indexOf(highest.rank);
    const cardRank = rankOrder.indexOf(card.rank);
    return cardRank > highestRank ? card : highest;
  });
}

function getPlayerTeam(gameState: any, playerId: string): string | null {
  if (gameState.variant !== '4-player') return null;
  
  // Check if partner has been revealed
  if (gameState.revealedPartner) {
    if (gameState.teams.team1.includes(playerId)) return 'team1';
    if (gameState.teams.team2.includes(playerId)) return 'team2';
  }
  
  // If trump caller, always team1
  if (playerId === gameState.trumpCaller) return 'team1';
  
  // If partner card has been played, reveal teams
  if (gameState.partnerPlayerId) {
    if (playerId === gameState.partnerPlayerId) return 'team1';
    return 'team2';
  }
  
  return null;
}

// Health check
app.get('/make-server-efd87c15/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
