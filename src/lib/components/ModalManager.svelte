<script lang="ts">
	import { onMount } from "svelte";
	import { gameEventBus } from "$lib/services/gameEventBus";
	import { userActionService } from "$lib/services/userActionService";
	import { get } from "svelte/store";
	import { modalStore } from "$lib/stores/modalStore";
	import { t as tStore } from "$lib/i18n/typedI18n";
	import type { TranslationKey } from "$lib/types/i18n";
	import { locale } from "svelte-i18n";
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
					const title = get(tStore)(titleKey as TranslationKey);
					const lang = get(locale) || "uk";
					const voiceURI = get(gameSettingsStore).selectedVoiceURI;
					speakText(title, lang, voiceURI, undefined);
				}

				modalStore.showModal({
					component: GameOverContent,
					variant: "menu",
					content: {
						reason: get(tStore)(contentKey as TranslationKey),
						scoreDetails: scoreDetails,
						playerScores: playerScores,
					},
					// FIX: Передаємо дії як props, а не як buttons
					props: {
						titleKey: titleKey,
						mode: "no-moves",
						finishText: get(tStore)("modal.finishGameWithBonus", {
							bonus: boardSize,
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
						dataTestId:
							playerType === "human"
								? "player-no-moves-modal"
								: "opponent-trapped-modal",
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
