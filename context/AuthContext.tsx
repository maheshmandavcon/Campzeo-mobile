import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "campzeo.auth.token";
const AUTH_USER_KEY = "campzeo.auth.user";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  organisationId?: string;
  username: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string };
  update: (data: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string;
  }) => Promise<void>;
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  setProfileImage: (data: { file: Blob }) => Promise<void>;
};

type StoredAuthUser = Omit<
  AuthUser,
  "update" | "updatePassword" | "setProfileImage"
>;

type LoginUser = {
  id: string | number;
  email: string;
  name?: string | null;
  role?: string;
  organisationId?: string | number | null;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  userId: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  setSession: (token: string, user?: LoginUser | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authListeners = new Set<() => void>();

const emitAuthChanged = () => {
  authListeners.forEach((listener) => listener());
};

export const subscribeToAuthChanges = (listener: () => void) => {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
};

const canUseSecureStore = async () => {
  if (Platform.OS === "web") return false;

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

const setStorageItem = async (key: string, value: string) => {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
};

const getStorageItem = async (key: string) => {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(key);
  }

  return AsyncStorage.getItem(key);
};

const deleteStorageItem = async (key: string) => {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await AsyncStorage.removeItem(key);
};

const makeAvatarUrl = (name: string, email: string) => {
  const label = encodeURIComponent(name || email || "User");
  return `https://ui-avatars.com/api/?name=${label}&background=dc2626&color=fff`;
};

const splitName = (name?: string | null) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const toStoredUser = (user: LoginUser | StoredAuthUser): StoredAuthUser => {
  const email = String(user.email || "");
  const name = String(user.name || email || "User");
  const { firstName, lastName } = splitName(name);
  const username = "username" in user ? user.username : email.split("@")[0];

  return {
    id: String(user.id),
    email,
    name,
    role: user.role,
    organisationId:
      user.organisationId === null || user.organisationId === undefined
        ? undefined
        : String(user.organisationId),
    username: username || email,
    firstName: "firstName" in user ? user.firstName : firstName,
    lastName: "lastName" in user ? user.lastName : lastName,
    imageUrl:
      "imageUrl" in user && user.imageUrl
        ? user.imageUrl
        : makeAvatarUrl(name, email),
    primaryEmailAddress: { emailAddress: email },
  };
};

export const setToken = async (token: string) => {
  await setStorageItem(AUTH_TOKEN_KEY, token);
  emitAuthChanged();
};

export const getToken = async () => {
  const token = await getStorageItem(AUTH_TOKEN_KEY);
  if (token) return token;

  const legacyToken = await AsyncStorage.getItem("token");
  if (legacyToken) {
    await setStorageItem(AUTH_TOKEN_KEY, legacyToken);
    await AsyncStorage.removeItem("token");
  }

  return legacyToken;
};

export const setAuthUser = async (user: LoginUser | StoredAuthUser) => {
  await setStorageItem(AUTH_USER_KEY, JSON.stringify(toStoredUser(user)));
  emitAuthChanged();
};

export const getAuthUser = async () => {
  const raw = await getStorageItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return toStoredUser(JSON.parse(raw));
  } catch {
    await deleteStorageItem(AUTH_USER_KEY);
    return null;
  }
};

export const removeToken = async () => {
  await deleteStorageItem(AUTH_TOKEN_KEY);
  await deleteStorageItem(AUTH_USER_KEY);
  await AsyncStorage.removeItem("token");
  emitAuthChanged();
};

const withUserActions = (
  user: StoredAuthUser,
  updateStoredUser: (user: StoredAuthUser) => Promise<void>,
): AuthUser => ({
  ...user,
  update: async ({ firstName, lastName, username }) => {
    const nextFirstName = firstName ?? user.firstName;
    const nextLastName = lastName ?? user.lastName;
    const nextName = [nextFirstName, nextLastName].filter(Boolean).join(" ");
    const nextUser = toStoredUser({
      ...user,
      firstName: nextFirstName,
      lastName: nextLastName,
      name: nextName || user.name,
      username: username || user.username,
    });

    await updateStoredUser(nextUser);
  },
  updatePassword: async () => {
    throw new Error("Password update is not connected to the new API yet.");
  },
  setProfileImage: async () => {
    throw new Error("Profile image update is not connected to the new API yet.");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const updateStoredUser = useCallback(async (nextUser: StoredAuthUser) => {
    await setStorageItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setUserState(withUserActions(nextUser, updateStoredUser));
    emitAuthChanged();
  }, []);

  const hydrate = useCallback(async () => {
    const [storedToken, storedUser] = await Promise.all([
      getToken(),
      getAuthUser(),
    ]);

    setTokenState(storedToken);
    setUserState(
      storedToken && storedUser
        ? withUserActions(storedUser, updateStoredUser)
        : null,
    );
    setIsLoaded(true);
  }, [updateStoredUser]);

  useEffect(() => {
    hydrate();
    return subscribeToAuthChanges(hydrate);
  }, [hydrate]);

  const setSession = useCallback(
    async (nextToken: string, nextUser?: LoginUser | null) => {
      const storedUser = nextUser ? toStoredUser(nextUser) : null;

      await setStorageItem(AUTH_TOKEN_KEY, nextToken);

      if (storedUser) {
        await setStorageItem(AUTH_USER_KEY, JSON.stringify(storedUser));
      }

      setTokenState(nextToken);
      setUserState(
        storedUser ? withUserActions(storedUser, updateStoredUser) : null,
      );
      setIsLoaded(true);
      emitAuthChanged();
    },
    [updateStoredUser],
  );

  const signOut = useCallback(async () => {
    await removeToken();
    setTokenState(null);
    setUserState(null);
    setIsLoaded(true);
    
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      userId: user?.id ?? null,
      isLoaded,
      isSignedIn: !!token,
      getToken,
      setSession,
      signOut,
    }),
    [isLoaded, setSession, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function useUser() {
  const { user, isLoaded } = useAuth();  
  return { user, isLoaded };
}
