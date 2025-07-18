export default {
  mainMenu: {
    title: "Blijf op het bord",
    menu: "Menu",
    playVsComputer: "Tegen computer spelen",
    localGame: "Lokaal spel",
    playOnline: "Online spelen",
    settings: "Instellingen",
    controls: "Besturing",
    rules: "Regels",
    clearCache: "Cache wissen",
    theme: "Thema",
    language: "Taal",
    donate: "Steun het project",
    wipNotice: {
      title: "In ontwikkeling",
      description: "Deze functie is nog in ontwikkeling. Om de release te versnellen, kunt u het project ondersteunen:",
    },
    lang: {
      uk: "Oekraïens",
      en: "Engels",
      crh: "Krim-Tataars",
      nl: "Nederlands"
    },
    themeName: {
      ubuntu: "Ubuntu",
      peak: "PEAK",
      cs2: "CS 2",
      glass: "Glassmorphism",
      material: "Material You"
    }
  },
  gameBoard: {
    mainMenu: "Hoofdmenu",
    player: "Speler",
    penaltyInfoTitle: "Informatie over strafpunten",
    penaltyHint: "Ga niet terug naar de cel waarvan de zet net is gemaakt",
    scoreLabel: "Score",
    cashOut: "Punten innen",
    tutorialTitle: "Welkom bij het spel!",
    tutorialContent: "Je doel is om de koningin te verplaatsen zonder van het bord te gaan. Onthoud haar positie, want na jouw zet kan het bord verdwijnen! De zet van de computer verschijnt op de centrale knop, waarna het weer jouw beurt is.",
    info: "Instructies"
  },
  gameControls: {
    ok: "OK",
    cancel: "Annuleren",
    resetTitle: "Spel resetten?",
    resetContent: "Weet je zeker dat je het spel wilt resetten? Alle blokkades en de positie van de speler gaan verloren.",
    showMoves: "Toon mogelijke zetten",
    showBoard: "Toon bord",
    blockMode: "Geblokkeerde cellen modus",
    speech: "Voice-over inschakelen",
    selectDistance: "Kies afstand:",
    confirm: "Zet bevestigen",
    noMovesTitle: "Geen zetten",
    voiceSettingsTitle: "Stem configureren"
  },
  settings: {
    title: "Instellingen",
    showMoves: "Toon mogelijke zetten",
    language: "Taal",
    lang: {
      uk: "Oekraïens",
      en: "Engels",
      crh: "Krim-Tataars",
      nl: "Nederlands"
    },
    theme: "Thema",
    themeDark: "Donker",
    themeLight: "Licht",
    style: "Stijl",
    styleClassic: "Ubuntu",
    stylePeak: "Peak",
    styleCS2: "CS2",
    styleGlass: "Glassmorphism",
    styleMaterial: "Material You",
    reset: "Instellingen resetten",
    resetHint: "Alle instellingen terugzetten naar hun standaardwaarden"
  },
  modal: {
    ok: "OK",
    resetScoreTitle: "Score resetten?",
    resetScoreContent: "Het wijzigen van de bordgrootte zal je huidige score en strafpunten resetten. Weet je zeker dat je wilt doorgaan?",
    resetScoreConfirm: "Ja, grootte wijzigen",
    resetScoreCancel: "Nee, blijven",
    gameOverTitle: "Spel voorbij!",
    computerNoMovesTitle: "Computer heeft geen zetten",
    playerNoMovesTitle: "Geen zetten. Wat nu?",
    errorTitle: "Fout!",
    playAgain: "Opnieuw spelen",
    continueGame: "Doorgaan",
    finishGameWithBonus: "Beëindigen (+{bonus} punten)",
    computerNoMovesContent: "De computer kan geen zet doen. Je kunt het spel voortzetten door alle geblokkeerde cellen te wissen, of het nu beëindigen en bonuspunten ontvangen.",
    playerNoMovesContent: "Je kunt het veld leegmaken en het spel voortzetten, of het nu beëindigen en bonuspunten ontvangen.",
    errorContent: "Je hebt nog beschikbare zetten ({count} over). Je hebt verloren.",
    gameOverReasonOut: "Je bent van het bord gegaan.",
    gameOverReasonBlocked: "Je probeerde naar een geblokkeerde cel te gaan.",
    gameOverReasonCashOut: "Je hebt besloten het spel te beëindigen en je score te innen.",
    gameOverReasonBonus: "Je hebt besloten het spel te beëindigen en een bonus te claimen.",

    // ДОДАНО
    scoreDetails: {
      baseScore: "Basisscore:",
      sizeBonus: "Bonus voor bordgrootte:",
      blockModeBonus: "Bonus voor blokmodus:",
      jumpBonus: "Springbonus:",
      noMovesBonus: "\"Geen zetten\" bonus:",
      finishBonus: "Spelvoltooiingsbonus:",
      penalty: "Straf voor omgekeerde zetten:",
      finalScore: "Eindscore:",
      yourScore: "Jouw score:"
    }
  },
  voiceSettings: {
    title: "Steminstellingen",
    loading: "Stemmen laden...",
    noVoices: "Helaas zijn er geen Oekraïense stemmen voor de voice-over gevonden in uw browser.",
    whyButton: "Waarom is dat?",
    hideDetailsButton: "Details verbergen",
    reasonTitle: "Oorzaak van het probleem",
    reasonContent: "Ons spel gebruikt stemmen die zijn ingebouwd in uw besturingssysteem en toegankelijk zijn via de browser. Sommige browsers, zoals Chrome op Windows, hebben niet altijd toegang tot de Oekraïense systeemstemmen.",
    recommendationsTitle: "Aanbevolen platforms",
    recommendationsContent: "Probeer een van deze opties voor de beste voice-overervaring:",
    platformEdge: "Microsoft Edge-browser op Windows.",
    platformAndroid: "Elke browser op mobiele apparaten met Android.",
    iosNotice: "iOS-ondersteuning is momenteel in ontwikkeling. We werken aan een oplossing en hopen deze binnenkort te herstellen.",
    iosWarning: "Waarschuwing! Vanwege technische beperkingen van iOS kan de voice-over onstabiel werken, vooral voor computerzetten. We werken aan het verbeteren van deze functie.",
    close: "Sluiten"
  },
  controlsPage: {
    title: "Besturing & Sneltoetsen",
    mainMovement: "Hoofdbesturing (NumPad)",
    altMovement: "Alternatieve besturing (WASD-stijl)",
    gameActions: "Spelacties",
    gameSettings: "Spelinstellingen beheren",
    upLeft: "Schuin omhoog-links",
    up: "Omhoog",
    upRight: "Schuin omhoog-rechts",
    left: "Links",
    right: "Rechts",
    downLeft: "Schuin omlaag-links",
    down: "Omlaag",
    downRight: "Schuin omlaag-rechts",
    downLeftNote: "(stelt ook afstand in op 1)",
    confirmMove: "Zet bevestigen",
    noMoves: "Aangeven \"geen zetten\"",
    toggleBlockMode: "Schakel \"Geblokkeerde Cellen Modus\" in/uit",
    toggleBoardVisibility: "Schakel bordzichtbaarheid in/uit",
    increaseBoard: "Bordgrootte vergroten",
    decreaseBoard: "Bordgrootte verkleinen",
    toggleSpeech: "Schakel zet-voiceover in/uit"
  },
  rulesPage: {
    title: "Spelregels \"Stay on the Board\"",
    goalTitle: "Doel van het spel",
    goalText: "\"Stay on the Board\" is een strategisch uithoudingsspel. Je doel is om het stuk zo lang mogelijk op het bord te houden, om de beurt met je tegenstander te zetten en hem te dwingen een fout te maken.",
    moveProcessTitle: "Zetproces",
    moveProcessText: "Een speler doet een zet met het bedieningspaneel onder het bord. Klikken op de bordcellen voert geen zetten uit.",
    step1: "Stap 1: Kies een richting.",
    step1Text: "Druk op een van de 8 pijlknoppen die overeenkomen met de richtingen op een numeriek toetsenbord (NumPad):",
    step2: "Stap 2: Kies een afstand.",
    step2Text: "Druk op de knop met een getal dat aangeeft hoeveel cellen het stuk moet verplaatsen. De maximale afstand hangt af van de bordgrootte (N-1).",
    step3: "Stap 3: Bevestig de zet.",
    step3Text: "Druk op de grote groene knop om je zet te voltooien.",
    winLossTitle: "Winst- en verliesvoorwaarden",
    youLose: "Je verliest als:",
    lose1: "Je zet het stuk van het bord haalt.",
    lose2: "Je probeert naar een reeds geblokkeerde cel te gaan (in de betreffende modus).",
    lose3: "Je op de knop \"Geen zetten\" drukt, maar je hebt eigenlijk nog beschikbare zetten.",
    youWin: "Je wint als:",
    win1: "Je tegenstander een van de bovengenoemde fouten maakt.",
    win2: "Je op \"Geen zetten\" drukt en het systeem bevestigt dat er inderdaad geen zetten beschikbaar zijn.",
    gameModesTitle: "Spelmodi",
    normalMode: "Normale modus",
    normalModeText: "Dit is de basismodus, ideaal voor beginners. Alle cellen blijven gedurende het spel beschikbaar. Het spel eindigt alleen wanneer een van de spelers het stuk van het bord haalt.",
    blockMode: "Geblokkeerde Cellen Modus",
    blockModeText: "Een complexere en strategische modus. De cel van waaruit een zet is gedaan, wordt geblokkeerd en is niet beschikbaar voor toekomstige zetten. Dit dwingt spelers om hun route zorgvuldig te plannen.",
    noMovesButtonTitle: "\"Geen zetten\" Knop",
    noMovesButtonText1: "Als je denkt dat het stuk geen geldige zetten meer heeft, kun je op deze knop drukken. Het systeem controleert je bewering:",
    noMovesWin: "Als je gelijk hebt (er zijn geen zetten) - win je.",
    noMovesLoss: "Als je je vergist (er is minstens één zet beschikbaar) - verlies je.",
    noMovesButtonText2: "Dit is een riskante maar soms noodzakelijke strategie om in een moeilijke situatie te winnen.",
    scoringTitle: "Puntensysteem",
    scoringText: "Voor elke succesvolle zet krijg je 1 punt. Hoe langer het spel duurt, hoe hoger je score. De score wordt in realtime weergegeven en wordt aan het einde van het spel vastgelegd.",
    settingsTitle: "Spelinstellingen",
    boardSize: "Bordgrootte",
    boardSizeText: "Je kunt de grootte van het speelveld veranderen van 2x2 naar 9x9."
  },
  header: {
    home: "Home",
    about: "Over",
    sverdle: "Sverdle"
  },
  onlineMenu: {
    title: "Online menu"
  },
  waitingForPlayer: {
    title: "Wachten op speler..."
  },
  joinRoom: {
    title: "Deelnemen aan kamer"
  },
  localGame: {
    title: "Lokaal spel"
  },
  ui: {
    closeAndReturnToMenu: 'Sluiten en terug naar hoofdmenu'
  }
};