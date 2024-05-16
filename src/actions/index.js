export * as Buy from './Buy';
export * as Sell from './Sell';
export * as Save from './Save';
export * as Load from './Load';

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
