<script lang="ts">
	import { onMount } from "svelte";
	import { gameEventBus } from "$lib/services/gameEventBus";
	import { userActionService } from "$lib/services/userActionService";
	import { get } from "svelte/store";
	import { modalStore } from "$lib/stores/modalStore";
	import { _, locale } from "svelte-i18n";
	import { gameSettingsStore } from "$lib/stores/gameSettingsStore";
	import { speakText } from "$lib/services/speechService";
	import GameOverContent from "$lib/components/modals/GameOverContent.svelte";

	onMount(() => {
		const unsubscribe = gameEventBus.subscribe(
			"ShowNoMovesModal",
			(payload) => {
				const { playerType, scoreDetails, boardSize, playerScores } =
					payload;
				const titleKey =
					playerType === "human"
						? "modal.playerNoMovesTitle"
						: "modal.computerNoMovesTitle";
				const contentKey =
					playerType === "human"
						? "modal.playerNoMovesContent"
						: "modal.computerNoMovesContent";

				if (get(gameSettingsStore).speakModalTitles) {
					const title = get(_)(titleKey);
					const lang = get(locale) || "uk";
					const voiceURI = get(gameSettingsStore).selectedVoiceURI;
					speakText(title, lang, voiceURI, undefined);
				}

				modalStore.showModal({
					component: GameOverContent,
					variant: "menu",
					content: {
						reason: get(_)(contentKey),
						scoreDetails: scoreDetails,
						playerScores: playerScores,
					},
					// FIX: Передаємо дії як props, а не як buttons
					props: {
						titleKey: titleKey,
						mode: "no-moves",
						finishText: get(_)("modal.finishGameWithBonus", {
							values: { bonus: boardSize },
						}),
						onContinue: () =>
							userActionService.handleModalAction(
								"continueAfterNoMoves",
							),
						onFinish: () =>
							userActionService.handleModalAction(
								"finishWithBonus",
								{ reasonKey: "modal.gameOverReasonBonus" },
							),
						onWatchReplay: () =>
							userActionService.handleModalAction(
								"requestReplay",
							),
					},
					buttons: [], // Кнопки тепер всередині компонента
					closable: false,
					dataTestId:
						playerType === "human"
							? "player-no-moves-modal"
							: "opponent-trapped-modal",
				});
			},
		);

		return () => {
			unsubscribe();
		};
	});
</script>
