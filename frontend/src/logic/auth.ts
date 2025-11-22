import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../model/database';
import { Family } from '../model/models';

const AUTH_TOKEN_KEY = '@family_dashboard:auth_token';
const USER_DATA_KEY = '@family_dashboard:user_data';

interface UserData {
  id: string;
  name: string;
  role: string;
  familyId: string;
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
  private kioskTimeoutId: any = null;
  private kioskTimeoutSeconds: number = 120; // Default 2 minutes
  private lastActivityTime: number = Date.now();

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
        
        // Load family settings and start kiosk timer
        await this.loadFamilySettings();
        this.startKioskTimer();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }

  private async loadFamilySettings(): Promise<void> {
    if (!this.user?.familyId) return;

    // Try loading from local database first (offline-first)
    try {
      const family = await database.get<Family>('families').find(this.user.familyId);
      if (family) {
        this.kioskTimeoutSeconds = family.kioskTimeoutSeconds || 120;
        return;
      }
    } catch {
      // Local lookup failed, fall back to API
    }

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/families/${this.user.familyId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const family = await response.json();
        this.kioskTimeoutSeconds = family.kiosk_timeout_seconds || 120;
      }
    } catch (error) {
      console.error('Failed to load family settings:', error);
    }
  }

  private startKioskTimer(): void {
    this.stopKioskTimer();
    if (this.kioskTimeoutSeconds <= 0) return;
    this.lastActivityTime = Date.now();
    this.scheduleKioskTimeout();
  }

  private stopKioskTimer(): void {
    if (this.kioskTimeoutId) {
      clearTimeout(this.kioskTimeoutId);
      this.kioskTimeoutId = null;
    }
  }

  private scheduleKioskTimeout(): void {
    this.stopKioskTimer();
    
    if (this.kioskTimeoutSeconds <= 0) return;

    this.kioskTimeoutId = setTimeout(() => {
      const inactiveTime = (Date.now() - this.lastActivityTime) / 1000;
      
      if (inactiveTime >= this.kioskTimeoutSeconds) {
        console.log('Kiosk timeout - logging out due to inactivity');
        this.logout();
      } else {
        // Re-schedule if activity was detected
        this.scheduleKioskTimeout();
      }
    }, this.kioskTimeoutSeconds * 1000);
  }

  resetKioskTimer(): void {
    this.lastActivityTime = Date.now();
    if (this.token) {
      this.scheduleKioskTimeout();
    }
  }

  setKioskTimeout(seconds: number): void {
    this.kioskTimeoutSeconds = seconds;
    if (this.token) {
      this.startKioskTimer();
    }
  }

  getKioskTimeout(): number {
    return this.kioskTimeoutSeconds;
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
    await this.loadFamilySettings();
    this.startKioskTimer();
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
    await this.loadFamilySettings();
    this.startKioskTimer();
  }

  async logout(): Promise<void> {
    this.stopKioskTimer();
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
