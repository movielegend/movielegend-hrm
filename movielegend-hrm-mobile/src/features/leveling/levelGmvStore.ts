import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { levelingApi } from '../../api/leveling.api';

export interface LevelGmvConfig {
  levelNumber: number;
  levelName: string;
  currentGmv: number;
  promotionCeilingGmv: number;
  retentionFloorGmv: number;
  gmvUnit: string;
  updatedAt?: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'ML_LEVEL_GMV_CONFIGS_V2';

const INITIAL_GMV_CONFIGS: LevelGmvConfig[] = [
  {
    levelNumber: 1,
    levelName: 'Level 1',
    currentGmv: 0,
    promotionCeilingGmv: 50,
    retentionFloorGmv: 0,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 2,
    levelName: 'Level 2',
    currentGmv: 0,
    promotionCeilingGmv: 150,
    retentionFloorGmv: 30,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 3,
    levelName: 'Level 3',
    currentGmv: 0,
    promotionCeilingGmv: 400,
    retentionFloorGmv: 100,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 4,
    levelName: 'Level 4',
    currentGmv: 0,
    promotionCeilingGmv: 800,
    retentionFloorGmv: 400,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 5,
    levelName: 'Level 5',
    currentGmv: 0,
    promotionCeilingGmv: 1000,
    retentionFloorGmv: 500,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 6,
    levelName: 'Level 6',
    currentGmv: 0,
    promotionCeilingGmv: 1500,
    retentionFloorGmv: 800,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 7,
    levelName: 'Level 7',
    currentGmv: 0,
    promotionCeilingGmv: 3000,
    retentionFloorGmv: 1500,
    gmvUnit: 'Tr VNĐ',
  },
  {
    levelNumber: 8,
    levelName: 'Level 8',
    currentGmv: 0,
    promotionCeilingGmv: 5000,
    retentionFloorGmv: 3000,
    gmvUnit: 'Tr VNĐ',
  },
];

class LevelGmvStore {
  private gmvConfigs: LevelGmvConfig[] = INITIAL_GMV_CONFIGS;
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        this.gmvConfigs = JSON.parse(stored);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(INITIAL_GMV_CONFIGS));
      }
    } catch {
      this.gmvConfigs = INITIAL_GMV_CONFIGS;
    } finally {
      this.initialized = true;
      this.notify();
    }

    // Background fetch from real backend API
    void this.fetchFromApi();
  }

  public async fetchFromApi() {
    try {
      const remoteData = await levelingApi.getGmvConfigs();
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        this.gmvConfigs = remoteData;
        await this.save();
      }
    } catch {
      // offline / fallback to cached data
    }
  }

  private async save() {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(this.gmvConfigs));
    } catch {
      // fallback in-memory
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getGmvConfigs(): LevelGmvConfig[] {
    return this.gmvConfigs;
  }

  public getGmvByLevel(levelNumber: number): LevelGmvConfig {
    const found = this.gmvConfigs.find((c) => c.levelNumber === levelNumber);
    if (found) return found;
    return {
      levelNumber,
      levelName: `Level ${levelNumber}`,
      currentGmv: 0,
      promotionCeilingGmv: 100,
      retentionFloorGmv: 0,
      gmvUnit: 'Tr VNĐ',
    };
  }

  public updateGmv(
    levelNumber: number,
    currentGmv: number,
    promotionCeilingGmv: number,
    retentionFloorGmv: number,
    updatedBy?: string
  ) {
    let exists = false;
    this.gmvConfigs = this.gmvConfigs.map((c) => {
      if (c.levelNumber === levelNumber) {
        exists = true;
        return {
          ...c,
          currentGmv,
          promotionCeilingGmv,
          retentionFloorGmv,
          updatedAt: new Date().toISOString(),
          updatedBy,
        };
      }
      return c;
    });

    if (!exists) {
      this.gmvConfigs.push({
        levelNumber,
        levelName: `Level ${levelNumber}`,
        currentGmv,
        promotionCeilingGmv,
        retentionFloorGmv,
        gmvUnit: 'Tr VNĐ',
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
    }

    void this.save();

    // Sync to backend in real-time
    void levelingApi
      .updateGmv(levelNumber, {
        currentGmv,
        promotionCeilingGmv,
        retentionFloorGmv,
      })
      .catch(() => {
        // queued offline
      });
  }
}

export const levelGmvStore = new LevelGmvStore();

export function useLevelGmv() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = levelGmvStore.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  return {
    gmvConfigs: levelGmvStore.getGmvConfigs(),
    getGmvByLevel: (lvl: number) => levelGmvStore.getGmvByLevel(lvl),
    updateGmv: (
      lvl: number,
      currentGmv: number,
      targetGmv: number,
      floorGmv: number,
      updatedBy?: string
    ) => levelGmvStore.updateGmv(lvl, currentGmv, targetGmv, floorGmv, updatedBy),
  };
}
