export function getActivityBadgeColor(type: string | null): {
  bg: string;
  dot: string;
  ring: string;
} {
  const lowerType = type?.toLowerCase() || '';

  switch (lowerType) {
    case 'announcement':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        dot: 'bg-purple-500',
        ring: 'ring-purple-300 dark:ring-purple-700',
      };
    case 'join':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        dot: 'bg-blue-500',
        ring: 'ring-blue-300 dark:ring-blue-700',
      };
    case 'disqualification':
    case 'disqualify':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        dot: 'bg-red-500',
        ring: 'ring-red-300 dark:ring-red-700',
      };
    case 'rejected':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        dot: 'bg-red-400',
        ring: 'ring-red-300 dark:ring-red-700',
      };
    case 'approved':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        dot: 'bg-green-500',
        ring: 'ring-green-300 dark:ring-green-700',
      };
    case 'milestone':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        dot: 'bg-yellow-400',
        ring: 'ring-yellow-300 dark:ring-yellow-700',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        dot: 'bg-yellow-500',
        ring: 'ring-yellow-300 dark:ring-yellow-700',
      };
    case 'submission':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        dot: 'bg-amber-500',
        ring: 'ring-amber-300 dark:ring-amber-700',
      };
    case 'gain':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        dot: 'bg-green-500',
        ring: 'ring-green-300 dark:ring-green-700',
      };
    case 'reinstate':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        dot: 'bg-blue-500',
        ring: 'ring-blue-300 dark:ring-blue-700',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        dot: 'bg-gray-500',
        ring: 'ring-gray-300 dark:ring-gray-700',
      };
  }
}
