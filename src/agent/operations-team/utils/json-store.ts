import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../data");

export type StoreName =
  | "employees"
  | "expenses"
  | "travel-bookings"
  | "meetings"
  | "projects"
  | "tasks"
  | "timesheets"
  | "policies";

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(storeName: StoreName): string {
  return join(DATA_DIR, `${storeName}.json`);
}

export const jsonStore = {
  /**
   * Read all items from a store
   */
  read<T>(storeName: StoreName): T[] {
    const filePath = getFilePath(storeName);
    if (!existsSync(filePath)) {
      return [];
    }
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T[];
    } catch {
      console.error(`Error reading ${storeName}:`, Error);
      return [];
    }
  },

  /**
   * Write all items to a store (overwrites existing data)
   */
  write<T>(storeName: StoreName, data: T[]): void {
    ensureDataDir();
    const filePath = getFilePath(storeName);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  },

  /**
   * Create a new item in the store
   */
  create<T extends { id: string }>(storeName: StoreName, item: T): T {
    const data = this.read<T>(storeName);
    data.push(item);
    this.write(storeName, data);
    return item;
  },

  /**
   * Find an item by ID
   */
  findById<T extends { id: string }>(
    storeName: StoreName,
    id: string
  ): T | null {
    const data = this.read<T>(storeName);
    return data.find((item) => item.id === id) ?? null;
  },

  /**
   * Update an item by ID
   */
  update<T extends { id: string; updatedAt?: string }>(
    storeName: StoreName,
    id: string,
    updates: Partial<T>
  ): T | null {
    const data = this.read<T>(storeName);
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }
    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.write(storeName, data);
    return data[index];
  },

  /**
   * Delete an item by ID
   */
  delete<T extends { id: string }>(storeName: StoreName, id: string): boolean {
    const data = this.read<T>(storeName);
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    data.splice(index, 1);
    this.write(storeName, data);
    return true;
  },

  /**
   * Query items with filters
   */
  query<T>(
    storeName: StoreName,
    filters: Partial<Record<keyof T, unknown>>
  ): T[] {
    const data = this.read<T>(storeName);
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) {
          return true;
        }
        const itemValue = (item as Record<string, unknown>)[key];
        // Support array contains check
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return itemValue === value;
      });
    });
  },

  /**
   * Query items with a custom filter function
   */
  filter<T>(
    storeName: StoreName,
    predicate: (item: T) => boolean
  ): T[] {
    const data = this.read<T>(storeName);
    return data.filter(predicate);
  },

  /**
   * Count items matching filters
   */
  count<T>(
    storeName: StoreName,
    filters?: Partial<Record<keyof T, unknown>>
  ): number {
    if (!filters) {
      return this.read<T>(storeName).length;
    }
    return this.query<T>(storeName, filters).length;
  },

  /**
   * Check if an item exists
   */
  exists<T extends { id: string }>(storeName: StoreName, id: string): boolean {
    return this.findById<T>(storeName, id) !== null;
  },

  /**
   * Get all unique values for a field
   */
  distinct<T, K extends keyof T>(storeName: StoreName, field: K): T[K][] {
    const data = this.read<T>(storeName);
    const values = new Set(data.map((item) => item[field]));
    return Array.from(values);
  },

  /**
   * Aggregate sum of a numeric field
   */
  sum<T>(storeName: StoreName, field: keyof T, filters?: Partial<Record<keyof T, unknown>>): number {
    const data = filters ? this.query<T>(storeName, filters) : this.read<T>(storeName);
    return data.reduce((acc, item) => {
      const value = item[field];
      return acc + (typeof value === "number" ? value : 0);
    }, 0);
  },
};

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}
