<script>
 import { onMount } from "svelte";
 import { optimize } from "$lib/image";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import { positions } from "$lib/stores/positions.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import Timer from "$components/Timer.svelte";
 import { startTimer, stopTimer } from "$lib/stores/timer.js";
 import * as m from "$lib/paraglide/messages.js";

 async function finishSession() {
  const id = $sessionId;
  if (!id) return;
  try {
   await fetch('/api/session/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id, status: '0-finished' }),
   });
  } catch (e) {
   console.error('Failed to finish session', e);
  }
 }

 const labelMap = {
  telnitz: () => m.location_telnitz(),
  pratzen: () => m.location_pratzen(),
  santon: () => m.location_santon(),
 };

 let revealedRound = $state(0); // 0 = none, 1/2/3 = round revealed
 let loserRound = $state(0); // which round's loser has been dimmed
 let loserRevealed = $state(false);
 let winnerCelebrate = $state(false);
 let showTimer = $state(false);

 let winner = $derived(() => {
  if (!$gameSession) return null;
  let wins1 = 0;
  let wins2 = 0;
  for (let r = 1; r <= 3; r++) {
   const rd = $gameSession[`round_${r}`];
   if (rd?.winner === 1) wins1++;
   else if (rd?.winner === 2) wins2++;
  }
  if (wins1 > wins2) return 1;
  if (wins2 > wins1) return 2;
  return null;
 });

 let loser = $derived(winner() === 1 ? 2 : winner() === 2 ? 1 : null);

 let rounds = $derived(() => {
  if (!$gameSession) return [];
  return [1, 2, 3].map((r) => {
   const rd = $gameSession[`round_${r}`];
   const loc = $positions.find((p) => p.id === r);
   const label = loc?.label ? (labelMap[loc.label]?.() || loc.label) : `Round ${r}`;
   const p1Bust = $gameSession.player_1?.bust;
   const p2Bust = $gameSession.player_2?.bust;
   const unit1 = rd?.unit_1;
   const unit2 = rd?.unit_2;
   return {
    round: r,
    label,
    winner: rd?.winner || null,
    unit1Img: p1Bust && unit1 ? `/img/unit_${p1Bust}_${unit1}.png` : null,
    unit2Img: p2Bust && unit2 ? `/img/unit_${p2Bust}_${unit2}.png` : null,
    unit1Rotate: unit1 === 'cavalry',
    unit2Rotate: unit2 === 'cannon',
   };
  });
 });

 onMount(() => {
  // Reveal rounds one by one: show units, then dim the loser
  const roundDelay = 2500;
  const loserDelay = 1000; // delay after reveal before dimming loser
  for (let i = 1; i <= 3; i++) {
   setTimeout(() => { revealedRound = i; }, (i - 1) * roundDelay);
   setTimeout(() => { loserRound = i; }, (i - 1) * roundDelay + loserDelay);
  }
  // After all 3 rounds revealed + their animations settle
  const afterRounds = 2 * roundDelay + loserDelay + 1200;
  setTimeout(() => { loserRevealed = true; }, afterRounds);
  setTimeout(() => { winnerCelebrate = true; }, afterRounds + 1200);
  setTimeout(() => { showTimer = true; startTimer(30); }, afterRounds + 2400);
 });
</script>

{#if $gameSession}
 <Logo classes="max-w-60 absolute top-10 left-1/2 -translate-x-1/2" />

 <div class="flex flex-col items-center justify-center h-full gap-6 mt-18">
  {#if winner()}
   <!-- Player busts -->
   <div class="flex items-end gap-20">
    <div
     class="transition-[filter] duration-800 ease-in-out {winnerCelebrate && winner() === 1 ? 'winner-celebrate' : ''}"
     style={loserRevealed && loser === 1 ? 'filter: grayscale(1) brightness(0.6)' : ''}
    >
     <PlayerBust player={$gameSession.player_1} />
    </div>
    <div
     class="transition-[filter] duration-800 ease-in-out {winnerCelebrate && winner() === 2 ? 'winner-celebrate' : ''}"
     style={loserRevealed && loser === 2 ? 'filter: grayscale(1) brightness(0.6)' : ''}
    >
     <PlayerBust player={$gameSession.player_2} />
    </div>
   </div>

   <!-- Rounds row -->
   <div class="flex items-start gap-16 mt-6">
    {#each rounds() as rd}
     <div class="flex flex-col items-center gap-4 w-44 transition-opacity duration-800 ease-in-out {revealedRound >= rd.round ? 'opacity-100' : 'opacity-0'}">
      <p class="text-2xl text-center">{rd.label}</p>
      <div class="flex items-end justify-center gap-4">
       {#if rd.unit1Img}
        <div
         class="transition-[filter,opacity] duration-800 ease-in-out {revealedRound >= rd.round ? 'opacity-100' : 'opacity-0'}"
         style={loserRound >= rd.round && rd.winner && rd.winner !== 1 ? 'filter: grayscale(1) brightness(0.6)' : ''}
        >
         <img
          class="h-24 object-contain {rd.unit1Rotate ? 'scale-x-[-1]' : ''}"
          srcset={optimize(rd.unit1Img)}
          alt=""
         />
        </div>
       {/if}
       {#if rd.unit2Img}
        <div
         class="transition-[filter,opacity] duration-800 ease-in-out {revealedRound >= rd.round ? 'opacity-100' : 'opacity-0'}"
         style={loserRound >= rd.round && rd.winner && rd.winner !== 2 ? 'filter: grayscale(1) brightness(0.6)' : ''}
        >
         <img
          class="h-24 object-contain {rd.unit2Rotate ? 'scale-x-[-1]' : ''}"
          srcset={optimize(rd.unit2Img)}
          alt=""
         />
        </div>
       {/if}
      </div>
     </div>
    {/each}
   </div>
  {/if}

  <div class="mt-10 h-16 lg:h-22 flex items-center justify-center transition-opacity duration-700 ease-in-out {showTimer ? 'opacity-100' : 'opacity-0'}">
   <Timer classes="relative" onExpiry={finishSession} />
  </div>
 </div>
{/if}
