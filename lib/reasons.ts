// Game-end tag labels, shortened for tight columns.
const SHORT_REASONS: Record<string, string> = {
	'Combat damage': 'combat',
	'Commander damage': 'cmdr. dmg',
	'Combo kill': 'combo',
	'Mill / decked out': 'mill',
	'Alternate win condition': 'alt win',
	'Direct damage / burn': 'burn',
	'Poison / infect': 'poison',
	Concession: 'concession',
};

export const shortReason = (label: string) => SHORT_REASONS[label] ?? label.toLowerCase();
