<script>
 import { m } from "$lib/paraglide/messages.js";
 import { onMount } from "svelte";
 import { notify } from '$lib/stores/notification.js';
 import { nickHtml } from '$lib/constants.js';
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";
 import MinigameDmg from "$components/MinigameDmg.svelte";
 import MinigameDef from "$components/MinigameDef.svelte";
 import { playSound, preloadSound } from "$lib/audio.js";

 let mapRef = $state(null);

 // phase: 'idle' | 'dmg' | 'def' | 'done'
 let phase = $state('idle');

 // Which card types to animate per player when returning to idle.
 // Initially: the bonus cards revealed for the first time on this page.
 let animatedCards = $state({ code_1: ['def', 'dmg', 'life'], code_2: ['def', 'dmg', 'life'] });

 const dmgImg = `<img src="/img/bonus_minigame_dmg.webp" class="inline-block h-10 w-auto align-middle mr-2 -mt-1">`;
 const defImg = `<img src="/img/bonus_minigame_def.webp" class="inline-block h-10 w-auto align-middle mr-2 -mt-1">`;

 const NOTIF_DURATION = 14000;
 const NOTIF_GAP = 600;

 function getAttackerCode(rd) {
  return rd?.current_turn?.player === 2 ? 'code_2' : 'code_1';
 }

 let attackerCode = $derived.by(() => {
  const round = $gameSession?.current_round || 1;
  return getAttackerCode($gameSession?.[`round_${round}`]);
 });

 let defenderCode = $derived(attackerCode === 'code_1' ? 'code_2' : 'code_1');

 let attacker = $derived(
  attackerCode === 'code_1' ? $gameSession?.player_1 : $gameSession?.player_2
 );
 let defender = $derived(
  defenderCode === 'code_1' ? $gameSession?.player_1 : $gameSession?.player_2
 );

 onMount(() => {
  preloadSound('/sounds/ding.mp3');
  playSound('/sounds/ding.mp3');

  function init() {
   const session = $gameSession;
   if (!session) {
    setTimeout(init, 500);
    return;
   }

   const round = session?.current_round || 1;
   const rd = session?.[`round_${round}`] || {};

   const attCode = getAttackerCode(rd);
   const attPlayer = attCode === 'code_1' ? session.player_1 : session.player_2;
   const defPlayer = attCode === 'code_1' ? session.player_2 : session.player_1;
   const attName = nickHtml(attPlayer);
   const defName = nickHtml(defPlayer);

   const hasInitiative = !!rd?.current_turn;

   let delay = 2000;

   if (hasInitiative) {
    const initiativeMsg = round === 1 ? m.minigame_initiative({ name: attName }) : m.minigame_initiative2({ name: attName });
    setTimeout(() => notify(initiativeMsg, NOTIF_DURATION, false, () => { phase = 'dmg'; }), delay);
   } else {
    setTimeout(() => { phase = 'dmg'; }, delay);
   }
  }

  init();
 });

 async function saveBonus(playerCode, type, value) {
  const id = $sessionId;
  if (!id) return;
  await fetch('/api/session/minigame', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: id, playerCode, type, value }),
  });
 }

 async function handleDmgResult(success) {
  const attName = nickHtml(attacker);
  const attCode = attackerCode;
  const defCode = defenderCode;
  await saveBonus(attCode, 'dmg', success ? 1 : 0);
  // Only animate the minigame_dmg card for the attacker; nothing new for the defender.
  animatedCards = { [attCode]: ['minigame_dmg'], [defCode]: false };
  phase = 'idle';
  const defName = nickHtml(defender);
  notify(
   dmgImg + (success ? m.minigame_dmg_success({ name: attName }) : m.minigame_dmg_fail({ name: attName }))
   + '<br><br>' + m.minigame_def_cta({ name: defName }),
   NOTIF_DURATION,
   false,
   () => { phase = 'def'; }
  );
 }

 async function handleDefResult(success) {
  const defName = nickHtml(defender);
  const attCode = attackerCode;
  const defCode = defenderCode;
  await saveBonus(defCode, 'def', success ? 1 : 0);
  // Only animate the minigame_def card for the defender; nothing new for the attacker.
  animatedCards = { [attCode]: false, [defCode]: ['minigame_def'] };
  phase = 'idle';
  const id = $sessionId;
  notify(
   defImg + (success ? m.minigame_def_success({ name: defName }) : m.minigame_def_fail({ name: defName })),
   4000,
   false,
   () => {
    if (id) {
     fetch('/api/session/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, status: '6-battle' }),
     });
    }
   }
  );
 }
</script>

{#if $gameSession}
 {#if phase === 'idle'}
  <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between z-10">
   <div class="flex flex-col items-center">
    <PlayerBust player={$gameSession.player_1} />
    <CardBonuses playerCode="code_1" animated={animatedCards.code_1} />
   </div>

   <div class="flex flex-col items-center">
    <PlayerBust player={$gameSession.player_2} />
    <CardBonuses playerCode="code_2" animated={animatedCards.code_2} />
   </div>
  </div>
  <Map
   bind:this={mapRef}
   classes="w-[calc(100%-35rem)] mt-10"
  />
 {:else if phase === 'dmg'}
  <main class="max-w-440 relative w-full px-10 h-[1080px] mx-auto flex flex-col items-center justify-center">
   <MinigameDmg onResult={handleDmgResult} />
  </main>
 {:else if phase === 'def'}
  <main class="max-w-440 relative w-full px-10 h-[1080px] mx-auto flex flex-col items-center justify-center">
   <MinigameDef onResult={handleDefResult} />
  </main>
 {/if}
{/if}

