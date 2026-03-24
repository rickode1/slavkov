<script>
 import { untrack } from "svelte";
 import { m } from "$lib/paraglide/messages.js";
 import { fly } from "svelte/transition";
 import { flip } from "svelte/animate";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import { strokeStyle, nickHtml } from "$lib/constants.js";
 import Card from "$components/Card.svelte";
 import BattlePlayer from "$components/BattlePlayer.svelte";
 import BattleExchangeRow from "$components/BattleExchangeRow.svelte"; 

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

 let exchanges = $state([]);
 let _exchId = 0;

 let roundData = $derived.by(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let rd = $derived(roundData);

 let startingPlayer = $derived(roundData?.current_turn?.player || 1);
 let defenderNum = $derived(startingPlayer === 1 ? 2 : 1);
 let role = $derived(roundData?.current_turn?.role || 'dmg');
 let baseDifficulty = $derived(role === 'def' ? 14 : 10);
 let turnNumber = $derived(roundData?.current_turn?.number ?? 0);

 let currentRoll = $derived.by(() => {
  const roll = roundData?.turns?.[turnNumber]?.roll;
  return roll ?? null;
 });

 let currentTurnData = $derived.by(() => {
  return roundData?.turns?.[turnNumber] || null;
 });

 let player1UnitImg = $derived.by(() => {
  if (!roundData || !$gameSession) return null;
  const bust = $gameSession.player_1?.bust;
  const unit = roundData.unit_1;
  return bust && unit ? `/img/unit_${bust}_${unit}.webp` : null;
 });

 let player1UnitRotate = $derived.by(() => {
  return roundData?.unit_1 === 'cavalry';
 });

 let player2UnitImg = $derived.by(() => {
  if (!roundData || !$gameSession) return null;
  const bust = $gameSession.player_2?.bust;
  const unit = roundData.unit_2;
  return bust && unit ? `/img/unit_${bust}_${unit}.webp` : null;
 });

 let player2UnitRotate = $derived.by(() => {
  return roundData?.unit_2 === 'cannon';
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
  const roll = currentRoll;
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
  if (exchanges.length > 0) {
   const ex = exchanges[0];
   exchanges[0] = ex.activeRole === 'dmg' ? { ...ex, dmgRoll: roll } : { ...ex, defRoll: roll };
  }
  await sleep(1000);
  rollOutcome = roll >= displayedDifficulty ? 'success' : 'fail';
  if (exchanges.length > 0) {
   const ex = exchanges[0];
   exchanges[0] = ex.activeRole === 'dmg'
    ? { ...ex, dmgRoll: roll, dmgOutcome: rollOutcome }
    : { ...ex, defRoll: roll, defOutcome: rollOutcome };
  }

  const name = activePlayerNickHtml;
  const turnData = currentTurnData;
  if (turnData?.unit_retry) {
   await sleep(1500);
   if (exchanges.length > 0) exchanges[0] = { ...exchanges[0], bonusText: m.battle_unit_retry({ name }) };
   untrack(() => onHighlightCard?.('unit'));
   activeCard = { type: 'unit', value: roundData?.[`bonus_unit_${startingPlayer}`] || 1 };
   await sleep(2000);
   activeCard = null;
   await sleep(500);
  } else if (rollOutcome === 'fail' && turnData?.life_retry) {
   await sleep(1500);
   if (exchanges.length > 0) exchanges[0] = { ...exchanges[0], bonusText: m.battle_life_retry({ name }) };
   untrack(() => onHighlightCard?.('life'));
   activeCard = { type: 'life', value: 1 };
   await sleep(2000);
   activeCard = null;
   await sleep(500);
  } else {
   await sleep(2000);
   // set final result text
   if (exchanges.length > 0) {
    const ex = exchanges[0];
    let resultText = null;
    if (ex.activeRole === 'def') {
     resultText = rollOutcome === 'success' ? m.battle_exchange_repelled() : m.battle_exchange_success();
    } else if (ex.activeRole === 'dmg' && rollOutcome === 'fail') {
     resultText = m.battle_exchange_failed();
    }
    if (resultText && !ex.bonusText) exchanges[0] = { ...exchanges[0], bonusText: resultText };
   }
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
  const rd = roundData;
  if (!rd) return;
  if (currentRoll) return;

  displayedDifficulty = baseDifficulty;

  const suffix = `_${startingPlayer}`;

  const prevTurn = rd.turns?.[turnNumber - 1];
  if (rd.current_turn?.unit_counter) {
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

  if (role === 'dmg') {
   const prev = untrack(() => exchanges);
   exchanges = [{
    id: _exchId++,
    attackerNum: startingPlayer,
    activeRole: 'dmg',
    dmgDifficulty: displayedDifficulty,
    dmgRoll: null,
    dmgOutcome: null,
    defDifficulty: null,
    defRoll: null,
    defOutcome: null,
    bonusText: null,
   }, ...prev];
  } else {
   // def turn — update the current row in place (same id, no re-animate)
   if (exchanges.length > 0) {
    exchanges[0] = { ...exchanges[0], activeRole: 'def', defDifficulty: displayedDifficulty };
   }
  }
 }
</script>

<svelte:head>
  <link rel="preload" href="/img/map_frame.webp" as="image" />
  <link rel="preload" href="/img/dice.webp" as="image" />
</svelte:head>

<div class="flex flex-col lg:items-center w-full h-full relative mt-12">
  <img
   class="absolute inset-0 w-full h-full z-10 pointer-events-none"
   src="/img/map_frame.webp"
   alt=""
  />

  <!-- Content layer -->
  <div class="relative z-20 w-full h-full flex flex-col px-10 py-8">

   <!-- Top row: unit + stats for each player -->
   <div class="flex justify-between items-start">
    <BattlePlayer
     unitImg={player1UnitImg}
     unitRotate={player1UnitRotate}
     stroke={player1Stroke}
     active={startingPlayer === 1}
     bust={$gameSession?.player_1?.bust}
     dmgBonus={(rd?.bonuses_dmg_1 || 0) + (rd?.bonus_minigame_dmg_1 || 0)}
     defBonus={(rd?.bonuses_def_1 || 0) + (rd?.bonus_minigame_def_1 || 0)}
     locBonus={rd?.bonus_loc_1 || 0}
     {role}
    />
    <BattlePlayer
     unitImg={player2UnitImg}
     unitRotate={player2UnitRotate}
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
   

   <div class="h-48 w-48 absolute z-50 {!diceRolling && !diceArchClass ? 'dice-float' : ''} {diceArchClass}"
      style={diceArchClass ? '' : `left: ${diceSide === 2 ? 'calc(100% - 240px)' : '40px'}; top: 50%;`}>
      <div class="relative flex items-center justify-center">
       <img
        class="h-48 w-48 object-contain transition-[filter] duration-700 {diceRolling ? 'dice-rolling' : ''}"
        style={rollOutcome === 'success' ? 'filter: drop-shadow(0 0 18px gold) drop-shadow(0 0 36px goldenrod)' : rollOutcome === 'fail' ? 'filter: drop-shadow(0 0 18px #111) drop-shadow(0 0 36px #000)' : 'filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4))'}
        src="/img/dice.webp"
        alt="Dice"
       />
       <div class="dice-shadow absolute {diceRolling ? 'hidden!' : ''}" style="left: calc(50% - 1.5rem); bottom: -1rem;"></div>
       {#if revealedRoll}
        <div class="roll-result absolute inset-0 flex items-center justify-center text-black/90">
         <span class="text-4xl mb-5.5 lining-nums">{revealedRoll}</span>
        </div>
       {/if}
      </div>
   </div>

   <div class="mx-auto max-w-xl w-full mt-14">
    {#key exchanges[0]?.id ?? -1}
     {#if exchanges[0]}
      <div in:fly={{ y: -24, duration: 500 }} out:fly={{ y: 40, duration: 350 }}>
       <BattleExchangeRow
        attackerNum={exchanges[0].attackerNum}
        activeRole={exchanges[0].activeRole}
        player1={$gameSession?.player_1}
        player2={$gameSession?.player_2}
        unit1Img={player1UnitImg}
        unit2Img={player2UnitImg}
        dmgDifficulty={exchanges[0].dmgDifficulty}
        dmgRoll={exchanges[0].dmgRoll}
        dmgOutcome={exchanges[0].dmgOutcome}
        defDifficulty={exchanges[0].defDifficulty}
        defRoll={exchanges[0].defRoll}
        defOutcome={exchanges[0].defOutcome}
        bonusText={exchanges[0].bonusText}
       />
      </div>
     {/if}
    {/key}

    <div class="flex flex-col gap-y-1.5 max-h-72 overflow-hidden mt-4">
     {#each exchanges.slice(1) as ex (ex.id)}
      <div animate:flip={{ duration: 400 }} in:fly={{ y: -16, duration: 350 }} class="scale-[0.9] origin-top opacity-90">
       <BattleExchangeRow
        attackerNum={ex.attackerNum}
        activeRole={ex.activeRole}
        player1={$gameSession?.player_1}
        player2={$gameSession?.player_2}
        unit1Img={player1UnitImg}
        unit2Img={player2UnitImg}
        dmgDifficulty={ex.dmgDifficulty}
        dmgRoll={ex.dmgRoll}
        dmgOutcome={ex.dmgOutcome}
        defDifficulty={ex.defDifficulty}
        defRoll={ex.defRoll}
        defOutcome={ex.defOutcome}
        bonusText={ex.bonusText}
       />
      </div>
     {/each}
    </div>
   </div>
  </div>
</div>
