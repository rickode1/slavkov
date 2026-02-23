<script>
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages";

 import Help from "$components/Help.svelte";
 import Button from "$components/Button.svelte";
 import Loader from "$components/Loader.svelte";

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);

 let activePlayerNumber = $derived(() => {
  const round = $gameSession?.current_round || 1;
  return $gameSession?.[`round_${round}`]?.current_turn?.player || 1;
 });

 let isActivePlayer = $derived(myPlayerNumber === activePlayerNumber());

 let turnNumber = $derived(() => {
  const round = $gameSession?.current_round || 1;
  return $gameSession?.[`round_${round}`]?.current_turn?.number ?? 0;
 });

 let sessionRoll = $derived(() => {
  const round = $gameSession?.current_round || 1;
  const rd = $gameSession?.[`round_${round}`];
  return rd?.turns?.[turnNumber()]?.roll ?? null;
 });

 let rolling = $state(false);
 let animationDone = $state(false);
 let showUI = $state(false);

 let rolled = $derived(animationDone && !!sessionRoll());
 let rollResult = $derived(rolled ? sessionRoll() : null);

 let uiTimer = null;
 $effect(() => {
  const active = isActivePlayer;
  const turn = turnNumber();
  if (active && !sessionRoll()) {
   if (uiTimer) clearTimeout(uiTimer);
   showUI = false;
   animationDone = false;
   uiTimer = setTimeout(() => {
    showUI = true;
   }, 4500);
  } else if (showUI) {
   if (uiTimer) clearTimeout(uiTimer);
   uiTimer = setTimeout(() => {
    showUI = false;
   }, 5000);
  }
 });

 async function rollDice(forcedRoll = null) {
  if (rolling) return;
  rolling = true;

  const body = { sessionId: $sessionId, playerCode: $playerCode };
  if (forcedRoll) body.debugRoll = forcedRoll;

  const [response] = await Promise.all([
   fetch('/api/session/battle/roll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
   }),
   new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  rolling = false;
  animationDone = true;

  if (!response.ok) {
   console.error('Failed to roll dice');
  }
 }
</script>

{#if $gameSession}
 <Help player={myPlayer()}>
  <p class="text-xl"></p>
 </Help>

 <div class="flex flex-col items-center gap-6 mt-60">
  {#if isActivePlayer && showUI}
  <div class="dice-float">
   <div class="relative flex items-center justify-center">
    <img
     class="h-32 object-contain drop-shadow-lg {rolling ? 'dice-rolling' : ''}"
     srcset={optimize("/img/dice.png")}
     alt="Dice"
    />
    {#if rolled && rollResult}
     <div class="roll-result absolute inset-0 flex items-center justify-center text-black/90">
      <span class="text-3xl mb-5 lining-nums">{rollResult}</span>
     </div>
    {/if}
   </div>
   <div class="dice-shadow {rolling ? 'shadow-rolling' : ''}"></div>
  </div>

  {#if !rolled}
   {#if rolling}
    <Loader classes="mt-4" />
   {:else}
    <Button
     text={m.battle_roll_button()}
     onclick={() => rollDice()}
     classes="!text-2xl !h-14 min-w-auto mt-4"
    />
    <div class="flex gap-2 mt-2">
     <button class="px-3 py-1 text-xs bg-primary text-white" onclick={() => rollDice(1)}>1</button>
     <button class="px-3 py-1 text-xs bg-primary text-white" onclick={() => rollDice(20)}>20</button>
    </div>
   {/if}
  {/if}
  {/if}
 </div>
{/if}
