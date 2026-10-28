# TRACE Investigate Integration Guide | For App Lead & Member 1

This guide explains how to mount the Member 4 **Investigate** module into the shared TRACE frontend shell.

---

## 1. Quick Mount (Vanilla / Any Framework)

Member 4 provides `mountTraceInvestigate(container, options)`:

```typescript
import { mountTraceInvestigate } from './modules/investigate/index.ts';

// Get target container element from your layout
const container = document.getElementById('trace-main-view');

// Mount with live backend API (default):
const module = await mountTraceInvestigate(container, {
  useSyntheticDemo: false // Points to Member 1's /api endpoints
});

// Or mount in synthetic demo mode (for offline dev/preview):
const demoModule = await mountTraceInvestigate(container, {
  useSyntheticDemo: true
});
```

---

## 2. React Integration Example

```tsx
import React, { useEffect, useRef } from 'react';
import { InvestigateModule } from '../modules/investigate/index.ts';

export const InvestigateView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const module = new InvestigateModule({
      useSyntheticDemo: false, // Set to true for offline demo
    });

    module.mount(containerRef.current);

    return () => {
      module.unmount();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

---

## 3. Running Automated Tests

To verify that the module functions properly and all contract boundaries are preserved:

```bash
cd trace
npm test
# or directly:
node --test src/tests/run-all-tests.ts
```

All 22 automated test suites verify:
- Alert Queue sorting, priority filtering, and search.
- Risk Ripple directed graph generation and edge-to-transfer integrity.
- Sequence highlighting temporal ordering.
- Cross-navigation from graph elements to associated alerts.
- Empty states for alerts, graphs, and missing coordinates.
- Coordinate boundaries and Count vs. Rate distinction in Hotspot Mapping.
- Case status transitions and persistent note journaling.
- **Strict transaction immutability** (case status changes never mutate transaction records).
- Graceful handling of corrupted/malformed payloads.
