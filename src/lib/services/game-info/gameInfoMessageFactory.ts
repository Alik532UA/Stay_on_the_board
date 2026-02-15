import type { PlayerState } from "$lib/stores/playerStore";
import type { UiState } from "$lib/stores/uiStateStore";
import type { TranslationKey } from "$lib/types/i18n";

export interface GameInfoContext {
    playerState: PlayerState;
    isGameOver: boolean;
    isFirstMove: boolean;
    lastComputerMove: { direction: string; distance: number } | null;
    lastPlayerMove: { direction: string; distance: number } | null;
    isPlayerTurn: boolean;
    translate: (key: TranslationKey, values?: any) => string;
    isCompact: boolean;
    gameSettings: any;
    uiState: UiState;
}

const directionArrows: Record<string, string> = {
    "up-left": "↖",
    up: "↑",
    "up-right": "↗",
    left: "←",
    right: "→",
    "down-left": "↙",
    down: "↓",
    "down-right": "↘",
};

function getPlayerColor(players: any[], playerName: string): string | null {
    const player = players.find((p) => p.name === playerName);
    return player ? player.color : null;
}

function getPlayerNameStyle(players: any[], playerName: string): string {
    const color = getPlayerColor(players, playerName);
    return color ? `background-color: ${color};` : "";
}

export function createGameInfoMessage(ctx: GameInfoContext) {
    const {
        playerState,
        isGameOver,
        isFirstMove,
        lastComputerMove,
        lastPlayerMove,
        isPlayerTurn,
        translate: t,
        isCompact,
        gameSettings,
        uiState,
    } = ctx;

    if (!playerState) return { type: "SIMPLE", content: "" };

    const humanPlayersCount = playerState.players.filter(
        (p: any) => p.type === "human",
    ).length;
    const isLocalGame = humanPlayersCount > 1;
    const currentPlayer = playerState.players[playerState.currentPlayerIndex];

    if (isGameOver)
        return { type: "SIMPLE", content: t("gameBoard.gameInfo.gameOver") };

    if (isFirstMove) {
        if (uiState.intendedGameType === "online") {
            if (isPlayerTurn) {
                return {
                    type: "SIMPLE",
                    content: `${t("gameBoard.gameInfo.firstMove")}\n${t("gameBoard.gameInfo.yourTurnToMakeAMove")}`,
                };
            } else {
                return {
                    type: "STRUCTURED",
                    lines: [
                        {
                            type: "line" as const,
                            parts: [
                                {
                                    type: "text" as const,
                                    content: t("gameBoard.gameInfo.firstMove"),
                                },
                            ],
                        },
                        {
                            type: "line" as const,
                            parts: [
                                { type: "text" as const, content: t("gameBoard.gameInfo.nowTurn") + ": " },
                                {
                                    type: "player" as const,
                                    name: currentPlayer.name,
                                    style: getPlayerNameStyle(
                                        playerState.players,
                                        currentPlayer.name,
                                    ),
                                },
                            ],
                        },
                    ],
                };
            }
        }

        if (isLocalGame) {
            return {
                type: "STRUCTURED",
                lines: [
                    {
                        type: "line" as const,
                        parts: [
                            {
                                type: "text" as const,
                                content: t("gameBoard.gameInfo.firstMove"),
                            },
                        ],
                    },
                    {
                        type: "line" as const,
                        parts: [
                            {
                                type: "player" as const,
                                name: currentPlayer.name,
                                style: getPlayerNameStyle(
                                    playerState.players,
                                    currentPlayer.name,
                                ),
                            },
                            {
                                type: "text" as const,
                                content:
                                    ", " +
                                    t(
                                        "gameBoard.gameInfo.yourTurnToMakeAMove",
                                    ).toLowerCase(),
                            },
                        ],
                    },
                ],
            };
        }

        let message = `${t("gameBoard.gameInfo.firstMove")}\n`;
        if (gameSettings.gameMode !== "beginner") {
            message += `${t("gameBoard.gameInfo.rememberPieceLocation")}\n`;
        }
        message += t("gameBoard.gameInfo.yourTurnToMakeAMove");
        return { type: "SIMPLE", content: message };
    }

    if (lastComputerMove) {
        const directionKey = lastComputerMove.direction.replace(
            /-(\w)/g,
            (_: string, c: string) => c.toUpperCase(),
        );
        const direction = t(`gameBoard.directions.${directionKey}` as TranslationKey);
        const distance = lastComputerMove.distance;

        if (isCompact) {
            return {
                type: "COMPACT_COMPUTER_MOVE",
                part1: t("gameBoard.gameInfo.computerMadeMovePart1"),
                move: `${directionArrows[lastComputerMove.direction] || "?"}${distance}`,
                part2: t("gameBoard.gameInfo.computerMadeMovePart2"),
            };
        }
        return {
            type: "SIMPLE",
            content: t("gameBoard.gameInfo.computerMadeMove", {
                direction,
                distance,
            }),
        };
    }

    if (lastPlayerMove && isLocalGame) {
        const previousPlayerIndex =
            (playerState.currentPlayerIndex + playerState.players.length - 1) %
            playerState.players.length;
        const previousPlayer = playerState.players[previousPlayerIndex];
        const safePreviousPlayer = playerState.players[previousPlayerIndex];

        const directionKey = lastPlayerMove.direction.replace(
            /-(\w)/g,
            (_: string, c: string) => c.toUpperCase(),
        );
        const direction = t(`gameBoard.directions.${directionKey}` as TranslationKey);

        return {
            type: "STRUCTURED",
            lines: [
                {
                    type: "line" as const,
                    parts: [
                        {
                            type: "text" as const,
                            content: t("gameBoard.gameInfo.playerMadeMove", {
                                player: safePreviousPlayer.name,
                                direction,
                                distance: lastPlayerMove.distance
                            })
                        }
                    ],
                },
                {
                    type: "line" as const,
                    parts: [
                        {
                            type: "text" as const,
                            content: t("gameBoard.gameInfo.nextTurnPrompt", {
                                player: currentPlayer.name
                            })
                        }
                    ],
                },
            ],
        };
    }

    if (isPlayerTurn) {
        if (isLocalGame) {
            return {
                type: "STRUCTURED",
                lines: [
                    {
                        type: "line" as const,
                        parts: [
                            { type: "text" as const, content: t("gameBoard.gameInfo.playerTurnLabel") + ": " },
                            {
                                type: "player" as const,
                                name: currentPlayer.name,
                                style: getPlayerNameStyle(
                                    playerState.players,
                                    currentPlayer.name,
                                ),
                            },
                        ],
                    },
                ],
            };
        }
        return { type: "SIMPLE", content: t("gameBoard.gameInfo.playerTurn") };
    }

    if (!isPlayerTurn) {
        if (uiState.intendedGameType === "online") {
            return {
                type: "STRUCTURED",
                lines: [
                    {
                        type: "line" as const,
                        parts: [
                            { type: "text" as const, content: t("gameBoard.gameInfo.nowTurn") + ": " },
                            {
                                type: "player" as const,
                                name: currentPlayer.name,
                                style: getPlayerNameStyle(
                                    playerState.players,
                                    currentPlayer.name,
                                ),
                            },
                        ],
                    },
                ],
            };
        }
        return {
            type: "SIMPLE",
            content: t("gameBoard.gameInfo.computerTurn"),
        };
    }

    return { type: "SIMPLE", content: t("gameBoard.gameInfo.gameStarted") };
}
