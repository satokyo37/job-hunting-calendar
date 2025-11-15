import { z } from 'zod';

import { PROGRESS_STATUS_VALUES } from '../constants/progressStatus';

const trimmedString = z.string().trim();
const requiredStr = trimmedString.min(1);
const optionalStr = trimmedString
  .transform((value) => (value.length ? value : undefined))
  .optional();

const dateInputSchema = z
  .union([z.iso.datetime(), z.literal(''), z.null()])
  .transform((value) => (value ? (value as string) : undefined));

const progressStatusEnum = z.enum(PROGRESS_STATUS_VALUES);

export const TaskCreateSchema = z.object({
  title: requiredStr.max(100),
  dueDate: dateInputSchema.optional(),
  isDone: z.boolean().default(false),
});

export const TasksCreateSchema = z.array(TaskCreateSchema);

export const TaskSchema = z.object({
  id: z.ulid(),
  title: requiredStr.max(100),
  dueDate: dateInputSchema.optional(),
  isDone: z.boolean(),
});

export const TasksSchema = z.array(TaskSchema);

export const CandidateDateSchema = z.iso.datetime();
export const CandidateDatesSchema = z.array(CandidateDateSchema);

export const CompanyCreateSchema = z.object({
  name: requiredStr.max(100),
  progressStatus: progressStatusEnum,
  tasks: TasksCreateSchema.optional().default([]),
  candidateDates: CandidateDatesSchema.optional().default([]),
  confirmedDate: dateInputSchema.optional(),
  remarks: optionalStr,
  nextAction: optionalStr,
});

export const CompanyPatchSchema = z.object({
  name: requiredStr.max(100).optional(),
  progressStatus: progressStatusEnum.optional(),
  tasks: TasksSchema.optional(),
  candidateDates: CandidateDatesSchema.optional(),
  confirmedDate: dateInputSchema.optional(),
  remarks: optionalStr,
  nextAction: optionalStr,
});

export type CompanyCreateInput = z.input<typeof CompanyCreateSchema>;
export type CompanyPatchInput = z.input<typeof CompanyPatchSchema>;
export type TaskCreateInput = z.input<typeof TaskCreateSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type CandidateDateInput = z.input<typeof CandidateDateSchema>;
