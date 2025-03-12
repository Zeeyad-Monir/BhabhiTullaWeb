// Game logic
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const newGameBtn = document.getElementById('new-game-btn');
  const rulesBtn = document.getElementById('rules-btn');
  const startGameBtn = document.getElementById('start-game-btn');
  const playerCountSelect = document.getElementById('player-count');
  const setupContainer = document.getElementById('setup-container');
  const gameContainer = document.getElementById('game-container');
  const playersContainer = document.getElementById('players-container');
  const trickPile = document.getElementById('trick-pile');
  const statusMessage = document.getElementById('status-message');
  
  // Modals
  const rulesModal = document.getElementById('rules-modal');
  const closeRulesBtn = document.getElementById('close-rules');
  const closeModalBtn = document.querySelector('.close-modal');
  const endGameModal = document.getElementById('end-game-modal');
  const endGameMessage = document.getElementById('end-game-message');
  const playAgainBtn = document.getElementById('play-again-btn');
  
  // Game state
  let gameState = {
      deck: [],
      players: [],
      currentPlayerIndex: 0,
      trickPile: [],
      leadSuit: null,
      leadCardValue: null,
      gameStarted: false,
      gameEnded: false,
      winners: []
  };
  
  // Card values and suits
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const suitSymbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
  };
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const valueRanks = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  
  // Event listeners
  newGameBtn.addEventListener('click', showSetup);
  rulesBtn.addEventListener('click', showRules);
  closeRulesBtn.addEventListener('click', hideRules);
  closeModalBtn.addEventListener('click', hideRules);
  startGameBtn.addEventListener('click', startGame);
  playAgainBtn.addEventListener('click', resetGame);
  
  // Functions
  function showSetup() {
      gameContainer.style.display = 'none';
      setupContainer.style.display = 'block';
  }
  
  function showRules() {
      rulesModal.style.display = 'flex';
  }
  
  function hideRules() {
      rulesModal.style.display = 'none';
  }
  
  function resetGame() {
      endGameModal.style.display = 'none';
      showSetup();
  }
  
  function createDeck() {
      const deck = [];
      suits.forEach(suit => {
          values.forEach(value => {
              deck.push({
                  suit: suit,
                  value: value,
                  rank: valueRanks[value]
              });
          });
      });
      return deck;
  }
  
  function shuffleDeck(deck) {
      for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
  }
  
  function dealCards(deck, playerCount) {
      const players = [];
      
      // Create player objects
      for (let i = 0; i < playerCount; i++) {
          players.push({
              id: i,
              name: i === 0 ? 'You' : `Player ${i}`,
              hand: [],
              isHuman: i === 0, // First player is human, rest are AI
              isOut: false
          });
      }
      
      // Deal cards evenly to all players
      let playerIndex = 0;
      while (deck.length > 0) {
          players[playerIndex].hand.push(deck.pop());
          playerIndex = (playerIndex + 1) % playerCount;
      }
      
      return players;
  }
  
  function startGame() {
      const playerCount = parseInt(playerCountSelect.value);
      
      // Create and shuffle deck
      gameState.deck = createDeck();
      gameState.deck = shuffleDeck(gameState.deck);
      
      // Deal cards to players
      gameState.players = dealCards(gameState.deck, playerCount);
      
      // Find player with Ace of Spades to start
      let startPlayerIndex = 0;
      for (let i = 0; i < gameState.players.length; i++) {
          const aceOfSpades = gameState.players[i].hand.find(card => 
              card.suit === 'spades' && card.value === 'A');
          
          if (aceOfSpades) {
              startPlayerIndex = i;
              break;
          }
      }
      
      gameState.currentPlayerIndex = startPlayerIndex;
      gameState.trickPile = [];
      gameState.leadSuit = null;
      gameState.leadCardValue = null;
      gameState.gameStarted = true;
      gameState.gameEnded = false;
      gameState.winners = [];
      
      // Hide setup, show game
      setupContainer.style.display = 'none';
      gameContainer.style.display = 'block';
      
      // Render game state
      renderGame();
      
      // Start game flow
      updateStatus(`${gameState.players[startPlayerIndex].name}'s turn. Lead with the Ace of Spades.`);
      
      // If AI is starting, let it play
      if (!gameState.players[startPlayerIndex].isHuman) {
          setTimeout(playAITurn, 1000);
      }
  }
  
  function renderGame() {
      // Clear existing game elements
      playersContainer.innerHTML = '';
      trickPile.innerHTML = '';
      
      // Render players and their hands
      gameState.players.forEach((player, index) => {
          const playerArea = document.createElement('div');
          playerArea.className = 'player-area';
          playerArea.id = `player-${index}`;
          
          if (index === gameState.currentPlayerIndex && !gameState.gameEnded) {
              playerArea.classList.add('current-player');
          }
          
          const playerName = document.createElement('div');
          playerName.className = 'player-name';
          playerName.textContent = `${player.name} (${player.hand.length} cards)`;
          
          const playerHand = document.createElement('div');
          playerHand.className = 'player-hand';
          playerHand.id = `hand-${index}`;
          
          playerArea.appendChild(playerName);
          playerArea.appendChild(playerHand);
          playersContainer.appendChild(playerArea);
          
          // Render cards for this player
          if (player.isHuman || gameState.gameEnded) {
              // Show all cards for human player or when game ends
              player.hand.forEach((card, cardIndex) => {
                  const cardElement = createCardElement(card, index, cardIndex);
                  playerHand.appendChild(cardElement);
              });
          } else {
              // Show card backs for AI players
              player.hand.forEach((_, cardIndex) => {
                  const cardBack = document.createElement('div');
                  cardBack.className = 'card';
                  cardBack.textContent = '🂠';
                  cardBack.style.backgroundColor = '#e76f51';
                  playerHand.appendChild(cardBack);
              });
          }
      });
      
      // Render trick pile
      gameState.trickPile.forEach((play, index) => {
          const cardElement = createCardElement(play.card);
          cardElement.classList.add('trick-pile-card');
          cardElement.style.transform = `rotate(${index * 15 - gameState.trickPile.length * 7.5}deg) translateX(${index * 5}px)`;
          cardElement.style.zIndex = index;
          trickPile.appendChild(cardElement);
      });
  }
  
  function createCardElement(card, playerIndex, cardIndex) {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      
      const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
      const colorClass = isRed ? 'red' : 'black';
      
      const valueElement = document.createElement('div');
      valueElement.className = `card-value ${colorClass}`;
      valueElement.textContent = card.value;
      
      const suitElement = document.createElement('div');
      suitElement.className = `card-suit ${colorClass}`;
      suitElement.textContent = suitSymbols[card.suit];
      
      cardElement.appendChild(valueElement);
      cardElement.appendChild(suitElement);
      
      // Add data attributes for game logic
      cardElement.dataset.suit = card.suit;
      cardElement.dataset.value = card.value;
      cardElement.dataset.rank = card.rank;
      
      // Add click event listener for player's cards
      if (playerIndex !== undefined && cardIndex !== undefined) {
          const player = gameState.players[playerIndex];
          
          if (player.isHuman && playerIndex === gameState.currentPlayerIndex && !gameState.gameEnded) {
              if (isValidCard(player, card)) {
                  cardElement.addEventListener('click', () => playCard(playerIndex, cardIndex));
              } else {
                  cardElement.classList.add('disabled');
              }
          }
      }
      
      return cardElement;
  }
  
  function isValidCard(player, card) {
      // First card of the game must be Ace of Spades
      if (gameState.trickPile.length === 0 && gameState.winners.length === 0) {
          return card.suit === 'spades' && card.value === 'A';
      }
      
      // First card of a trick can be any card
      if (gameState.trickPile.length === 0) {
          return true;
      }
      
      // Follow suit if possible
      const leadCard = gameState.trickPile[0].card;
      
      // Check if player has any cards of the lead suit
      const hasSameSuit = player.hand.some(c => c.suit === leadCard.suit);
      
      if (hasSameSuit) {
          // If player has cards of the lead suit, they must play one
          if (card.suit !== leadCard.suit) {
              return false;
          }
          
          // Check if player has higher cards of the same suit
          const hasHigherCard = player.hand.some(c => 
              c.suit === leadCard.suit && c.rank > leadCard.rank);
          
          if (hasHigherCard) {
              // Must play a higher card if possible
              return card.suit === leadCard.suit && card.rank > leadCard.rank;
          } else {
              // Can play any card of the same suit
              return card.suit === leadCard.suit;
          }
      } else {
          // If player doesn't have cards of the lead suit, they can play any card
          return true;
      }
  }
  
  function updateStatus(message) {
      statusMessage.textContent = message;
  }
  
  function playCard(playerIndex, cardIndex) {
      const player = gameState.players[playerIndex];
      const card = player.hand[cardIndex];
      
      // Remove card from player's hand
      player.hand.splice(cardIndex, 1);
      
      // Add to trick pile
      gameState.trickPile.push({
          playerIndex: playerIndex,
          card: card
      });
      
      // If this is the first card of the trick, set the lead suit
      if (gameState.trickPile.length === 1) {
          gameState.leadSuit = card.suit;
          gameState.leadCardValue = card.value;
      }
      
      // Check if player is out
      if (player.hand.length === 0) {
          player.isOut = true;
          gameState.winners.push(playerIndex);
          updateStatus(`${player.name} is out! Rank: ${gameState.winners.length}`);
          
          // Check if only one player remains (game over)
          const playersStillIn = gameState.players.filter(p => !p.isOut);
          if (playersStillIn.length === 1) {
              endGame();
              return;
          }
      } else {
          // Update status
          updateStatus(`${player.name} played ${card.value} of ${card.suit}.`);
      }
      
      // Check if all players have played a card for this trick
      if (gameState.trickPile.length === gameState.players.filter(p => !p.isOut).length) {
          // End of trick
          setTimeout(endTrick, 1000);
      } else {
          // Move to next player
          nextPlayer();
      }
      
      // Re-render the game state
      renderGame();
  }
  
  function nextPlayer() {
      // Move to the next player who is still in the game
      let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      
      while (gameState.players[nextPlayerIndex].isOut) {
          nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      }
      
      gameState.currentPlayerIndex = nextPlayerIndex;
      
      updateStatus(`${gameState.players[nextPlayerIndex].name}'s turn`);
      
      // If next player is AI, let it play
      if (!gameState.players[nextPlayerIndex].isHuman) {
          setTimeout(playAITurn, 1000);
      }
      
      renderGame();
  }
  
  function playAITurn() {
      const playerIndex = gameState.currentPlayerIndex;
      const player = gameState.players[playerIndex];
      
      // Find valid cards to play
      const validCards = player.hand.filter(card => isValidCard(player, card));
      
      if (validCards.length === 0) {
          // This shouldn't happen as there's always at least one valid card,
          // but just in case:
          updateStatus(`${player.name} has no valid cards to play!`);
          nextPlayer();
          return;
      }
      
      // Find the best card to play
      let cardToPlay;
      let cardIndex;
      
      if (gameState.trickPile.length === 0) {
          // Leading the trick - play the highest card
          cardToPlay = validCards.reduce((highest, card) => 
              (card.rank > highest.rank) ? card : highest, validCards[0]);
      } else {
          // Following - try to play lowest card that can win, or lowest card if can't win
          const leadCard = gameState.trickPile[0].card;
          
          // Cards of the lead suit that can win
          const winningCards = validCards.filter(card => 
              card.suit === leadCard.suit && card.rank > leadCard.rank);
          
          if (winningCards.length > 0) {
              // Play lowest card that can win
              cardToPlay = winningCards.reduce((lowest, card) => 
                  (card.rank < lowest.rank) ? card : lowest, winningCards[0]);
          } else {
              // Can't win - play lowest card
              cardToPlay = validCards.reduce((lowest, card) => 
                  (card.rank < lowest.rank) ? card : lowest, validCards[0]);
          }
      }
      
      // Find the index of the card in the player's hand
      cardIndex = player.hand.findIndex(card => 
          card.suit === cardToPlay.suit && card.value === cardToPlay.value);
      
      // Play the card
      playCard(playerIndex, cardIndex);
  }
  
  function endTrick() {
      // Find the winner of the trick
      let winningPlay = gameState.trickPile[0];
      let highestRank = winningPlay.card.rank;
      
      for (let i = 1; i < gameState.trickPile.length; i++) {
          const play = gameState.trickPile[i];
          
          // Only cards of the lead suit can win
          if (play.card.suit === gameState.leadSuit && play.card.rank > highestRank) {
              winningPlay = play;
              highestRank = play.card.rank;
          }
      }
      
      const winnerIndex = winningPlay.playerIndex;
      const winner = gameState.players[winnerIndex];
      
      // Highlight the winner
      const winnerArea = document.getElementById(`player-${winnerIndex}`);
      winnerArea.classList.add('trick-winner');
      
      updateStatus(`${winner.name} wins the trick with ${winningPlay.card.value} of ${winningPlay.card.suit}!`);
      
      // Set the winner as the next player to lead
      gameState.currentPlayerIndex = winnerIndex;
      
      // Clear trick pile for the next trick
      setTimeout(() => {
          gameState.trickPile = [];
          gameState.leadSuit = null;
          gameState.leadCardValue = null;
          
          updateStatus(`${winner.name}'s turn to lead.`);
          
          winnerArea.classList.remove('trick-winner');
          
          // Re-render the game state
          renderGame();
          
          // If winner is AI, let it play
          if (!winner.isHuman && !winner.isOut) {
              setTimeout(playAITurn, 1000);
          }
      }, 1500);
  }
  
  function endGame() {
      gameState.gameEnded = true;
      
      // The last player is the Bhabhi (loser)
      const loserIndex = gameState.players.findIndex(p => !p.isOut);
      const loser = gameState.players[loserIndex];
      
      // Create game over message
      let message = "<h3>Game Over!</h3>";
      
      message += "<p>Final Rankings:</p><ol>";
      for (let i = 0; i < gameState.winners.length; i++) {
          const playerIndex = gameState.winners[i];
          message += `<li>${gameState.players[playerIndex].name}</li>`;
      }
      message += `<li>${loser.name} (Bhabhi - Loser)</li>`;
      message += "</ol>";
      
      // Show the game-over modal
      endGameMessage.innerHTML = message;
      endGameModal.style.display = 'flex';
      
      // Show all players' cards
      renderGame();
  }
  
  // Initialize the game
  showSetup();
});