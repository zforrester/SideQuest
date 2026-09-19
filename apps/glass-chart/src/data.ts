import { SERIES_COLORS } from './theme';

export type Datum = {
  id: string;
  label: string;
  /** Long form shown in the readout card. */
  caption: string;
  /** Revenue in thousands. */
  value: number;
  /** Change against the previous period, as a fraction. */
  delta: number;
  color: string;
};

const LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const CAPTIONS = [
  'April 2026',
  'May 2026',
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
];

const SEED: number[] = [128, 164, 141, 203, 186, 247];

export const MAX_VALUE = 280;

function toSeries(values: number[]): Datum[] {
  return values.map((value, i) => ({
    id: LABELS[i],
    label: LABELS[i],
    caption: CAPTIONS[i],
    value,
    delta: i === 0 ? 0 : (value - values[i - 1]) / values[i - 1],
    color: SERIES_COLORS[i],
  }));
}

export const INITIAL_SERIES = toSeries(SEED);

/** Fresh plausible-looking numbers so the growth animation has something to do. */
export function shuffleSeries(previous: Datum[]): Datum[] {
  let last = 90 + Math.random() * 80;
  const values = previous.map(() => {
    const drift = (Math.random() - 0.38) * 62;
    last = Math.min(MAX_VALUE - 10, Math.max(48, last + drift));
    return Math.round(last);
  });
  return toSeries(values);
}
