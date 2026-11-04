import { useEffect, useState } from 'react';

import { setDashboardTourRunner } from '../../../lib/shellActions';

/*
 * The guided tour. Runs itself once per cloudlet — a different backend is a
 * different setup, and worth the tour again. It waits for the async flags
 * to resolve, since the widgets it points at are conditional on them
 * and half of them do not exist yet while those are null. Takes
 * [mustSetPassword] because it defers to the set-password dialog.
 */
export function useDashboardTour(
  backendUrl: string | undefined,
  mustSetPassword: boolean,
  openaiConfigured: boolean | null,
  rootServed: boolean | null,
) {
  const [tour, setTour] = useState<'dashboard' | 'chatbot' | null>(null);
  const tourKey = 'magic2.tourSeen.' + (backendUrl ?? '');
  /*
   * Acting on a widget mid-tour changes the flags below, which would otherwise
   * re-enter this effect and restart the tour under the reader.
   */
  const [tourOffered, setTourOffered] = useState(false);
  if (
    !tourOffered &&
    backendUrl &&
    !mustSetPassword &&
    openaiConfigured !== null &&
    rootServed !== null &&
    localStorage.getItem(tourKey) !== '1'
  ) {
    setTourOffered(true);
    setTour('dashboard');
  }

  // Re-runnable on demand, from the command palette.
  useEffect(() => {
    setDashboardTourRunner(() => setTour('dashboard'));
    return () => setDashboardTourRunner(null);
  }, []);

  function closeTour(completed: boolean) {
    /*
     * Only a tour the reader saw through counts as given. Escaping out
     * of it leaves it to run again on the next visit.
     */
    if (completed) {
      localStorage.setItem(tourKey, '1');
    }
    setTour(null);
  }

  return { tour, setTour, closeTour };
}
