import { Platform, type ViewStyle } from 'react-native';

/** Web prefers boxShadow; native keeps classic shadow props. */
export function elevate(
  strength: 'bar' | 'fab' | 'card' = 'card',
): ViewStyle {
  if (Platform.OS === 'web') {
    switch (strength) {
      case 'bar':
        return { boxShadow: '0px -4px 16px rgba(11, 61, 145, 0.08)' };
      case 'fab':
        return { boxShadow: '0px 6px 14px rgba(20, 106, 251, 0.4)' };
      default:
        return { boxShadow: '0px 4px 12px rgba(11, 61, 145, 0.08)' };
    }
  }

  switch (strength) {
    case 'bar':
      return {
        shadowColor: '#0B3D91',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 16,
      };
    case 'fab':
      return {
        shadowColor: '#146AFB',
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
      };
    default:
      return {
        shadowColor: '#0B3D91',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      };
  }
}
