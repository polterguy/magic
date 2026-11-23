import { openaiIsConfigured } from '@shared/api';
import { useEffect, useState } from 'react';

// Whether an OpenAI API key is configured, and the dialog that adds one.
export function useOpenAiConfigured() {
  // Null until we know — the prompt stays hidden while the answer is pending.
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);
  const [configuringOpenai, setConfiguringOpenai] = useState(false);

  useEffect(() => {
    openaiIsConfigured()
      .then(response => setOpenaiConfigured(response.result))
      .catch(() => setOpenaiConfigured(null));
  }, []);

  return { openaiConfigured, setOpenaiConfigured, configuringOpenai, setConfiguringOpenai };
}
