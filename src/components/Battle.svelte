<script>
 import { fly, fade } from "svelte/transition";
 import { optimize } from "$lib/image";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import { strokeStyle } from "$lib/constants.js";
 import Card from "$components/Card.svelte";
 import * as m from "$lib/paraglide/messages.js";

 let { visible = false, onHighlightCard = null } = $props();

 let displayedDifficulty = $state(10);
 let activeCard = $state(null);
 let showDice = $state(false);
 let diceRolling = $state(false);
 let revealedRoll = $state(null);
 let rollOutcome = $state(null); // 'success' | 'fail' | null
 let processingTurn = null;

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let startingPlayer = $derived(roundData()?.current_turn?.player || 1);
 let defenderNum = $derived(startingPlayer === 1 ? 2 : 1);
 let role = $derived(roundData()?.current_turn?.role || 'dmg');
 let baseDifficulty = $derived(role === 'def' ? 14 : 10);
 let turnNumber = $derived(roundData()?.current_turn?.number ?? 0);

 let currentRoll = $derived(() => {
  const rd = roundData();
  const roll = rd?.turns?.[turnNumber]?.roll;
  return roll ?? null;
 });

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

 let activePlayerName = $derived(
  $gameSession?.[`player_${startingPlayer}`]?.nick || ""
 );

 $effect(() => {
  if (visible && turnNumber != null) {
   startTurnSequence();
  }
 });

 $effect(() => {
  const roll = currentRoll();
  if (roll != null && processingTurn !== turnNumber) {
   processingTurn = turnNumber;
   revealRoll(roll);
  }
 });

 async function revealRoll(roll) {
  showDice = true;
  diceRolling = true;
  await sleep(2000);
  diceRolling = false;
  revealedRoll = roll;
  await sleep(1000);
  rollOutcome = roll > displayedDifficulty ? 'success' : 'fail';
  await sleep(2000);
  const res = await fetch('/api/session/battle/advance', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    sessionId: $sessionId,
    success: rollOutcome === 'success',
   }),
  });

  if (res.ok) {
   const data = await res.json();
   if (data.next !== 'round') {
    showDice = false;
    diceRolling = false;
    revealedRoll = null;
    rollOutcome = null;
    activeCard = null;
    processingTurn = null;
   } else {
    visible = false;
    await Promise.all([
     fetch('/api/session/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: $sessionId, status: '7-roundend' }),
     }),
     sleep(600),
    ]);
   }
  }
 }

 function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
 }

 async function startTurnSequence() {
  const rd = roundData();

  if (!rd) return;
  if (currentRoll()) return;

  displayedDifficulty = baseDifficulty;

  const suffix = `_${startingPlayer}`;
  const steps = [];

  const locVal = rd[`bonus_loc${suffix}`];
  if (locVal !== undefined && locVal !== 0) {
   steps.push({ type: "loc", value: locVal });
  }

  const dmgCount = rd[`bonuses_${role}${suffix}`] || 0;
  if (dmgCount > 0) {
   steps.push({ type: role, value: dmgCount });
  }

  let current = baseDifficulty;

  await sleep(1500);

  for (const step of steps) {
   onHighlightCard?.(step.type);
   activeCard = { type: step.type, value: step.value };
   await sleep(800);
   const target = current - step.value;
   while (current !== target) {
    current += current < target ? 1 : -1;
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
 <div class="fixed inset-0 z-50 flex items-start justify-center my-30 max-w-360 mx-auto">
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
      class="h-22 object-contain {(startingPlayer === 1 && role === 'dmg') || (defenderNum === 1 && role === 'def') ? 'rotate-10 -translate-y-2' : ''}"
      style={startingPlayer === 1 ? player1Stroke : ''}
      srcset={optimize(player1UnitImg())}
      alt="Player 1"
     />
    {/if}
    {#if player2UnitImg()}
     <img
      class="h-22 object-contain {(startingPlayer === 2 && role === 'dmg') || (defenderNum === 2 && role === 'def') ? '-rotate-10 -translate-y-2' : ''}"
      style={startingPlayer === 2 ? player2Stroke : ''}
      srcset={optimize(player2UnitImg())}
      alt="Player 2"
     />
    {/if}
   </div>

   <!-- Difficulty -->
   <div class="relative z-10 flex flex-col items-center">
     <div
      class="flex items-center justify-center overflow-hidden h-26 w-26 rounded-full bg-primary text-white transition-all duration-700
       {rollOutcome === 'success' ? 'grayscale-100' : ''}"
     >
      <span class="absolute top-4 text-center text-sm">{m.battle_difficulty()}</span>
     {#key displayedDifficulty}
      <span
       class="absolute w-full text-4xl text-center mt-3 lining-nums font-mono"
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
     <div class="{!revealedRoll ? 'dice-float mt-4' : 'mt-3'} relative transition-all duration-700
      {rollOutcome === 'fail' ? 'grayscale-100' : ''}" transition:fade={{ duration: 400 }}>
      {#if (!diceRolling && !revealedRoll) || rollOutcome}
       <span
        class="text-white text-center px-6 py-2 shadow-lg mb-2 whitespace-nowrap absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-sm bg-secondary"
       >
        {#if rollOutcome === 'success'}
         Úspěch!
        {:else if rollOutcome === 'fail'}
         Neúspěch!
        {:else}
         {activePlayerName}, {m.battle_roll_dice()}
        {/if}
       </span>
      {/if}

      <div class="relative flex items-center justify-center">
       <img
        class="h-40 object-contain drop-shadow-lg {diceRolling ? 'dice-rolling' : ''}"
        srcset={optimize("/img/dice.png")}
        alt="Dice"
       />
       {#if revealedRoll}
        <div class="roll-result absolute inset-0 flex items-center justify-center text-black/90">
         <span class="text-4xl mb-5.5 lining-nums">{revealedRoll}</span>
        </div>
       {/if}
      </div>
      {#if !revealedRoll}
      <div class="dice-shadow {diceRolling ? 'shadow-rolling' : ''}"></div>
      {/if}
     </div>
    {/if}
   </div>
  </div>
 </div>
{/if}