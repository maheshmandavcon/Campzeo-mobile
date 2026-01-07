# Sidebar Drawer Implementation

This document explains how the avatar-triggered sidebar drawer works and how to adapt it for future changes.

## Requirements Recap
- The avatar in `TopBar` should toggle a drawer on tab screens.
- Drawer slides in from the right and closes when the backdrop is pressed.
- Sidebar logic lives in `app/common/sideBar.tsx`; top-level layout just renders it once.
- Gluestack UI is available, but the project does **not** include the pre-generated drawer primitives shown in the docs.

## High-Level Approach
1. **State management**: leverage the existing `useSidebarStore` (Zustand) to hold `sidebarOpen`, `openSidebar`, `closeSidebar`.
2. **Trigger wiring**: `TopBar` calls `openSidebar` on avatar press; `Sidebar` listens to `sidebarOpen`.
3. **Custom drawer UI**: replace the missing Gluestack components with a `Modal` plus `Animated.View` combo:
   - Maintain local `visible` state so the modal unmounts only after the close animation finishes.
   - Animate `translateX` from `(drawerWidth + 40)` to `0` to slide in from the right.
   - Animate backdrop opacity for a dimming effect and make the backdrop press call `closeSidebar`.
4. **Responsive width**: compute `drawerWidth` using `Dimensions.get("window").width` and clamp to `320px` to keep it usable on phones/tablets.
5. **Safe areas**: read `useSafeAreaInsets()` to add top/bottom padding so the drawer content isn’t obscured by status bars or home indicators.
6. **Navigation**: when a menu item has a route, call `router.push(item.route as Href)` and then close the drawer.

## File Touchpoints
| File | Purpose |
| --- | --- |
| `app/common/topBar.tsx` | Avatar `onPress` calls `openSidebar`. |
| `store/sidebarStore.ts` | Zustand store that exposes `sidebarOpen`, `openSidebar`, `closeSidebar`. |
| `app/(tabs)/_layout.tsx` | Renders `TopBar`, `BottomBar`, and the shared `Sidebar`. |
| `app/common/sideBar.tsx` | Contains the animated drawer implementation and UI. |

## Sidebar Component Flow
1. Subscribe to store (`sidebarOpen`, `closeSidebar`) and set up animation refs.
2. When `sidebarOpen` flips true:
   - Set `visible` to true so the `Modal` mounts.
   - Run an `Animated.timing` to slide the drawer in and fade in the backdrop.
3. When closing:
   - Trigger animation back to 0.
   - After animation completes, set `visible` to false to unmount and free resources.
4. Layout structure inside the drawer:
   - Avatar + user info (`VStack`).
   - Divider and menu items list (`Pressable` rows).
   - Logout button at the bottom.

## Extending the Drawer
- **Menu items**: update the `MENU_ITEMS` array with additional entries `{ icon, label, route }`.
- **User data**: pass real user info via props or context; currently hardcoded.
- **Styling**: adjust Tailwind/NativeWind classes or the `StyleSheet` values for different themes.
- **Accessibility**: add `accessibilityLabel`s to Pressables if needed.

## Testing Checklist
- Avatar tap opens the drawer with animation.
- Tapping backdrop closes it.
- Selecting a menu item navigates and closes the drawer.
- Works on both small and large screens (check width clamping).

With this setup, the sidebar behavior matches the Gluestack example while staying self-contained and type-safe in the current codebase.

