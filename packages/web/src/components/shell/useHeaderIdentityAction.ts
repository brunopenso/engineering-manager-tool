import { useEffect, useState } from 'react';

type UseHeaderIdentityActionParams = {
  pathname: string;
  isSessionActive: boolean;
};

export function useHeaderIdentityAction({
  pathname,
  isSessionActive,
}: UseHeaderIdentityActionParams) {
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  useEffect(() => {
    setIsConfirmingLogout(false);
  }, [pathname, isSessionActive]);

  function requestLogoutConfirmation() {
    setIsConfirmingLogout(true);
  }

  function cancelLogoutConfirmation() {
    setIsConfirmingLogout(false);
  }

  return {
    isConfirmingLogout,
    requestLogoutConfirmation,
    cancelLogoutConfirmation,
  };
}
