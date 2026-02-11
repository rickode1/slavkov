<script>
 import { optimize } from "$lib/image";

 let { player = null } = $props();
</script>

<div class="flex flex-col items-center">
 <img class="lg:w-32 lg:h-auto" srcset={optimize("/img/bust_"+player?.bust+".png")} alt="" /> 
 <p class="text-2xl text-center">{player?.nick}</p>
</div>
