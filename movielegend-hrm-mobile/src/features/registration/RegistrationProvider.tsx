import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import type { FaceImageInput, FacePose, RegistrationFormValues } from '../../types/registration.types';

const defaultValues: RegistrationFormValues = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  idCardNumber: '',
  dateOfBirth: '',
  gender: undefined,
  requestedDepartmentId: '',
  faceImages: [],
};

interface RegistrationContextValue {
  values: RegistrationFormValues;
  update: (patch: Partial<RegistrationFormValues>) => void;
  setFaceImage: (image: FaceImageInput) => void;
  reset: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export function RegistrationProvider({ children }: PropsWithChildren) {
  const [values, setValues] = useState(defaultValues);

  const contextValue = useMemo<RegistrationContextValue>(
    () => ({
      values,
      update: (patch) => setValues((current) => ({ ...current, ...patch })),
      setFaceImage: (image) =>
        setValues((current) => ({
          ...current,
          faceImages: [...current.faceImages.filter((item) => item.pose !== image.pose), image],
        })),
      reset: () => setValues(defaultValues),
    }),
    [values],
  );

  return <RegistrationContext.Provider value={contextValue}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration must be used inside RegistrationProvider');
  return context;
}

export const facePoseLabels: Record<FacePose, string> = {
  FRONT: 'Nhìn thẳng',
  LEFT: 'Quay nhẹ sang trái',
  RIGHT: 'Quay nhẹ sang phải',
};
