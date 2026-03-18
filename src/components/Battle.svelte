<script>
 import { untrack } from "svelte";
 import { m } from "$lib/paraglide/messages.js";
 import { fly } from "svelte/transition";
 import { flip } from "svelte/animate";
 import { optimize } from "$lib/image";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import { strokeStyle, nickHtml } from "$lib/constants.js";
 import Card from "$components/Card.svelte";
 import BattlePlayer from "$components/BattlePlayer.svelte";

 let { onHighlightCard = null } = $props();

 let displayedDifficulty = $state(10);
 let activeCard = $state(null);
 let diceRolling = $state(false);
 let revealedRoll = $state(null);
 let rollOutcome = $state(null); // 'success' | 'fail' | null
 let processingTurn = null;

 let diceSide = $state(null); // null = not yet initialized
 let diceArchClass = $state('');

 $effect(() => {
  const player = startingPlayer;
  const session = $gameSession;
  if (!session) return;

  const current = untrack(() => diceSide);
  if (current === null) {
   untrack(() => { diceSide = player; });
   return;
  }
  if (player !== current && !untrack(() => diceArchClass)) {
   const cls = player === 2 ? 'dice-arch-to-right' : 'dice-arch-to-left';
   untrack(() => {
    diceArchClass = cls;
    setTimeout(() => {
     diceSide = player;
     diceArchClass = '';
    }, 1000);
   });
  }
 });

 let messages = $state([]);
 let _msgId = 0;

 export function addMessage(text, img = '') {
  if(img) {
   img = `<img src="/img/bonus_${img}.png"  class="inline-block h-6 w-auto align-middle mr-2 -mt-1">`;
  }

  const prev = untrack(() => messages);
  messages = [{ id: _msgId++, text: img + text }, ...prev];
 }

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let rd = $derived(roundData());

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

 let currentTurnData = $derived(() => {
  const rd = roundData();
  return rd?.turns?.[turnNumber] || null;
 });

 let player1UnitImg = $derived(() => {
  const rd = roundData();
  if (!rd || !$gameSession) return null;
  const bust = $gameSession.player_1?.bust;
  const unit = rd.unit_1;
  return bust && unit ? `/img/unit_${bust}_${unit}.png` : null;
 });

 let player1UnitRotate = $derived(() => {
  const rd = roundData();
  return rd?.unit_1 === 'cavalry';
 });

 let player2UnitImg = $derived(() => {
  const rd = roundData();
  if (!rd || !$gameSession) return null;
  const bust = $gameSession.player_2?.bust;
  const unit = rd.unit_2;
  return bust && unit ? `/img/unit_${bust}_${unit}.png` : null;
 });

 let player2UnitRotate = $derived(() => {
  const rd = roundData();
  return rd?.unit_2 === 'cannon';
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
 let activePlayerNickHtml = $derived(
  nickHtml($gameSession?.[`player_${startingPlayer}`])
 );

 $effect(() => {
  if (turnNumber != null) {
   untrack(() => startTurnSequence());
  }
 });

 $effect(() => {
  const roll = currentRoll();
  const tn = turnNumber;
  if (roll != null && processingTurn !== tn) {
   untrack(() => {
    processingTurn = tn;
    revealRoll(roll);
   });
  }
 });

 async function revealRoll(roll) {
  diceRolling = true;
  await sleep(2000);
  diceRolling = false;
  revealedRoll = roll;
  await sleep(1000);
  rollOutcome = roll >= displayedDifficulty ? 'success' : 'fail';
  const name = activePlayerNickHtml;
  const boldRoll = `<img src="/img/dice.png"  class="inline-block h-6 w-auto align-middle mr-2 -mt-1">${roll}`;
  addMessage(
   rollOutcome === 'success'
    ? (role === 'dmg' ? m.battle_attack_success({ name, roll: boldRoll }) : m.battle_defense_success({ name, roll: boldRoll }))
    : (role === 'dmg' ? m.battle_attack_failure({ name, roll: boldRoll }) : m.battle_defense_failure({ name, roll: boldRoll }))
  );

  const turnData = currentTurnData();
  if (turnData?.unit_retry) {
   await sleep(1500);
   addMessage(m.battle_unit_retry({ name }));
   untrack(() => onHighlightCard?.('unit'));
   activeCard = { type: 'unit', value: roundData()?.[`bonus_unit_${startingPlayer}`] || 1 };
   await sleep(2000);
   activeCard = null;
   await sleep(500);
  } else if (rollOutcome === 'fail' && turnData?.life_retry) {
   await sleep(1500);
   addMessage(m.battle_life_retry({ name }));
   untrack(() => onHighlightCard?.('life'));
   activeCard = { type: 'life', value: 1 };
   await sleep(2000);
   activeCard = null;
   await sleep(500);
  } else {
   await sleep(2000);
  }

  await advanceBattle();
 }

 async function advanceBattle() {
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
    diceRolling = false;
    revealedRoll = null;
    rollOutcome = null;
    activeCard = null;
    processingTurn = null;
   } else {
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

  const prevTurn = rd.turns?.[turnNumber - 1];
  if (rd.current_turn?.unit_counter) {
   // defender succeeded and original attacker gets a counter-attack via unit bonus
   const name = activePlayerNickHtml;
   addMessage(m.battle_unit_retry({ name }));
   untrack(() => onHighlightCard?.('unit'));
  } else if (prevTurn?.unit_retry && prevTurn?.player === startingPlayer) {
   untrack(() => onHighlightCard?.('unit'));
  }
  if (prevTurn?.life_retry && prevTurn?.player === startingPlayer) {
   untrack(() => onHighlightCard?.('life'));
  }

  const locVal = rd[`bonus_loc${suffix}`] ?? 0;
  const bonusVal = rd[`bonuses_${role}${suffix}`] || 0;
  const minigameVal = rd[`bonus_minigame_${role}${suffix}`] || 0;

  if (locVal !== 0) untrack(() => onHighlightCard?.('loc'));
  if (bonusVal > 0) untrack(() => onHighlightCard?.(role));
  if (minigameVal > 0) untrack(() => onHighlightCard?.(`minigame_${role}`));

  displayedDifficulty = baseDifficulty - locVal - bonusVal - minigameVal;

  const name = activePlayerNickHtml;
  addMessage(
   role === 'dmg'
    ? m.battle_attack_roll({ name, num: `<img src="/img/dice.png"  class="inline-block h-6 w-auto align-middle mr-2 -mt-1">${displayedDifficulty}` })
    : m.battle_defense_roll({ name, num: `<img src="/img/dice.png"  class="inline-block h-6 w-auto align-middle mr-2 -mt-1">${displayedDifficulty}` })
  );
 }
</script>

<div class="flex flex-col lg:items-center w-full h-full relative mt-12">
  <img
   class="absolute inset-0 w-full h-full z-10 pointer-events-none"
   srcset={optimize("/img/map_frame.png")}
   alt=""
  />

  <!-- Content layer -->
  <div class="relative z-20 w-full h-full flex flex-col px-10 py-8">

   <!-- Top row: unit + stats for each player -->
   <div class="flex justify-between items-start">
    <BattlePlayer
     unitImg={player1UnitImg()}
     unitRotate={player1UnitRotate()}
     stroke={player1Stroke}
     active={startingPlayer === 1}
     bust={$gameSession?.player_1?.bust}
     dmgBonus={(rd?.bonuses_dmg_1 || 0) + (rd?.bonus_minigame_dmg_1 || 0)}
     defBonus={(rd?.bonuses_def_1 || 0) + (rd?.bonus_minigame_def_1 || 0)}
     locBonus={rd?.bonus_loc_1 || 0}
     {role}
    />
    <BattlePlayer
     unitImg={player2UnitImg()}
     unitRotate={player2UnitRotate()}
     stroke={player2Stroke}
     active={startingPlayer === 2}
     bust={$gameSession?.player_2?.bust}
     dmgBonus={(rd?.bonuses_dmg_2 || 0) + (rd?.bonus_minigame_dmg_2 || 0)}
     defBonus={(rd?.bonuses_def_2 || 0) + (rd?.bonus_minigame_def_2 || 0)}
     locBonus={rd?.bonus_loc_2 || 0}
     {role}
     flip
    />
   </div>
   

   <div class="absolute -translate-x-1/2 -translate-y-1/2 {!diceRolling && !diceArchClass ? 'dice-float' : ''} {diceArchClass}"
      style={diceArchClass ? '' : `left: ${diceSide === 2 ? '80%' : '20%'}; top: 55%;`}>
      <div class="relative flex items-center justify-center">
       <img
        class="h-48 object-contain transition-[filter] duration-700 {diceRolling ? 'dice-rolling' : ''}"
        style={rollOutcome === 'success' ? 'filter: drop-shadow(0 0 18px gold) drop-shadow(0 0 36px goldenrod)' : rollOutcome === 'fail' ? 'filter: drop-shadow(0 0 18px #111) drop-shadow(0 0 36px #000)' : 'filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4))'}
        srcset={optimize("/img/dice.png")}
        alt="Dice"
       />
       {#if revealedRoll}
        <div class="roll-result absolute inset-0 flex items-center justify-center text-black/90">
         <span class="text-4xl mb-5.5 lining-nums">{revealedRoll}</span>
        </div>
       {/if}
      </div>
      <div class="dice-shadow {diceRolling ? 'hidden!' : ''}"></div>
   </div>

   <div class="mx-auto max-w-3xl w-full text-center mt-14">
    {#key messages[0]?.id ?? -1}
     {#if messages[0]}
      <p class="text-4xl" in:fly={{ y: -24, duration: 500 }} out:fly={{ y: 40, duration: 350 }}>
       {@html messages[0].text}
      </p>
     {/if}
    {/key}

    <div class="mt-6 pt-1 flex flex-col gap-y-3 text-xl max-h-100 overflow-hidden relative">
     {#each messages.slice(1) as msg (msg.id)}
      <p animate:flip={{ duration: 400 }} in:fly={{ y: -16, duration: 350 }}>{@html msg.text}</p>
     {/each}
    </div>
   </div>
  </div>
</div>
