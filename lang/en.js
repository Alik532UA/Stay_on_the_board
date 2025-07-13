export default {
  mainMenu: {
    gameTitle: "Stay on the Board",
    menu: "Menu",
    title: "Menu",
    welcome: "Welcome!",
    rules: "Rules",
    controls: "Controls",
    playVsComputer: "Play vs Computer",
    playOnline: "Play Online",
    localGame: "Local Game",
    donate: "Donate",
    ubuntu: "Ubuntu",
    clearCache: "Clear cache",
    startGame: "Start Game",
    theme: "Theme",
    language: "Language"
  },
  onlineMenu: {
    title: "Online Game",
    description: "Play with friends online!",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    joinById: "Join by ID",
    joinByIdTitle: "Enter Room ID",
    joinByIdConfirm: "Join",
    back: "Back"
  },
  localGame: {
    enterNames: "Enter Player Names",
    player1Name: "Player 1 Name:",
    player2Name: "Player 2 Name:",
    player1DefaultName: "Player 1",
    player2DefaultName: "Player 2"
  },
  rules: {
    title: "Game Rules",
    goal: "The goal is to keep the piece on the board as long as possible. You and the computer take turns moving the piece. If your move takes the piece off the board, you lose.",
    blockedModeTitle: "Blocked cells mode:",
    blockedModeDesc: "A cell you move from becomes unavailable for future moves (marked black with a red ✗). If the piece lands on a blocked cell, the game ends.",
    noMovesBtnTitle: "'No moves left' button:",
    noMovesBtnDesc: "If you think you have no possible moves, press this button. If you are right, you win. If you are wrong, you lose."
  },
  controls: {
    title: "Controls",
    desc: "Use the buttons to select direction and distance, then press 'Confirm move'.",
    arrows: "Arrows",
    direction: "direction of movement.",
    numbers: "Numbers",
    distance: "distance in cells.",
    confirmBtn: "'Confirm move' button",
    confirmMove: "make the selected move.",
    noMovesBtn: "'No moves left' button",
    noMoves: "declare no possible moves.",
    hideBoard: "Show board",
    memoryMode: "for memory mode.",
    showMoves: "Show available moves",
    blockedMode: "'Blocked cells mode' checkbox",
    blockedModeDesc: "cells become unavailable after a move.",
    speechEnabled: "'Speech enabled' checkbox",
    speechEnabledDesc: "voice announcement of computer moves."
  },
  boardSize: {
    title: "Board Size Selection",
    select: "Set the board size (from 2 to 9):"
  },
  online: {
    createRoomStatus: "Creating room...",
    roomCreated: "Room created! Code: {roomId}. Share it with your friend.",
    enterRoomCode: "Enter room code (6 characters):",
    invalidRoomCode: "Please enter a valid room code (6 characters).",
    connecting: "Connecting...",
    connectingToRoom: "Connecting to room {roomId}..."
  },
  common: {
    back: "Back",
    ok: "OK",
    backToMenu: "Back to menu",
    inDevelopment: "This feature is in development.",
    confirmMove: "Confirm Move",
    noMoves: "I have no moves"
  },
  ui: {
    showMoves: "Show available moves",
    showBoard: "Show board",
    blockedMode: "Blocked cells mode",
    speechEnabled: "Speech enabled",
    selectDistance: "Select distance:",
    confirmMove: "Confirm Move",
    noMoves: "I have no moves",
    yourMove: "Your move: select direction and distance.",
    playerMove: "Player {player}: select direction and distance.",
    selectDirectionAndDistance: "Please select direction AND distance!",
    noAvailableMoves: "No available moves!",
    computerNoMovesWin: "The computer cannot move. You win!",
    score: "Score",
    online: "Online",
    computerMove: "Computer made a move: {direction} by {distance} cell(s)."
  },
  end: {
    blockedCell: "You tried to move the piece to a blocked cell {direction}. Game over!",
    outOfBounds: "You tried to move the piece {distance} cell(s) {direction} and went off the board.",
    noMovesFalse: "You claimed no moves, but you still have possible moves. Game over!",
    noMovesTrue: "You correctly claimed no moves. You win!",
    winTitle: "Victory!",
    loseTitle: "Game Over!",
    playerLost: "Player {player} lost. {reason}",
    score: "Score: {score}",
    version: "Game version: {version}",
    chooseBoardSize: "Choose board size",
    menu: "Menu"
  },
  // Add section for tooltips and labels
  topControls: {
    themeStyle: "Theme and style",
    language: "Language",
    donate: "Support the project"
  },
  board: {
    showMoves: "Show available moves",
    showBoard: "Show board",
    blockedMode: "Blocked cells mode",
    speechEnabled: "Speech enabled",
    voiceSettings: "Voice settings",
    voiceSettingsTitle: "Voice settings:"
  },
  visual: {
    computerMove: "Computer's move<br>",
    selectDistance: "Select distance:",
    confirmMove: "Confirm move",
    noMoves: "I have no moves"
  },
  scorePanel: {
    score: "Score",
    online: "Online"
  },
  menu: {
    exit: "Exit to menu",
    menuTitle: "Menu"
  }
}; 