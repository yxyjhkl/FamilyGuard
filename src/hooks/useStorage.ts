// src/hooks/useStorage.ts
import {useEffect, useState} from 'react';
import {storageService} from '../store/storageService';

export function useStorage<T>(key: 'families' | 'settings', defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      let raw: string | null = null;
      if (key === 'families') {
        raw = await storageService.getFamilies();
      } else {
        raw = await storageService.getSettings();
      }
      if (raw) {
        try {
          setData(JSON.parse(raw));
        } catch {
          setData(defaultValue);
        }
      }
      setLoaded(true);
    })();
  }, [key]);

  const save = async (newData: T) => {
    setData(newData);
    const json = JSON.stringify(newData);
    if (key === 'families') {
      await storageService.saveFamilies(json);
    } else {
      await storageService.saveSettings(json);
    }
  };

  return {data, loaded, save};
}
