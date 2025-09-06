<script lang="ts">
  import { onMount } from 'svelte';
  import { gameEventBus } from '$lib/services/gameEventBus';
  import { userActionService } from '$lib/services/userActionService';
  import { get } from 'svelte/store';
  import { modalStore } from '$lib/stores/modalStore';
  import { _ } from 'svelte-i18n';

  onMount(() => {
  	const unsubscribe = gameEventBus.subscribe('ShowNoMovesModal', (payload) => {
  		const { playerType, scoreDetails, boardSize } = payload;
  		const titleKey = playerType === 'human' ? 'modal.playerNoMovesTitle' : 'modal.computerNoMovesTitle';
  		const contentKey = playerType === 'human' ? 'modal.playerNoMovesContent' : 'modal.computerNoMovesContent';
 
  		modalStore.showModal({
  			titleKey,
  			content: {
  				reason: get(_)(contentKey),
  				scoreDetails: scoreDetails
  			},
  			buttons: [
  				{ textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: () => userActionService.handleModalAction('continueAfterNoMoves'), dataTestId: 'continue-game-no-moves-btn' },
  				{
  					text: get(_)('modal.finishGameWithBonus', { values: { bonus: boardSize } }),
  					onClick: () => userActionService.handleModalAction('finishWithBonus', { reasonKey: 'modal.gameOverReasonBonus' }),
  					dataTestId: 'finish-game-with-bonus-btn'
  				},
  				{ textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => userActionService.handleModalAction('requestReplay'), dataTestId: `watch-replay-${playerType}-no-moves-btn` }
  			],
  			closable: false,
  			dataTestId: playerType === 'human' ? 'player-no-moves-modal' : 'opponent-trapped-modal'
  		});
  	});
 
  	return () => {
      unsubscribe();
    };
  });
</script>