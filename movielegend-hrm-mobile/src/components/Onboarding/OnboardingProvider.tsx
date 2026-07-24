import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { OnboardingModal } from './OnboardingModal';
import { ONBOARDING_DATA } from '../../constants/onboardingData';
import { useAuth } from '../../providers/AuthProvider';
import type { DashboardRole } from '../../api/dashboard.api';

interface OnboardingContextType {
  showOnboarding: (role: DashboardRole) => void;
  resetOnboarding: (role: DashboardRole) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<DashboardRole | null>(null);

  // When user changes, we check if they've seen the onboarding for their primary role
  useEffect(() => {
    if (!user) return;
    
    // Determine primary role
    let role: DashboardRole = 'EMPLOYEE';
    if (user.roles?.includes('ADMIN')) role = 'ADMIN';
    else if (user.roles?.includes('LEADER')) role = 'LEADER';

    const checkOnboarding = async () => {
      try {
        const key = `hasSeenOnboarding_${role}_${user.id}`;
        const hasSeen = await SecureStore.getItemAsync(key);
        if (!hasSeen) {
          setCurrentRole(role);
          setVisible(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    void checkOnboarding();
  }, [user]);

  const handleCompleteOrSkip = async () => {
    if (!user || !currentRole) return;
    
    try {
      const key = `hasSeenOnboarding_${currentRole}_${user.id}`;
      await SecureStore.setItemAsync(key, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    } finally {
      setVisible(false);
    }
  };

  const showOnboarding = (role: DashboardRole) => {
    setCurrentRole(role);
    setVisible(true);
  };

  const resetOnboarding = async (role: DashboardRole) => {
    if (!user) return;
    try {
      const key = `hasSeenOnboarding_${role}_${user.id}`;
      await SecureStore.deleteItemAsync(key);
      showOnboarding(role);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  };

  const slides = currentRole ? ONBOARDING_DATA[currentRole] : [];

  return (
    <OnboardingContext.Provider value={{ showOnboarding, resetOnboarding }}>
      {children}
      <OnboardingModal
        visible={visible}
        slides={slides}
        onComplete={handleCompleteOrSkip}
        onSkip={handleCompleteOrSkip}
      />
    </OnboardingContext.Provider>
  );
}
