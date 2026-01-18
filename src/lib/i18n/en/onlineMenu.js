export default {
  title: "Online Lobby",
  createRoom: "Create Room",
  refresh: "Refresh",
  roomName: "Room Name",
  status: "Status",
  players: "Players",
  action: "Action",
  join: "Join",
  waiting: "Waiting",
  playing: "Playing",
  finished: "Finished",
  // FIX: Removed hardcoded suffix
  noRooms: "No rooms found.{lastInfo}",
  // FIX: Added separate key
  createFirst: " Create the first one!",
  lastRoomTime: "Last room was created {time}",
  timeUnits: {
    m: "m",
    h: "h",
    s: "s",
    justNow: "just now"
  },
  createRoomTitle: "Create Room",
  roomNamePlaceholder: "Room Name (optional)",
  privateRoom: "Private Room (link only)",
  cancel: "Cancel",
  create: "Create",
  enterNameTitle: "What is your name?",
  enterNamePlaceholder: "Your nickname",
  saveName: "Save",
  lobby: {
    title: "Waiting Room",
    waitingForPlayers: "Waiting for players...",
    ready: "Ready",
    notReady: "Not Ready",
    watchingReplay: "Watching Game Replay",
    viewingResults: "Viewing Results",
    startGame: "Start Game",
    leave: "Leave",
    host: "Host",
    you: "You",
    copyLink: "Copy ID",
    linkCopied: "Copied!",
    hostOnlySettings: "Only the host can change settings",
    allowGuestSettings: "Allow guests to change settings"
  },
  chat: {
    title: "Chat",
    placeholder: "Type a message...",
    empty: "Chat is empty"
  },
  errors: {
    fetchFailed: "Failed to fetch rooms",
    createFailed: "Failed to create room",
    joinFailed: "Failed to join room"
  },
  waitingForReturn: "Waiting for {name} to return...",
  waitingForPlayersList: "Waiting for Players",
  continueWaiting: "Continue Waiting",
  kickPlayer: "Kick Player",
  reconnecting: "Player is attempting to reconnect. If they don't return, the game will end or they will be removed.",
  leaveRoom: "Leave Game",
  playerDisconnected: "{name} has been removed from the game."
};