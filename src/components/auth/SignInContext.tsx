import { createContext, useCallback, useContext, useState } from 'react';
import { SignInModal } from './SignInModal';

interface SignInContextValue {
  promptSignIn: () => void;
}

const SignInContext = createContext<SignInContextValue>(null!);

export function SignInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const promptSignIn = useCallback(() => setOpen(true), []);

  return (
    <SignInContext.Provider value={{ promptSignIn }}>
      {children}
      {open && <SignInModal onClose={() => setOpen(false)} />}
    </SignInContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSignIn() {
  return useContext(SignInContext);
}
