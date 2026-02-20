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

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);

 let rolling = $state(false);
 let rolled = $state(false);
 let rollResult = $state(null);

 function rollDice() {
  if (rolling || rolled) return;
  rolling = true;
  rollResult = null;

  setTimeout(() => {
   rolling = false;
   rolled = true;
   rollResult = Math.floor(Math.random() * 20) + 1;
  }, 2000);
 }
</script>

{#if $gameSession}
 <Help player={myPlayer()} autoOpen={false}>
  <p class="text-xl"></p>
 </Help>

 <div class="flex flex-col items-center gap-6 mt-60">
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
   <Button
    text={m.battle_roll_button()}
    onclick={rollDice}
    disabled={rolling}
    classes="!text-2xl !h-14 min-w-auto mt-4"
   />
  {/if}
 </div>
{/if}
