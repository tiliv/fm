export const ACTIONS_ORDER = [
  'Look',
  'Greet',
  'Buy',
  'Sell',
  'Bribe',
  'Fight',
];

export const ACTIONS = Object.fromEntries(ACTIONS_ORDER.map((action) => [
  action.toUpperCase(),
  action,
]));
