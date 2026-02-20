<script>
 import { fly, fade } from "svelte/transition";
 import { optimize } from "$lib/image";
 import { gameSession } from "$lib/stores/gameSession.js";
 import { strokeStyle } from "$lib/constants.js";
 import Card from "$components/Card.svelte";
 import * as m from "$lib/paraglide/messages.js";

 let { visible = false, onHighlightCard = null } = $props();

 let displayedDifficulty = $state(10);
 let activeCard = $state(null);
 let showDice = $state(false);

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let startingPlayer = $derived(roundData()?.starting_player || 1);
 let defenderNum = $derived(startingPlayer === 1 ? 2 : 1);

 let player1UnitImg = $derived(() => {
  const rd = roundData();
  if (!rd || !$gameSession) return null;
  const bust = $gameSession.player_1?.bust;
  const unit = rd.unit_1;
  return bust && unit ? `/img/unit_${bust}_${unit}.png` : null;
 });

 let player2UnitImg = $derived(() => {
  const rd = roundData();
  if (!rd || !$gameSession) return null;
  const bust = $gameSession.player_2?.bust;
  const unit = rd.unit_2;
  return bust && unit ? `/img/unit_${bust}_${unit}.png` : null;
 });

 let player1Stroke = $derived(
  strokeStyle($gameSession?.player_1?.bust, 4)
 );
 let player2Stroke = $derived(
  strokeStyle($gameSession?.player_2?.bust, 4)
 );

 let attackerName = $derived(
  $gameSession?.[`player_${startingPlayer}`]?.nick || ""
 );

 $effect(() => {
  if (visible) {
   startAttackSequence();
  }
 });

 function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
 }

 async function startAttackSequence() {
  const rd = roundData();
  if (!rd) return;

  displayedDifficulty = 10;

  const suffix = `_${startingPlayer}`;
  const steps = [];

  const locVal = rd[`bonus_loc${suffix}`];
  if (locVal !== undefined && locVal !== 0) {
   steps.push({ type: "loc", value: locVal });
  }

  const dmgCount = rd[`bonuses_dmg${suffix}`] || 0;
  if (dmgCount > 0) {
   steps.push({ type: "dmg", value: dmgCount });
  }

  let current = 10;

  await sleep(1500);

  for (const step of steps) {
   onHighlightCard?.(step.type);
   activeCard = { type: step.type, value: step.value > 0 ? step.value : Math.abs(step.value) };
   await sleep(800);
   const target = current - step.value;
   while (current > target) {
    current--;
    displayedDifficulty = current;
    await sleep(400);
   }
   await sleep(600);
   activeCard = null;
   await sleep(400);
  }

  await sleep(300);
  showDice = true;
 }
</script>

{#if visible}
 <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 max-w-360 mx-auto">
  <div
   class="relative w-[calc(100%-28rem)] aspect-31/18 flex flex-col items-center justify-start gap-4 pt-20"
   transition:fly={{ y: -500, duration: 600 }}
  >
   <img
    class="absolute inset-0 w-full h-full object-cover rounded-2xl"
    srcset={optimize("/img/battle_bg.png")}
    alt=""
   />

   <!-- Units -->
   <div class="relative z-10 flex items-end justify-center gap-4">
    {#if player1UnitImg()}
     <img
      class="h-26 object-contain {startingPlayer === 1 ? 'rotate-10 -translate-y-2' : ''}"
      style={startingPlayer === 1 ? player1Stroke : ''}
      srcset={optimize(player1UnitImg())}
      alt="Player 1"
     />
    {/if}
    {#if player2UnitImg()}
     <img
      class="h-26 object-contain {startingPlayer === 2 ? '-rotate-10 -translate-y-2' : ''}"
      style={startingPlayer === 2 ? player2Stroke : ''}
      srcset={optimize(player2UnitImg())}
      alt="Player 2"
     />
    {/if}
   </div>

   <!-- Attack difficulty -->
   <div class="relative z-10 flex flex-col items-center mt-4">
    <div class="flex items-center justify-center overflow-hidden h-32 w-32 rounded-full bg-primary text-white">
     <span class="absolute top-4 text-center">{m.battle_difficulty()}</span>
     {#key displayedDifficulty}
      <span
       class="absolute w-full text-6xl text-center mt-3 lining-nums font-mono"
       in:fly={{ y: -80, duration: 400 }}
       out:fly={{ y: 80, duration: 400 }}
      >
       {displayedDifficulty}
      </span>
     {/key}
    </div>
    <div class="{activeCard ? 'h-28' : 'h-0'} flex items-start justify-center mt-4 transition-[height] duration-300">
     {#if activeCard}
      <div transition:fade={{ duration: 300 }}>
       <Card type={activeCard.type} value={activeCard.value} />
      </div>
     {/if}
    </div>

    {#if showDice}
     <div class="dice-float mt-6 relative" transition:fade={{ duration: 400 }}>
      <span class="bg-secondary text-white text-center px-6 py-2 shadow-lg mb-2 whitespace-nowrap absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-sm">
       {m.battle_roll_dice()}
      </span>
      <img
       class="h-32 object-contain drop-shadow-lg"
       srcset={optimize("/img/dice.png")}
       alt="Dice"
      />
      <div class="dice-shadow"></div>
     </div>
    {/if}
   </div>
  </div>
 </div>
{/if}