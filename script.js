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
      winners: [],
      firstTrick: true, // Track if this is the first trick of the game
      trickInterrupted: false, // Track if a throw-away card interrupted the trick
      highestLeadCardIndex: -1, // Index of the player with highest lead suit card
      nextTurnSkipped: false // Track if the next player's turn should be skipped
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
      gameState.firstTrick = true;
      gameState.trickInterrupted = false;
      gameState.highestLeadCardIndex = -1;
      gameState.nextTurnSkipped = false;
      
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
          
          if (player.isOut) {
              playerName.textContent += ' - OUT';
          }
          
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
              cardElement.classList.add('playable');
              
              if (isValidCard(player, card)) {
                  cardElement.addEventListener('click', () => playCard(playerIndex, cardIndex));
                  cardElement.classList.add('valid-card');
                  
                  // Add throw-away indicator
                  if (gameState.trickPile.length > 0) {
                      const leadCard = gameState.trickPile[0].card;
                      if (card.suit !== leadCard.suit) {
                          cardElement.classList.add('throw-away');
                          cardElement.title = "Throw-away card: Will end the trick and make the player with the highest lead card pick up all cards!";
                      }
                  }
              } else {
                  cardElement.classList.add('disabled');
              }
          }
      }
      
      return cardElement;
  }
  
  function isValidCard(player, card) {
      // First card of the game must be Ace of Spades
      if (gameState.firstTrick && gameState.trickPile.length === 0) {
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
          return card.suit === leadCard.suit;
      } else {
          // If player doesn't have cards of the lead suit, they can play any card (throw-away)
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
          gameState.highestLeadCardIndex = playerIndex;
          
          // First trick of the game is now complete
          if (gameState.firstTrick) {
              gameState.firstTrick = false;
          }
      }
      
      // Check if this is a throw-away card (not of lead suit)
      const isThrowAway = card.suit !== gameState.leadSuit;
      
      // Update the highest lead card index if needed
      if (!isThrowAway) {
          // Get the current highest lead card
          const highestCard = gameState.trickPile.find(play => 
              play.playerIndex === gameState.highestLeadCardIndex)?.card;
          
          if (highestCard && card.suit === highestCard.suit && card.rank > highestCard.rank) {
              gameState.highestLeadCardIndex = playerIndex;
          }
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
      }
      
      // Handle throw-away card scenario
      if (isThrowAway && gameState.trickPile.length > 1) {
          gameState.trickInterrupted = true;
          handleThrowAway(playerIndex);
          return;
      } else {
          // Update status for normal play
          updateStatus(`${player.name} played ${card.value} of ${card.suit}.`);
      }
      
      // Check if all players have played a card for this trick
      const activePlayers = gameState.players.filter(p => !p.isOut).length;
      if (gameState.trickPile.length === activePlayers) {
          // End of trick
          setTimeout(endTrick, 1000);
      } else {
          // Move to next player
          nextPlayer();
      }
      
      // Re-render the game state
      renderGame();
  }
  
  // Handle throw-away card consequences
  function handleThrowAway(throwAwayPlayerIndex) {
      const playerWithHighestLeadCard = gameState.players[gameState.highestLeadCardIndex];
      const throwAwayPlayer = gameState.players[throwAwayPlayerIndex];
      const throwAwayCard = gameState.trickPile[gameState.trickPile.length - 1].card;
      
      updateStatus(`${throwAwayPlayer.name} played a throw-away card (${throwAwayCard.value} of ${throwAwayCard.suit})! 
          ${playerWithHighestLeadCard.name} must pick up all cards.`);
      
      // Add all cards from trick pile to highest lead card player's hand
      gameState.trickPile.forEach(play => {
          playerWithHighestLeadCard.hand.push(play.card);
      });
      
      // Highlight the player who has to pick up the cards
      const penaltyPlayerArea = document.getElementById(`player-${gameState.highestLeadCardIndex}`);
      if (penaltyPlayerArea) {
          penaltyPlayerArea.classList.add('penalty-pickup');
      }
      
      // Set flag to skip next player's turn
      gameState.nextTurnSkipped = true;
      
      // Clear the trick pile
      setTimeout(() => {
          // Determine next player (skip one player)
          let nextPlayerIndex = (throwAwayPlayerIndex + 2) % gameState.players.length;
          
          // Skip players who are out
          while (gameState.players[nextPlayerIndex].isOut) {
              nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
          }
          
          gameState.currentPlayerIndex = nextPlayerIndex;
          gameState.trickPile = [];
          gameState.leadSuit = null;
          gameState.leadCardValue = null;
          gameState.trickInterrupted = false;
          gameState.highestLeadCardIndex = -1;
          gameState.nextTurnSkipped = false;
          
          if (penaltyPlayerArea) {
              penaltyPlayerArea.classList.remove('penalty-pickup');
          }
          
          updateStatus(`${playerWithHighestLeadCard.name} picked up the trick. 
              Next player's turn was skipped. ${gameState.players[nextPlayerIndex].name}'s turn to lead.`);
          
          // Re-render game state
          renderGame();
          
          // If next player is AI, let it play
          if (!gameState.players[nextPlayerIndex].isHuman) {
              setTimeout(playAITurn, 1000);
          }
      }, 2500);
  }
  
  function nextPlayer() {
      // Move to the next player who is still in the game
      let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      
      // Continue looping until we find a player who's not out
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
      
      // Skip if player is already out (shouldn't happen but safeguard)
      if (player.isOut) {
          nextPlayer();
          return;
      }
      
      // Find valid cards to play
      const validCards = player.hand.filter(card => isValidCard(player, card));
      
      if (validCards.length === 0) {
          // This shouldn't happen as there's always at least one valid card,
          // but just in case:
          console.error("AI has no valid cards to play:", player.hand);
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
          const leadCard = gameState.trickPile[0].card;
          const hasSameSuit = player.hand.some(c => c.suit === leadCard.suit);
          
          if (hasSameSuit) {
              // Has cards of lead suit - try to win efficiently
              const leadSuitCards = validCards.filter(card => card.suit === leadCard.suit);
              
              // Try to find the lowest card that can win
              const winningCards = leadSuitCards.filter(card => card.rank > leadCard.rank);
              
              if (winningCards.length > 0) {
                  // Play lowest card that can win
                  cardToPlay = winningCards.reduce((lowest, card) => 
                      (card.rank < lowest.rank) ? card : lowest, winningCards[0]);
              } else {
                  // Can't win - play lowest card
                  cardToPlay = leadSuitCards.reduce((lowest, card) => 
                      (card.rank < lowest.rank) ? card : lowest, leadSuitCards[0]);
              }
          } else {
              // Does not have lead suit - AI can play a throw-away card
              // Check if there is a player with a lot of cards who might win the trick
              const potentialWinner = gameState.highestLeadCardIndex;
              const playerToTargetIndex = gameState.players.findIndex((p, idx) => 
                  !p.isOut && p.hand.length > player.hand.length && idx !== playerIndex);
              
              // If the player with the highest lead card has a lot of cards, play a throw-away
              // This is strategic to force them to pick up more cards
              if (playerToTargetIndex !== -1 && 
                  potentialWinner === playerToTargetIndex && 
                  gameState.trickPile.length > 1) {
                  // Play a throw-away strategically to penalize the player with most cards
                  // Choose highest throw-away card to maximize the penalty
                  cardToPlay = validCards.reduce((highest, card) => 
                      (card.rank > highest.rank) ? card : highest, validCards[0]);
              } else {
                  // Play the lowest card (no strategic throw-away needed)
                  cardToPlay = validCards.reduce((lowest, card) => 
                      (card.rank < lowest.rank) ? card : lowest, validCards[0]);
              }
          }
      }
      
      // Find the index of the card in the player's hand
      cardIndex = player.hand.findIndex(card => 
          card.suit === cardToPlay.suit && card.value === cardToPlay.value);
      
      if (cardIndex === -1) {
          console.error("Card not found in player's hand:", cardToPlay, player.hand);
          // Fallback - play first valid card
          cardIndex = player.hand.findIndex(card => isValidCard(player, card));
      }
      
      // Play the card
      if (cardIndex !== -1) {
          playCard(playerIndex, cardIndex);
      } else {
          console.error("No valid card found for AI player");
          nextPlayer();
      }
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
      
      // Check if the winner is already out (shouldn't happen)
      if (winner.isOut) {
          console.error("Winner is already out of the game:", winner);
          // Find next active player to lead
          let nextLeaderIndex = (winnerIndex + 1) % gameState.players.length;
          while (gameState.players[nextLeaderIndex].isOut) {
              nextLeaderIndex = (nextLeaderIndex + 1) % gameState.players.length;
          }
          gameState.currentPlayerIndex = nextLeaderIndex;
      } else {
          // Set the winner as the next player to lead
          gameState.currentPlayerIndex = winnerIndex;
      }
      
      // Highlight the winner
      const winnerArea = document.getElementById(`player-${winnerIndex}`);
      if (winnerArea) {
          winnerArea.classList.add('trick-winner');
      }
      
      updateStatus(`${winner.name} wins the trick with ${winningPlay.card.value} of ${winningPlay.card.suit}!`);
      
      // Clear trick pile for the next trick
      setTimeout(() => {
          gameState.trickPile = [];
          gameState.leadSuit = null;
          gameState.leadCardValue = null;
          
          // Check if the winner is still in the game (could have gone out in this trick)
          if (!winner.isOut) {
              updateStatus(`${winner.name}'s turn to lead.`);
          } else {
              // Find next active player
              let nextActiveIndex = (winnerIndex + 1) % gameState.players.length;
              while (gameState.players[nextActiveIndex].isOut) {
                  nextActiveIndex = (nextActiveIndex + 1) % gameState.players.length;
              }
              gameState.currentPlayerIndex = nextActiveIndex;
              updateStatus(`${gameState.players[nextActiveIndex].name}'s turn to lead.`);
          }
          
          if (winnerArea) {
              winnerArea.classList.remove('trick-winner');
          }
          
          // Re-render the game state
          renderGame();
          
          // If next player is AI, let it play
          const nextPlayer = gameState.players[gameState.currentPlayerIndex];
          if (!nextPlayer.isHuman && !nextPlayer.isOut) {
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