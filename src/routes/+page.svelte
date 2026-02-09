<script>
 import { goto } from "$app/navigation";
 import { browser } from "$app/environment";

 if (browser) {
  const isMobile = window.innerWidth < 1024;
  goto(isMobile ? "/phone" : "/tv", { replaceState: true });
 }
</script>
