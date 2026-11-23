import { useEffect, useState } from 'react';

/*
 * Arriving through an emailed sign-in link — an invite or a password
 * reset — means the user has no password they know, so the set-password
 * dialog opens by itself. The flag is set by the magic-link screen only,
 * which OIDC and password sign-ins never pass through.
 */
export function useMagicLinkPassword() {
  const [mustSetPassword, setMustSetPassword] = useState(
    () => sessionStorage.getItem('magic2.magic-link-arrival') === '1',
  );
  // The flag is consumed on arrival, so a reload does not ask again.
  useEffect(() => {
    sessionStorage.removeItem('magic2.magic-link-arrival');
  }, []);

  return { mustSetPassword, setMustSetPassword };
}
