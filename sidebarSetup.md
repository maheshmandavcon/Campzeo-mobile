# Sidebar/Drawer Setup Guide

This document provides a comprehensive guide for the Gluestack UI Drawer/Sidebar implementation in the CampZeo user interface.

## Overview

The sidebar drawer is implemented using custom drawer components built on top of React Native's `Modal` and `Animated` APIs, styled to match Gluestack UI patterns. The drawer slides in from the right side of the screen and can be closed by:
- Clicking/tapping outside the drawer (on the backdrop)
- Swiping left to right on the drawer content
- Pressing the back button (Android)

## Key Features

- **Fast & Smooth Animations**: 200ms duration for drawer slide, 150ms for backdrop fade
- **Right-to-Left Opening**: Drawer slides in from the right side
- **Swipe to Close**: Swipe left-to-right gesture to close the drawer
- **Backdrop Click**: Click outside to close
- **Safe Area Support**: Automatically respects device safe areas

## File Structure

```
components/ui/
  └── drawer.tsx          # Drawer component implementation

app/(common)/
  └── sideBar.tsx         # Sidebar component using drawer

store/
  └── sidebarStore.ts     # Zustand store for sidebar state

app/(tabs)/
  └── _layout.tsx         # Layout that renders Sidebar component
```

## Components

### Drawer Component (`components/ui/drawer.tsx`)

The drawer component provides the following exports:

- **`Drawer`**: Main drawer container component
  - Props:
    - `isOpen: boolean` - Controls drawer visibility
    - `onClose: () => void` - Callback when drawer should close
    - `anchor?: 'left' | 'right'` - Side from which drawer slides in (default: 'right')
    - `drawerWidth?: number` - Custom width (default: 80% of screen width, max 320px)
    - `children: ReactNode` - Drawer content

- **`DrawerBackdrop`**: Backdrop component (handled internally)
- **`DrawerContent`**: Container for drawer content
- **`DrawerHeader`**: Header section of the drawer
- **`DrawerBody`**: Main content area of the drawer
- **`DrawerFooter`**: Footer section of the drawer

### Sidebar Component (`app/(common)/sideBar.tsx`)

The sidebar component uses the drawer and integrates with the Zustand store:

```tsx
import { useSidebarStore } from "../../store/sidebarStore";

export default function Sidebar() {
  const sidebarOpen = useSidebarStore((state) => state.sidebarOpen);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);
  
  return (
    <Drawer isOpen={sidebarOpen} onClose={closeSidebar} anchor="right">
      {/* Drawer content */}
    </Drawer>
  );
}
```

## State Management

The sidebar state is managed using Zustand:

```typescript
// store/sidebarStore.ts
export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
```

### Usage

To open the sidebar from anywhere in the app:

```tsx
import { useSidebarStore } from "@/store/sidebarStore";

function MyComponent() {
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  
  return (
    <TouchableOpacity onPress={openSidebar}>
      <Text>Open Sidebar</Text>
    </TouchableOpacity>
  );
}
```

## Integration

### Trigger from TopBar

The sidebar is triggered from the avatar image in `app/(common)/topBar.tsx`:

```tsx
import { useSidebarStore } from "../../store/sidebarStore";

export default function TopBar() {
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  
  return (
    <TouchableOpacity onPress={openSidebar}>
      <Image source={{ uri: "..." }} />
    </TouchableOpacity>
  );
}
```

### Layout Integration

The sidebar is rendered in `app/(tabs)/_layout.tsx`:

```tsx
import Sidebar from "../(common)/sideBar";

export default function TabLayout() {
  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <TopBar />
        <BottomBar />
        <Sidebar />
      </SafeAreaView>
    </>
  );
}
```

## Features

### 1. Right-to-Left Animation
The drawer slides in from the right side of the screen using React Native's `Animated` API with optimized timing animations (200ms duration) for smooth, fast motion.

### 2. Backdrop Click to Close
Clicking or tapping outside the drawer (on the backdrop) closes it automatically. Backdrop clicks are disabled during the opening animation to prevent accidental closes.

### 3. Swipe to Close
Users can swipe left to right on the drawer content to close it. The gesture is handled using `PanResponder`:
- Swipe threshold: 30% of drawer width
- Velocity threshold: 0.5 for quick swipes
- Smooth 200ms animation when snapping back

### 4. Safe Area Support
The drawer automatically respects safe area insets for devices with notches, status bars, and home indicators.

## Dependencies

The implementation requires the following packages (already in `package.json`):

- `@gluestack-ui/themed`: ^1.1.73
- `@gluestack-ui/config`: ^1.1.20
- `react-native`: ^0.81.5
- `react-native-safe-area-context`: ~5.6.0
- `react-native-gesture-handler`: ~2.28.0
- `react-native-reanimated`: ~4.1.1
- `zustand`: ^5.0.8
- `lucide-react-native`: ^0.554.0

## Customization

### Changing Drawer Width

Modify the `drawerWidth` prop in the `Drawer` component:

```tsx
<Drawer
  isOpen={sidebarOpen}
  onClose={closeSidebar}
  anchor="right"
  drawerWidth={300}  // Custom width in pixels
>
```

### Changing Animation Speed

Edit the animation configuration in `components/ui/drawer.tsx`:

```tsx
Animated.timing(translateX, {
  toValue: 0,
  duration: 200,    // Adjust duration (milliseconds) - lower = faster
  useNativeDriver: true,
}).start();
```

**Note**: The current implementation uses `Animated.timing` for smooth, predictable animations. The drawer slide uses 200ms and backdrop fade uses 150ms for optimal performance.

### Adding Menu Items

Edit the menu items in `app/(common)/sideBar.tsx`:

```tsx
<DrawerBody>
  <Pressable style={styles.menuItem} onPress={handleMenuItemPress}>
    <Icon as={YourIcon} size="lg" style={styles.icon} />
    <Text>Menu Item</Text>
  </Pressable>
</DrawerBody>
```

## Troubleshooting

### Drawer Not Opening on First Click
**Issue**: Drawer appears briefly then disappears on the first click.

**Solution**: This has been fixed in the current implementation. The drawer now:
- Uses immediate `Animated.timing` without delays
- Prevents backdrop clicks from closing the drawer immediately after opening
- Properly initializes animation values before starting

### Drawer Not Opening
1. Check that `sidebarOpen` state is being set to `true`
2. Verify the `Sidebar` component is rendered in the layout
3. Check console for any errors
4. Ensure the drawer component is not being unmounted prematurely

### Swipe Gesture Not Working
1. Ensure `react-native-gesture-handler` is properly installed
2. Check that `react-native-reanimated` is configured correctly
3. Verify the pan responder is attached to the drawer view
4. Make sure gesture handler is imported at the root level (in `_layout.tsx`)

### Animation Issues
1. Ensure `useNativeDriver: true` is set (required for smooth animations)
2. Check that `react-native-reanimated` is imported at the root level
3. Verify no conflicting animations are running
4. If animation feels slow, reduce the `duration` value in the `Animated.timing` calls

## Testing Checklist

- [ ] Drawer opens when avatar is clicked (first click works correctly)
- [ ] Drawer slides in from right side smoothly and quickly (200ms animation)
- [ ] Animation is smooth without roughness or jank
- [ ] Backdrop click closes the drawer (after animation completes)
- [ ] Swipe left-to-right closes the drawer
- [ ] Drawer respects safe area insets
- [ ] Menu items are clickable
- [ ] Drawer closes when menu item is clicked
- [ ] State persists correctly across navigation
- [ ] No console warnings related to Animated or Modal
- [ ] Drawer doesn't close immediately after opening

## Performance Optimizations

The implementation includes several performance optimizations:

1. **Native Driver**: All animations use `useNativeDriver: true` for 60fps performance
2. **Fast Animations**: 200ms drawer slide and 150ms backdrop fade for snappy feel
3. **Immediate Start**: No delays or `requestAnimationFrame` - animations start instantly
4. **Memoized Values**: Drawer width and initial translateX values are memoized
5. **Optimized PanResponder**: Memoized to prevent recreation on every render

## Support

For issues or questions:
1. Check the Gluestack UI documentation: https://gluestack.io
2. Review React Native gesture handler docs: https://docs.swmansion.com/react-native-gesture-handler/
3. Check Zustand documentation: https://zustand-demo.pmnd.rs/

