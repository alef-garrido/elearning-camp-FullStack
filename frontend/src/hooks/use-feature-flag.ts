import { useAuth } from './use-auth';
import { featureFlags } from '@/lib/feature-flags';

export const useFeatureFlag = (featureName: string): boolean => {
  const { user } = useAuth();
  if (!user) return false;

  const feature = featureFlags.find(flag => flag.name === featureName);
  if (!feature) return false;

  return feature.enabledFor.includes(user.role);
};
