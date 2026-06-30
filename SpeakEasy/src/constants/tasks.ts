import { Task } from '../types';

export const DAILY_TASKS: Task[] = [
  {
    id: 'daily-1',
    title: 'PLACEHOLDER',
    description: 'Daily warm-up exercise placeholder. Complete your morning speech routine here.',
    isDaily: true,
  },
  {
    id: 'daily-2',
    title: 'PLACEHOLDER',
    description: 'Daily practice placeholder. A quick check-in to start your day.',
    isDaily: true,
  },
];

export const AREA_TASKS: Record<string, Task[]> = {
  fluency: [
    {
      id: 'fluency-1',
      title: 'PLACEHOLDER',
      description: 'Fluency exercise placeholder. Practice smooth speech patterns.',
      area: 'fluency',
    },
    {
      id: 'fluency-2',
      title: 'PLACEHOLDER',
      description: 'Fluency drill placeholder. Work on pacing and rhythm.',
      area: 'fluency',
    },
  ],
  articulation: [
    {
      id: 'articulation-1',
      title: 'PLACEHOLDER',
      description: 'Articulation exercise placeholder. Focus on clear sound production.',
      area: 'articulation',
    },
    {
      id: 'articulation-2',
      title: 'PLACEHOLDER',
      description: 'Sound practice placeholder. Repeat target phonemes.',
      area: 'articulation',
    },
  ],
  confidence: [
    {
      id: 'confidence-1',
      title: 'PLACEHOLDER',
      description: 'Confidence building placeholder. Practice speaking in social scenarios.',
      area: 'confidence',
    },
    {
      id: 'confidence-2',
      title: 'PLACEHOLDER',
      description: 'Self-expression placeholder. Share your thoughts aloud.',
      area: 'confidence',
    },
  ],
  maintenance: [
    {
      id: 'maintenance-1',
      title: 'PLACEHOLDER',
      description: 'Maintenance review placeholder. Reinforce previously learned skills.',
      area: 'maintenance',
    },
    {
      id: 'maintenance-2',
      title: 'PLACEHOLDER',
      description: 'Progress check placeholder. Review your speech goals.',
      area: 'maintenance',
    },
  ],
};

export const getAllTasks = (): Task[] => [
  ...DAILY_TASKS,
  ...Object.values(AREA_TASKS).flat(),
];

export const getTaskById = (id: string): Task | undefined =>
  getAllTasks().find((t) => t.id === id);
