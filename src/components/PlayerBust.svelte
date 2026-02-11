<script>
 import { optimize } from "$lib/image";

 let { player = null } = $props();
</script>

<div class="flex flex-col items-center">
 <img class="w-16 lg:w-32 h-auto" srcset={optimize("/img/bust_"+player?.bust+".png")} alt="" /> 
 <p class="text-lg lg:text-2xl text-center">{player?.nick}</p>
</div>
