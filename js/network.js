// network.js — онлайн-логіка (WebRTC, signaling, кімнати)

export function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function updateConnectionStatus(connected, text, connectionIndicatorEl, connectionTextEl) {
    connectionIndicatorEl.textContent = connected ? '🟢' : '🔴';
    connectionTextEl.textContent = text;
}

// Далі можна поступово переносити createRoom, joinRoom, connectToSignalingServer, handleSignalingMessage, initializeWebRTC, createOffer, handleOffer, handleAnswer, handleIceCandidate, onDataChannel, onDataChannelOpen, onDataChannelMessage, onDataChannelClose, onDataChannelError, onIceCandidate, onConnectionStateChange, handleGameMessage, handleGameEnd, handleGameStart, sendMoveToOpponent, handleOpponentMove, startOnlineGame, endOnlineGame, handleOpponentNoMoves 