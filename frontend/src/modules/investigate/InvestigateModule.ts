import type { ITraceInvestigateApi } from './api/client.ts';
import { HttpTraceInvestigateClient } from './api/client.ts';
import { InMemoryTraceApiAdapter } from './api/in-memory-adapter.ts';
import { InvestigationStore } from './state/investigation-store.ts';
import { InvestigateUiRenderer } from './components/ui-renderer.ts';

export interface InvestigateModuleOptions {
  api?: ITraceInvestigateApi;
  useSyntheticDemo?: boolean;
  initialAlertId?: string;
}

/**
 * TRACE Member 4 Investigate Module.
 * Plugs directly into the shared TRACE app shell without creating a second router or competing backend.
 */
export class InvestigateModule {
  private api: ITraceInvestigateApi;
  private store: InvestigationStore;
  private renderer?: InvestigateUiRenderer;

  constructor(options: InvestigateModuleOptions = {}) {
    if (options.api) {
      this.api = options.api;
    } else if (options.useSyntheticDemo) {
      this.api = new InMemoryTraceApiAdapter();
    } else {
      this.api = new HttpTraceInvestigateClient();
    }

    this.store = new InvestigationStore(this.api);
  }

  getStore(): InvestigationStore {
    return this.store;
  }

  getApi(): ITraceInvestigateApi {
    return this.api;
  }

  async mount(container: HTMLElement): Promise<void> {
    this.renderer = new InvestigateUiRenderer(container, this.store);
    await this.store.loadAlerts();
  }

  unmount(): void {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = undefined;
    }
  }
}

/**
 * Convenient helper to mount TRACE Investigate module into any DOM container.
 */
export async function mountTraceInvestigate(
  container: HTMLElement,
  options?: InvestigateModuleOptions
): Promise<InvestigateModule> {
  const mod = new InvestigateModule(options);
  await mod.mount(container);
  return mod;
}
