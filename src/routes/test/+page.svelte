
<svelte:head>
	<title>Pulsating Button Test</title>
</svelte:head>

<div class="container">
	<h1>Pulsating Button Effect</h1>

	<div class="grid">
		<button class="btn ripple">Ripple Effect</button>
	</div>
</div>

<style>
	.container {
		padding: 2rem;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
	}

	h1 {
		text-align: center;
		margin-bottom: 3rem;
		color: var(--text-accent);
	}

	.grid {
		display: grid;
		justify-items: center;
	}

	.btn {
		padding: 1rem 1.5rem;
		border: none;
		border-radius: var(--unified-radius, 12px);
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		color: var(--confirm-btn-text);
		background-color: var(--confirm-btn-bg);
		box-shadow: var(--unified-shadow);
	}

	/* --- Ripple Animation --- */
	.btn.ripple::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		opacity: 0;
        animation: ripple 4.5s infinite linear;
        background-color: rgba(255, 255, 255, 0.07);
        filter: blur(1.5px);
	}

	@keyframes ripple {
		from {
			width: 0;
			height: 0;
			opacity: 1;
		}
		to {
			width: 300px;
			height: 300px;
			opacity: 0;
		}
	}

</style>
