<script>
 import { onMount, onDestroy } from 'svelte';
 import { playSound } from '$lib/stores/sounds.js';
 import LookTV from "$components/LookTV.svelte";

 onMount(() => {
  playSound('ding.mp3', 'tv');
 });

 onDestroy(() => {
  playSound('ding.mp3', 'phones');
 });
</script>

<LookTV />