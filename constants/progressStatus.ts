export const PROGRESS_STATUS_VALUES = [
  '興味あり',
  'エントリー済み',
  '書類選考中',
  '面接中',
  '内定',
  '選考終了',
] as const;

export type ProgressStatusValue = (typeof PROGRESS_STATUS_VALUES)[number];

export type ProgressStatusKey =
  | 'interested'
  | 'applied'
  | 'document'
  | 'interview'
  | 'offer'
  | 'closed';

export type ProgressStatusVisual = {
  key: ProgressStatusKey;
  value: ProgressStatusValue;
  description: string;
  icon: string;
  accent: string;
  background: string;
  border: string;
};

export const PROGRESS_STATUS_ITEMS: readonly ProgressStatusVisual[] = [
  {
    key: 'interested',
    value: '興味あり',
    description: 'リサーチ中・気になる企業',
    icon: 'star-border',
    accent: '#7C3AED',
    background: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.24)',
  },
  {
    key: 'applied',
    value: 'エントリー済み',
    description: '応募完了・書類準備中',
    icon: 'how-to-reg',
    accent: '#2563EB',
    background: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.24)',
  },
  {
    key: 'document',
    value: '書類選考中',
    description: '企業で書類審査中',
    icon: 'description',
    accent: '#0284C7',
    background: 'rgba(2, 132, 199, 0.12)',
    border: 'rgba(2, 132, 199, 0.24)',
  },
  {
    key: 'interview',
    value: '面接中',
    description: '面接・面談を調整/実施中',
    icon: 'groups',
    accent: '#0D9488',
    background: 'rgba(13, 148, 136, 0.12)',
    border: 'rgba(13, 148, 136, 0.24)',
  },
  {
    key: 'offer',
    value: '内定',
    description: '内定を獲得',
    icon: 'emoji-events',
    accent: '#D97706',
    background: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.24)',
  },
  {
    key: 'closed',
    value: '選考終了',
    description: '辞退・不合格などでクローズ',
    icon: 'highlight-off',
    accent: '#94A3B8',
    background: 'rgba(148, 163, 184, 0.16)',
    border: 'rgba(148, 163, 184, 0.24)',
  },
] as const;

export const PROGRESS_STATUS_BY_VALUE = PROGRESS_STATUS_ITEMS.reduce(
  (acc, item) => {
    acc[item.value] = item;
    return acc;
  },
  {} as Record<ProgressStatusValue, ProgressStatusVisual>
);

export const ACTIVE_SELECTION_STATUSES: ProgressStatusValue[] = ['書類選考中', '面接中'];

export const isProgressStatusValue = (value: string): value is ProgressStatusValue =>
  (PROGRESS_STATUS_VALUES as readonly string[]).includes(value);
