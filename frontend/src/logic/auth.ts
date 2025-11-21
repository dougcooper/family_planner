import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@family_dashboard:auth_token';
const USER_DATA_KEY = '@family_dashboard:user_data';

interface UserData {
  id: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
}

class AuthProvider {
  private token: string | null = null;
  private user: UserData | null = null;
  private listeners: Set<(state: AuthState) => void> = new Set();

  async initialize(): Promise<void> {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    await this.setAuthData(data.token, data.user);
  }

  async register(familyName: string, email: string, password: string, name: string): Promise<void> {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_name: familyName, email, password, name }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    await this.setAuthData(data.token, data.user);
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    this.notifyListeners();
  }

  private async setAuthData(token: string, user: UserData): Promise<void> {
    this.token = token;
    this.user = user;
    
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, token],
      [USER_DATA_KEY, JSON.stringify(user)],
    ]);
    
    this.notifyListeners();
  }

  getState(): AuthState {
    return {
      token: this.token,
      user: this.user,
      isAuthenticated: !!this.token,
    };
  }

  getToken(): string | null {
    return this.token;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

export const authProvider = new AuthProvider();
