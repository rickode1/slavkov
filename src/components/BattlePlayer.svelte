<script>
 import BattleStatRow from "$components/BattleStatRow.svelte";

 let {
  unitImg = null,
  unitRotate = false,
  stroke = '',
  active = false,
  bust = null,
  dmgBonus = 0,
  defBonus = 0,
  locBonus = 0,
  role = 'dmg',
  flip = false,
 } = $props();
</script>

<div class="flex {flip ? 'flex-row-reverse' : 'flex-row'} items-center gap-6">
 {#if unitImg}
  <img
   class="h-20 lg:h-34 w-auto object-contain transition-all duration-300
    {unitRotate ? 'scale-x-[-1]' : ''}"
   style={stroke}
   src={unitImg}
   alt=""
  />
 {/if}
 <div class="flex flex-col gap-1.5 {flip ? 'items-end' : ''}">
  <BattleStatRow base={10} bonus={dmgBonus + locBonus} active={active && role === 'dmg'} iconSrc="/img/bonus_dmg.webp" type="dmg" {bust} />
  <BattleStatRow base={6} bonus={defBonus + locBonus} active={active && role === 'def'} iconSrc="/img/bonus_def.webp" type="def" {bust} />
 </div>
</div>
