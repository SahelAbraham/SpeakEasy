import { LearningArea } from '../types';
import { colors } from '../theme/colors';

export interface LearningAreaConfig {
  id: LearningArea;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const LEARNING_AREAS: LearningAreaConfig[] = [
  {
    id: 'fluency',
    label: 'Fluency',
    description: 'Smooth, natural speech flow',
    color: colors.areas.fluency,
    icon: 'water',
  },
  {
    id: 'articulation',
    label: 'Articulation',
    description: 'Clear pronunciation of sounds',
    color: colors.areas.articulation,
    icon: 'chatbubble-ellipses',
  },
  {
    id: 'confidence',
    label: 'Confidence',
    description: 'Speaking with assurance',
    color: colors.areas.confidence,
    icon: 'star',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Sustaining progress over time',
    color: colors.areas.maintenance,
    icon: 'leaf',
  },
];

export const getAreaConfig = (area: LearningArea) =>
  LEARNING_AREAS.find((a) => a.id === area)!;
