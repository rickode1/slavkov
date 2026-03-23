<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import Star from "$components/svg/Star.svelte";

 let { player = null, small = false, hideStars = false } = $props();

 const MAX_ROUNDS = 3;

 let bustColor = $derived(player?.bust ? `var(--color-bust-${player.bust})` : null);

 let playerNum = $derived(
  $gameSession?.player_1 === player ? 1 : $gameSession?.player_2 === player ? 2 : null
 );

 let roundWins = $derived.by(() => {
  const wins = [];
  for (let i = 1; i <= MAX_ROUNDS; i++) {
   wins.push($gameSession?.[`round_${i}`]?.winner === playerNum);
  }
  return wins;
 });
</script>

<div class="flex flex-col items-center">
 <div class="relative">
  <img
   class="{small ? 'w-18 h-auto' : 'w-20 lg:w-32 h-auto'}"
   src={"/img/bust_" + player?.bust + ".webp"}
   alt=""
  />
  {#if !small && !hideStars && playerNum !== null}
   <div class="absolute top-0 {playerNum === 1 ? 'left-[calc(100%-1rem)]' : 'right-[calc(100%-1rem)]'} flex flex-row gap-2 pt-2">
    {#each { length: MAX_ROUNDS } as _, i}
     <div class="w-5" style={roundWins[i] ? `color: ${bustColor}` : 'color: color-mix(in srgb, #6b7280 60%, transparent)'}>
      <Star />
     </div>
    {/each}
   </div>
  {/if}
 </div>
 {#if !small}
 <p class="text-lg lg:text-2xl font-bold text-center" style={`color: ${bustColor}`}>{player?.nick}</p>
 {/if}
</div>
