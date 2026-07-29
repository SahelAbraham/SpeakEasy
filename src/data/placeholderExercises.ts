import { Exercise } from '../types/exercise';

export const PLACEHOLDER_EXERCISES: Exercise[] = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  return {
    id: `exercise-${number}`,
    title: `Exercise ${number}`,
    body:
      'Placeholder exercise instructions will appear here. Your therapist or the backend will provide tailored speech practice content for this slot.',
  };
});
