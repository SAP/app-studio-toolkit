import type { Memento } from "vscode";

export { MementoMap };

class MementoMap implements Memento {
  private store: Map<string, any>;

  constructor() {
    this.store = new Map<string, any>();
  }

  keys(): readonly string[] {
    return Array.from(this.store.keys());
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return (this.store.get(key) as T) ?? defaultValue;
  }

  update(key: string, value: any): Thenable<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
}
