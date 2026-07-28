import React, { useEffect, useState, createContext, useContext } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { getUserGuideStatus, isGuideUpToDate } from '../storage/user-guide.storage';
import { UserGuideModal } from './UserGuideModal';

interface UserGuideContextType {
  showGuideManual: () => void;
}

const UserGuideContext = createContext<UserGuideContextType | undefined>(undefined);

export function useUserGuide() {
  const context = useContext(UserGuideContext);
  if (!context) {
    throw new Error('useUserGuide must be used within a UserGuideManager');
  }
  return context;
}

export function UserGuideManager({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  
  // We need to keep track of whether we've checked for the current user session
  // to avoid checking continuously if the modal is closed.
  const [hasCheckedForSession, setHasCheckedForSession] = useState(false);

  useEffect(() => {
    // Reset the check when the user logs out
    if (!isAuthenticated || !user) {
      setHasCheckedForSession(false);
      setShowGuide(false);
      return;
    }

    // Check once per logged-in session
    if (isAuthenticated && user && !isLoading && !hasCheckedForSession) {
      const checkGuideStatus = async () => {
        try {
          const status = await getUserGuideStatus(user.id);
          const isUpToDate = isGuideUpToDate(status);
          
          if (!isUpToDate) {
            setShowGuide(true);
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra user guide', error);
        } finally {
          setHasCheckedForSession(true);
        }
      };

      void checkGuideStatus();
    }
  }, [isAuthenticated, user, isLoading, hasCheckedForSession]);

  const handleCloseGuide = () => {
    setShowGuide(false);
  };

  const showGuideManual = () => {
    setShowGuide(true);
  };

  return (
    <UserGuideContext.Provider value={{ showGuideManual }}>
      {children}
      {user && showGuide && (
        <UserGuideModal
          userId={user.id}
          userRoles={user.roles}
          isVisible={showGuide}
          onClose={handleCloseGuide}
        />
      )}
    </UserGuideContext.Provider>
  );
}
