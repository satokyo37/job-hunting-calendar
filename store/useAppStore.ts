﻿import AsyncStorage from '@react-native-async-storage/async-storage';
import { ulid } from 'ulid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CandidateDateSchema,
  CompanyCreateInput,
  CompanyCreateSchema,
  CompanyPatchInput,
  CompanyPatchSchema,
  TaskCreateInput,
  TaskInput,
} from '../schema/company';

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  isDone: boolean;
}

export interface Company {
  id: string;
  name: string;
  progressStatus: string;
  tasks: Task[];
  candidateDates: string[];
  confirmedDate?: string;
  remarks?: string;
}

type State = {
  companies: Company[];
};

type Actions = {
  createCompany: (raw: CompanyCreateInput) => string;
  updateCompany: (id: string, patch: CompanyPatchInput) => void;
  addCandidateDate: (id: string, dateISO: string) => void;
  removeCandidateDate: (id: string, dateISO: string) => void;
  confirmCandidateDate: (id: string, dateISO: string) => void;
};

type Store = State & Actions;

const normalizeCandidateDates = (dates: string[]): string[] => {
  const unique = Array.from(new Set(dates));
  return unique.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

const mapTasksFromCreate = (tasks: TaskCreateInput[] = []): Task[] =>
  tasks.map((task) => ({
    id: ulid(),
    title: task.title.trim(),
    dueDate: task.dueDate ? task.dueDate : undefined,
    isDone: task.isDone ?? false,
  }));

const mapTasksFromPersisted = (tasks: TaskInput[]): Task[] =>
  tasks.map((task) => ({
    id: task.id,
    title: task.title.trim(),
    dueDate: task.dueDate ? task.dueDate : undefined,
    isDone: task.isDone,
  }));

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      companies: [],

      createCompany: (raw: CompanyCreateInput) => {
        const data = CompanyCreateSchema.parse(raw);
        const id = ulid();
        const newCompany: Company = {
          id,
          name: data.name.trim(),
          progressStatus: data.progressStatus.trim(),
          tasks: mapTasksFromCreate(data.tasks),
          candidateDates: normalizeCandidateDates(data.candidateDates ?? []),
          confirmedDate: data.confirmedDate ?? undefined,
          remarks: data.remarks?.trim() || undefined,
        };

        set((state) => ({ companies: [newCompany, ...state.companies] }));
        return id;
      },

      updateCompany: (id: string, patch: CompanyPatchInput) => {
        const includesCandidateDates = Object.prototype.hasOwnProperty.call(
          patch,
          'candidateDates'
        );
        const includesConfirmedDate = Object.prototype.hasOwnProperty.call(
          patch,
          'confirmedDate'
        );
        const includesRemarks = Object.prototype.hasOwnProperty.call(patch, 'remarks');

        const data = CompanyPatchSchema.parse(patch);

        set((state) => {
          const index = state.companies.findIndex((company) => company.id === id);
          if (index === -1) {
            throw new Error('Company not found: ' + id);
          }

          const current = state.companies[index];
          const updated: Company = {
            ...current,
            ...data,
            tasks: data.tasks ? mapTasksFromPersisted(data.tasks) : current.tasks,
            candidateDates: includesCandidateDates
              ? normalizeCandidateDates(data.candidateDates ?? [])
              : current.candidateDates,
            confirmedDate: includesConfirmedDate
              ? data.confirmedDate ?? undefined
              : current.confirmedDate,
            remarks: includesRemarks ? data.remarks ?? undefined : current.remarks,
          };

          const companies = state.companies.slice();
          companies[index] = updated;
          return { companies };
        });
      },

      addCandidateDate: (id: string, dateISO: string) => {
        const date = CandidateDateSchema.parse(dateISO);

        set((state) => {
          const index = state.companies.findIndex((company) => company.id === id);
          if (index === -1) {
            throw new Error('Company not found: ' + id);
          }

          const company = state.companies[index];
          const candidateDates = normalizeCandidateDates([...company.candidateDates, date]);

          const companies = state.companies.slice();
          companies[index] = { ...company, candidateDates };
          return { companies };
        });
      },

      removeCandidateDate: (id: string, dateISO: string) => {
        set((state) => {
          const index = state.companies.findIndex((company) => company.id === id);
          if (index === -1) {
            throw new Error('Company not found: ' + id);
          }

          const company = state.companies[index];
          const candidateDates = company.candidateDates.filter((candidate) => candidate !== dateISO);

          const companies = state.companies.slice();
          companies[index] = { ...company, candidateDates };
          return { companies };
        });
      },

      confirmCandidateDate: (id: string, dateISO: string) => {
        const date = CandidateDateSchema.parse(dateISO);

        set((state) => {
          const index = state.companies.findIndex((company) => company.id === id);
          if (index === -1) {
            throw new Error('Company not found: ' + id);
          }

          const company = state.companies[index];
          const companies = state.companies.slice();
          companies[index] = {
            ...company,
            candidateDates: [],
            confirmedDate: date,
          };
          return { companies };
        });
      },
    }),
    {
      name: 'job-hunting-calendar',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ companies: state.companies }),
    }
  )
);

