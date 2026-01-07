import React, { createContext, ReactNode, useContext } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DrawerContextType {
  isOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawerContext = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('Drawer components must be used within Drawer');
  }
  return context;
};

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  anchor?: 'left' | 'right';
  drawerWidth?: number;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  anchor = 'right',
  drawerWidth: customWidth,
}: DrawerProps) {
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = React.useMemo(() => customWidth || Math.min(screenWidth * 0.8, 320), [customWidth, screenWidth]);
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = React.useState(false);
  const [canClose, setCanClose] = React.useState(false);
  
  // Calculate initial translateX value
  const initialTranslateX = React.useMemo(() => {
    return anchor === 'right' ? drawerWidth : -drawerWidth;
  }, [anchor, drawerWidth]);
  
  const translateX = React.useRef(new Animated.Value(initialTranslateX)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen && !visible) {
      // Opening: Set visible first, then animate immediately for smoothness
      setVisible(true);
      setCanClose(false);
      // Reset to starting position
      translateX.setValue(initialTranslateX);
      backdropOpacity.setValue(0);
      
      // Start animation immediately without delay for maximum smoothness
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200, // Fast and smooth
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Allow closing after animation completes
        setCanClose(true);
      });
    } else if (!isOpen && visible) {
      // Closing: Animate out, then hide
      setCanClose(false);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: initialTranslateX,
          duration: 200, // Fast and smooth
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setVisible(false);
          // Reset values after hiding
          translateX.setValue(initialTranslateX);
          backdropOpacity.setValue(0);
        }
      });
    }
  }, [isOpen, visible, initialTranslateX]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // For right anchor, detect left swipe (negative dx)
          if (anchor === 'right') {
            return Math.abs(gestureState.dx) > 10 && gestureState.dx < 0;
          }
          // For left anchor, detect right swipe (positive dx)
          return Math.abs(gestureState.dx) > 10 && gestureState.dx > 0;
        },
        onPanResponderMove: (_, gestureState) => {
          if (anchor === 'right') {
            // Swiping left (negative dx) should move drawer to the right (positive translateX)
            if (gestureState.dx < 0) {
              const newValue = Math.min(drawerWidth, -gestureState.dx);
              translateX.setValue(newValue);
            }
          } else {
            // Swiping right (positive dx) should move drawer to the left (negative translateX)
            if (gestureState.dx > 0) {
              const newValue = Math.max(-drawerWidth, -gestureState.dx);
              translateX.setValue(newValue);
            }
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const threshold = drawerWidth * 0.3;
          if (anchor === 'right') {
            // If swiped left enough or velocity is high, close the drawer
            if (gestureState.dx < -threshold || gestureState.vx < -0.5) {
              onClose();
            } else {
              // Otherwise, snap back to open position
              Animated.timing(translateX, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          } else {
            // If swiped right enough or velocity is high, close the drawer
            if (gestureState.dx > threshold || gestureState.vx > 0.5) {
              onClose();
            } else {
              // Otherwise, snap back to open position
              Animated.timing(translateX, {
                toValue: -drawerWidth,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }
        },
      }),
    [anchor, drawerWidth, translateX, onClose]
  );

  if (!visible) {
    return null;
  }

  return (
    <DrawerContext.Provider value={{ isOpen, onClose, drawerWidth }}>
      <Modal
        transparent
        animationType="none"
        statusBarTranslucent
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.container} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              // Prevent immediate close after opening
              if (canClose) {
                onClose();
              }
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            />
          </Pressable>
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                [anchor]: 0,
                top: insets.top,
                bottom: insets.bottom,
                transform: [{ translateX }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {children}
          </Animated.View>
        </View>
      </Modal>
    </DrawerContext.Provider>
  );
}

export function DrawerBackdrop() {
  return null; // Handled by Drawer component
}

interface DrawerContentProps {
  children: ReactNode;
  className?: string;
}

export function DrawerContent({ children, className }: DrawerContentProps) {
  return (
    <View style={styles.content}>
      {children}
    </View>
  );
}

interface DrawerHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DrawerHeader({ children, className }: DrawerHeaderProps) {
  return <View style={styles.header}>{children}</View>;
}

interface DrawerBodyProps {
  children: ReactNode;
  contentContainerClassName?: string;
}

export function DrawerBody({ children, contentContainerClassName }: DrawerBodyProps) {
  return <View style={styles.body}>{children}</View>;
}

interface DrawerFooterProps {
  children: ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    paddingVertical: 16,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingVertical: 16,
  },
});

