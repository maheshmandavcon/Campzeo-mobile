// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  // Bottom tab icon mappings used in the app
  'chart.bar': 'insert-chart',
  'map': 'map',
  'envelope': 'mail',
  'doc.text': 'description',
  'book': 'book',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  // Accept either an SF Symbol key (mapped in `MAPPING`) or a MaterialIcons name directly.
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  // some callers pass a `weight` prop (SF Symbols weight). Accept and ignore it.
  weight?: string;
}) {
  // Resolve mapping; if the provided name isn't an SF key, assume it's a MaterialIcons name.
  const resolvedName = (MAPPING[name] ?? name) as ComponentProps<typeof MaterialIcons>['name'];

  return <MaterialIcons color={color} size={size} name={resolvedName} style={style} />;
}
