<script lang="ts">
    import { page } from "$app/stores";
    import Lobby from "$lib/components/online/Lobby.svelte";

    $: roomId = $page.params.roomId;
</script>

<Lobby {roomId} />
