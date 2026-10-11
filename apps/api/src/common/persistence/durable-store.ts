import * as fs from 'fs';
import * as path from 'path';

export class DurableStore<T extends { id: string }> {
  private items = new Map<string, T>();
  private filePath: string;

  constructor(collectionName: string) {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.filePath = path.join(dataDir, `${collectionName}.json`);
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: T[] = JSON.parse(raw);
        for (const item of list) {
          this.items.set(item.id, item);
        }
      } catch {
        // Fallback to empty store if corrupt
      }
    }
  }

  private persist(): void {
    try {
      const list = Array.from(this.items.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch {
      // Fail-safe write
    }
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  values(): IterableIterator<T> {
    return this.items.values();
  }

  set(id: string, value: T): void {
    this.items.set(id, value);
    this.persist();
  }

  delete(id: string): boolean {
    const res = this.items.delete(id);
    if (res) this.persist();
    return res;
  }

  clear(): void {
    this.items.clear();
    this.persist();
  }
}
