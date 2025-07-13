export default {
  mainMenu: {
    gameTitle: "Blijf op het Bord",
    menu: "Menu",
    title: "Hoofdmenu",
    welcome: "Welkom!",
    rules: "Regels",
    controls: "Besturing",
    playVsComputer: "Spelen tegen Computer",
    playOnline: "Online Spelen",
    localGame: "Lokaal Spel",
    donate: "Doneren",
    ubuntu: "Ubuntu",
    clearCache: "Cache wissen",
    startGame: "Spel Starten",
    theme: "Thema",
    language: "Taal"
  },
  onlineMenu: {
    title: "Online Spel",
    description: "Speel online met vrienden!",
    createRoom: "Kamer Aanmaken",
    joinRoom: "Deelnemen aan Kamer",
    back: "Terug"
  },
  localGame: {
    enterNames: "Voer Spelersnamen In",
    player1Name: "Speler 1 Naam:",
    player2Name: "Speler 2 Naam:",
    player1DefaultName: "Speler 1",
    player2DefaultName: "Speler 2"
  },
  rules: {
    title: "Spelregels",
    goal: "Het doel is om het stuk zo lang mogelijk op het bord te houden. Jij en de computer bewegen het stuk om beurten. Als jouw zet het stuk van het bord afbrengt, verlies je.",
    blockedModeTitle: "Geblokkeerde cellen modus:",
    blockedModeDesc: "Een cel waar je vanaf beweegt wordt onbeschikbaar voor toekomstige zetten (gemarkeerd zwart met een rode ✗). Als het stuk op een geblokkeerde cel landt, eindigt het spel.",
    noMovesBtnTitle: "'Geen zetten over' knop:",
    noMovesBtnDesc: "Als je denkt dat je geen mogelijke zetten hebt, druk dan op deze knop. Als je gelijk hebt, win je. Als je ongelijk hebt, verlies je."
  },
  controls: {
    title: "Besturing",
    desc: "Gebruik de knoppen om richting en afstand te selecteren, druk dan op 'Zet bevestigen'.",
    arrows: "Pijlen",
    direction: "bewegingsrichting.",
    numbers: "Cijfers",
    distance: "afstand in cellen.",
    confirmBtn: "'Zet bevestigen' knop",
    confirmMove: "voer de geselecteerde zet uit.",
    noMovesBtn: "'Geen zetten over' knop",
    noMoves: "verklaar geen mogelijke zetten.",
    hideBoard: "Toon bord",
    memoryMode: "voor geheugenmodus.",
    showMoves: "Toon beschikbare zetten",
    blockedMode: "'Geblokkeerde cellen modus' checkbox",
    blockedModeDesc: "cellen worden onbeschikbaar na een zet.",
    speechEnabled: "'Spraak ingeschakeld' checkbox",
    speechEnabledDesc: "spraakaankondiging van computerzetten."
  },
  boardSize: {
    title: "Bordgrootte Selectie",
    select: "Stel de bordgrootte in (van 2 tot 9):"
  },
  online: {
    createRoomStatus: "Kamer aanmaken...",
    roomCreated: "Kamer aangemaakt! Code: {roomId}. Deel deze met je vriend.",
    enterRoomCode: "Voer kamercode in (6 karakters):",
    invalidRoomCode: "Voer een geldige kamercode in (6 karakters).",
    connecting: "Verbinden...",
    connectingToRoom: "Verbinden met kamer {roomId}..."
  },
  common: {
    back: "Terug",
    ok: "OK",
    backToMenu: "Terug naar menu",
    inDevelopment: "Deze functie is in ontwikkeling.",
    confirmMove: "Zet Bevestigen",
    noMoves: "Ik heb geen zetten"
  },
  ui: {
    showMoves: "Toon beschikbare zetten",
    showBoard: "Toon bord",
    blockedMode: "Geblokkeerde cellen modus",
    speechEnabled: "Spraak ingeschakeld",
    selectDistance: "Kies afstand:",
    confirmMove: "Zet Bevestigen",
    noMoves: "Ik heb geen zetten",
    yourMove: "Jouw zet: kies richting en afstand.",
    playerMove: "Zet van {player}: kies richting en afstand.",
    selectDirectionAndDistance: "Selecteer richting EN afstand!",
    noAvailableMoves: "Geen beschikbare zetten!",
    computerNoMovesWin: "De computer kan niet bewegen. Je wint!",
    score: "Punten",
    online: "Online",
    computerMove: "De computer heeft een zet gedaan: {direction} over {distance} vak(ken)."
  },
  end: {
    blockedCell: "Je probeerde het stuk naar een geblokkeerde cel {direction} te verplaatsen. Spel afgelopen!",
    outOfBounds: "Je probeerde het stuk {distance} vak(ken) {direction} te verplaatsen en ging van het bord af.",
    noMovesFalse: "Je gaf aan geen zetten te hebben, maar er zijn nog mogelijke zetten. Spel afgelopen!",
    noMovesTrue: "Je hebt correct aangegeven dat er geen zetten zijn. Je wint!",
    winTitle: "Gewonnen!",
    loseTitle: "Spel afgelopen!",
    playerLost: "Speler {player} heeft verloren. {reason}",
    score: "Aantal behaalde punten: {score}",
    version: "Spelversie: {version}",
    chooseBoardSize: "Bordgrootte kiezen",
    menu: "Menu"
  },
  // Voeg sectie toe voor tooltips en labels
  topControls: {
    themeStyle: "Thema en stijl",
    language: "Taal",
    donate: "Project steunen"
  },
  board: {
    showMoves: "Toon beschikbare zetten",
    showBoard: "Toon bord",
    blockedMode: "Geblokkeerde cellen modus",
    speechEnabled: "Spraak ingeschakeld",
    voiceSettings: "Spraakinstellingen",
    voiceSettingsTitle: "Spraakinstellingen:"
  },
  visual: {
    computerMove: "Zet van de computer<br>",
    selectDistance: "Kies afstand:",
    confirmMove: "Zet bevestigen",
    noMoves: "Ik heb geen zetten"
  },
  scorePanel: {
    score: "Punten",
    online: "Online"
  },
  menu: {
    exit: "Terug naar menu",
    menuTitle: "Menu"
  }
}; 