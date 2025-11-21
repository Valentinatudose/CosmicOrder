// This file contains placeholder functions for backend interactions.
import { PremiumOffer, User } from '../types';

const USERS_KEY = 'cosmicOrderUsers';
const CURRENT_USER_EMAIL_KEY = 'cosmicOrderCurrentUserEmail';

const getUsers = (): Record<string, User> => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch (e) {
    return {};
  }
};

const saveUsers = (users: Record<string, User>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const apiService = {
  // --- User Management ---
  register: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    console.log(`Registering user: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users = getUsers();
    if (users[email]) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser: User = {
      email,
      password, // Storing plain text password as this is a simulation
      path: null,
      archetype: null,
      visionData: null,
      isPro: false,
      firstUseDate: null,
      lastUpgradePromptDate: null,
    };
    users[email] = newUser;
    saveUsers(users);
    localStorage.setItem(CURRENT_USER_EMAIL_KEY, email);
    console.log("Registration successful.");
    return { success: true, user: newUser };
  },

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    console.log(`Logging in user: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users = getUsers();
    const user = users[email];
    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }
    localStorage.setItem(CURRENT_USER_EMAIL_KEY, email);
    console.log("Login successful.");
    return { success: true, user };
  },

  logout: async (): Promise<{ success: boolean }> => {
    console.log("Logging out user.");
    localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
    return { success: true };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const email = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
    if (!email) return null;
    const users = getUsers();
    return users[email] || null;
  },

  saveUser: async (user: User): Promise<{ success: boolean }> => {
    console.log(`Saving data for user: ${user.email}`);
    const users = getUsers();
    users[user.email] = user;
    saveUsers(users);
    return { success: true };
  },

  // --- Other Services ---
  subscribeToMailingList: async (email: string): Promise<{ success: boolean }> => {
    console.log(`Subscribing ${email} to the mailing list...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Subscription successful.");
    return { success: true };
  },

  processStripePayment: async (amount: number, type: 'one-time' | 'subscription', plan?: 'monthly' | 'yearly'): Promise<{ success: boolean; clientSecret?: string; error?: string }> => {
    console.log(`Simulating payment processing for a ${type} purchase of $${amount} (${plan || 'one-time'})...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Payment intent created successfully (simulated).");
    return { success: true, clientSecret: 'pi_3Jxxxxxxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxxxxxx' };
  },
  
  getSecureDownloadLink: async (productId: string): Promise<string> => {
    console.log(`Fetching secure download link for ${productId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `#${productId}-download-link-from-server`;
  },

  saveJournalEntry: async (date: string, type: 'practice' | 'gratitude', content: string): Promise<{ success: boolean }> => {
    console.log(`Saving journal entry for ${date} (${type}): "${content}"`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Journal entry saved.");
    return { success: true };
  },
};