export const terminalStates = ['0-canceled', '0-abandoned', '0-finished'];

export const gameScreens = ['1-lobby', '2-onboarding', '3-deployment', '4-bonuses', '5-minigames', '6-battle'];

export function strokeStyle(bust, size = 5) {
	if (!bust) return '';
	const c = `var(--color-bust-${bust}-dark)`;
	return `filter: drop-shadow(${size}px 0 0 ${c}) drop-shadow(0 ${size}px 0 ${c}) drop-shadow(-${size}px 0 0 ${c}) drop-shadow(0 -${size}px 0 ${c})`;
}
