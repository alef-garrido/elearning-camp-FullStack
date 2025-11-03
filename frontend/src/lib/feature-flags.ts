import { Role } from '@/types/api';

type FeatureFlag = {
  name: string;
  enabledFor: Role[];
};

export const featureFlags: FeatureFlag[] = [
  {
    name: 'review-creation',
    enabledFor: ['user', 'admin'],
  },
  {
    name: 'community-creation',
    enabledFor: ['publisher', 'admin'],
  },
  {
    name: 'course-creation',
    enabledFor: ['publisher', 'admin'],
  },
  {
    name: 'user-management',
    enabledFor: ['admin'],
  },
];
