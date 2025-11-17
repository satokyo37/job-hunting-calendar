import type { Task } from '@/store/useAppStore';

export type ScheduleType = 'candidate' | 'confirmed';

export interface CompanySchedule {
  companyId: string;
  companyName: string;
  iso: string;
  scheduleType: ScheduleType;
  title?: string;
}

export interface CompanyTaskItem extends Task {
  companyId: string;
  companyName: string;
}
