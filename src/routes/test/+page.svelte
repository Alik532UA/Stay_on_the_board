<script lang="ts">
	import SvgIcons from "$lib/components/SvgIcons.svelte";
	import { onMount } from "svelte";

	// Параметри для динамічного налаштування (5-й варіант)
	let waveCount = 3;
	let maxScale = 1.8;
	let duration = 2.5;
	let maxOpacity = 0.4;
	let delayBetweenWaves = 0;

	// Реактивний розрахунок затримки для рівномірного розподілу хвиль
	$: delayBetweenWaves = duration / waveCount;
</script>

<div class="test-container">
	<h1>Тестування Inward Pulse (Хвилі всередину)</h1>

	<div class="grid">
		<!-- Варіант 1: Standard Inward -->
		<div class="card">
			<h3>1. Standard Inward</h3>
			<p>Класичний подвійний пульс, що звужується до кнопки.</p>
			<div class="center-container">
				<button class="play-btn-circle inward-1">
					<div class="play-icon"><SvgIcons name="piece" /></div>
					<!-- Використовуємо HTML елементи для хвиль, щоб мати повний контроль -->
					<div class="wave"></div>
					<div class="wave" style="animation-delay: 1s;"></div>
				</button>
			</div>
		</div>

		<!-- Варіант 2: Wide Inward -->
		<div class="card">
			<h3>2. Wide Inward</h3>
			<p>Хвилі починаються дуже далеко (Scale 2.2).</p>
			<div class="center-container">
				<button class="play-btn-circle inward-2">
					<div class="play-icon"><SvgIcons name="piece" /></div>
					<div class="wave"></div>
					<div class="wave" style="animation-delay: 1s;"></div>
				</button>
			</div>
		</div>

		<!-- Варіант 3: Triple Flow -->
		<div class="card">
			<h3>3. Triple Flow</h3>
			<p>3 хвилі, швидший темп, постійний рух.</p>
			<div class="center-container">
				<button class="play-btn-circle inward-3">
					<div class="play-icon"><SvgIcons name="piece" /></div>
					<div class="wave"></div>
					<div class="wave" style="animation-delay: 0.66s;"></div>
					<div class="wave" style="animation-delay: 1.33s;"></div>
				</button>
			</div>
		</div>

		<!-- Варіант 4: Soft & Slow -->
		<div class="card">
			<h3>4. Soft & Slow</h3>
			<p>Дуже повільне, ледь помітне "дихання" всередину.</p>
			<div class="center-container">
				<button class="play-btn-circle inward-4">
					<div class="play-icon"><SvgIcons name="piece" /></div>
					<div class="wave"></div>
					<div class="wave" style="animation-delay: 1.5s;"></div>
				</button>
			</div>
		</div>
	</div>

	<!-- Варіант 5: Конструктор -->
	<div class="playground-section">
		<h2>5. Конструктор анімації (Dev Playground)</h2>

		<div class="controls">
			<div class="control-group">
				<label for="waveCount">Кількість хвиль: {waveCount}</label>
				<input
					id="waveCount"
					type="range"
					min="1"
					max="6"
					step="1"
					bind:value={waveCount}
				/>
			</div>
			<div class="control-group">
				<label for="maxScale">Розмах (Scale): {maxScale}</label>
				<input
					id="maxScale"
					type="range"
					min="1.1"
					max="3.0"
					step="0.1"
					bind:value={maxScale}
				/>
			</div>
			<div class="control-group">
				<label for="duration">Швидкість (сек): {duration}s</label>
				<input
					id="duration"
					type="range"
					min="0.5"
					max="5.0"
					step="0.1"
					bind:value={duration}
				/>
			</div>
			<div class="control-group">
				<label for="maxOpacity">Прозорість: {maxOpacity}</label>
				<input
					id="maxOpacity"
					type="range"
					min="0.1"
					max="1.0"
					step="0.05"
					bind:value={maxOpacity}
				/>
			</div>
		</div>

		<div class="center-container dynamic-preview">
			<button
				class="play-btn-circle"
				data-testid="dev-menu-center-play-btn"
			>
				<div class="play-icon"><SvgIcons name="piece" /></div>

				{#each Array(waveCount) as _, i}
					<div
						class="wave dynamic-wave"
						style="
							animation-duration: {duration}s;
							animation-delay: {i * (duration / waveCount)}s;
							--max-scale: {maxScale};
							--max-opacity: {maxOpacity};
						"
					></div>
				{/each}
			</button>
		</div>
	</div>
</div>

<style>
	.test-container {
		padding: 40px;
		background: #222;
		min-height: 100vh;
		color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 40px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 30px;
		width: 100%;
		max-width: 1200px;
	}

	.card {
		background: rgba(255, 255, 255, 0.05);
		padding: 20px;
		border-radius: 16px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* --- Стилі кнопки (як на MainMenuV2) --- */
	.center-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 30px;
		margin-bottom: 30px;
		position: relative;
	}

	.play-btn-circle {
		width: 160px;
		height: 160px;
		border-radius: 50%;
		/* Прибрано обводку, фон як у гамбургера */
		border: none;
		background: var(--bg-secondary, #23272f);

		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 10; /* Кнопка вище хвиль */
	}

	.play-icon {
		width: 60%;
		height: 60%;
		color: #fff;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		position: relative;
		z-index: 11;
	}

	/* --- Базовий стиль хвилі --- */
	.wave {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1); /* Біла тінь/світло */
		z-index: -1; /* Під кнопкою */
		pointer-events: none;
		opacity: 0;
	}

	/* --- Анімація Inward (Загальна) --- */
	@keyframes pulse-in {
		0% {
			transform: scale(var(--start-scale, 1.5));
			opacity: 0;
		}
		20% {
			opacity: var(--target-opacity, 0.3);
		}
		100% {
			transform: scale(1);
			opacity: 0;
		}
	}

	/* --- Варіант 1: Standard --- */
	.inward-1 .wave {
		--start-scale: 1.6;
		--target-opacity: 0.25;
		animation: pulse-in 2s infinite linear;
	}

	/* --- Варіант 2: Wide --- */
	.inward-2 .wave {
		--start-scale: 2.2; /* Широкий розмах */
		--target-opacity: 0.2;
		animation: pulse-in 2s infinite linear;
	}

	/* --- Варіант 3: Triple Flow --- */
	.inward-3 .wave {
		--start-scale: 1.7;
		--target-opacity: 0.25;
		animation: pulse-in 2s infinite linear;
	}

	/* --- Варіант 4: Soft & Slow --- */
	.inward-4 .wave {
		--start-scale: 1.5;
		--target-opacity: 0.15; /* Дуже прозоро */
		animation: pulse-in 3s infinite ease-in-out;
	}

	/* --- Playground Section --- */
	.playground-section {
		width: 100%;
		max-width: 800px;
		background: rgba(0, 0, 0, 0.3);
		padding: 30px;
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		width: 100%;
		margin-bottom: 20px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	label {
		font-weight: bold;
		color: #ccc;
	}

	input[type="range"] {
		width: 100%;
		cursor: pointer;
	}

	/* Динамічна хвиля для конструктора */
	.dynamic-wave {
		--start-scale: var(--max-scale);
		--target-opacity: var(--max-opacity);
		animation: pulse-in infinite linear; /* duration задається inline */
	}
</style>
