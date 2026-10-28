# TRACE - Member 1 Integration Guide for Protect Me

This guide explains how Member 1 can seamlessly incorporate Member 3's **Protect Me** consumer experience into the main TRACE application shell and router without modifying existing detection engines or breaking teammates' work.

---

## 1. Installation / Path Reference

Member 3's components are located at:
```
trace-protect-me/src/
```
In your monorepo or project structure, you can either:
- Copy the folder to `src/features/protect-me`, or
- Import directly via path alias `@trace/protect-me`.

---

## 2. Mounting the Complete Protect Me Experience

You can mount the entire modular feature into your router or layout with a single component:

```tsx
import React from 'react';
import { ProtectMeContainer } from './features/protect-me';

export function ProtectMePage() {
  return (
    <ProtectMeContainer
      apiBaseUrl={process.env.REACT_APP_API_BASE_URL || ''}
      enableLiveBackend={true}
    />
  );
}
```

### Props Reference for `ProtectMeContainer`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialTab` | `'dashboard' \| 'transactions' \| 'callshield' \| 'scamshield' \| 'safetyloop'` | `'dashboard'` | Initial tab displayed |
| `apiBaseUrl` | `string` | `''` | Base URL for Member 1 backend endpoints |
| `enableLiveBackend` | `boolean` | `false` | When true, tries `/api/...` before fallback |
| `onNavigateParent` | `(route: string) => void` | `undefined` | Optional router callback |

---

## 3. Sub-Route Integration with React Router

If your application uses nested routes (e.g. React Router v6), you can mount individual components into separate routes:

```tsx
import { Routes, Route } from 'react-router-dom';
import { 
  AccessibilityProvider,
  AccessibilityBar,
  SafetyOverview,
  TransactionHistory,
  CallShieldLookup,
  ScamShieldHome,
  SafetyLoop 
} from './features/protect-me';

export function ProtectMeRouter({ transactions, alerts, onAddTxn, onBatchAdded }) {
  return (
    <AccessibilityProvider>
      <AccessibilityBar />
      <Routes>
        <Route path="/" element={<SafetyOverview transactions={transactions} alerts={alerts} />} />
        <Route path="/transactions" element={<TransactionHistory transactions={transactions} onAddTransaction={onAddTxn} onBatchAdded={onBatchAdded} />} />
        <Route path="/callshield" element={<CallShieldLookup />} />
        <Route path="/scamshield" element={<ScamShieldHome />} />
        <Route path="/safety-loop" element={<SafetyLoop transactions={transactions} alerts={alerts} />} />
      </Routes>
    </AccessibilityProvider>
  );
}
```

---

## 4. Shared Contract Alignment (Member 1 Specs)

Member 3 strictly follows Member 1's shared contracts defined in `src/contracts/transaction.ts`:

- **`Transaction`:** Contains `id`, `amount`, `currency`, `senderAccountOrVpa`, `receiverAccountOrVpa`, `paymentMethod`, `status`, `detectionResult`, `alerts`.
- **`DetectionResult`:** Contains `overallRiskScore` (0–100), `riskLevel` (`SAFE` | `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), `plainLanguageExplanation`, `evidenceList`, `ruleHits`, `graphInsights`.
- **`Alert`:** Contains `id`, `transactionId`, `severity`, `title`, `plainLanguageSummary`, `recommendedActions`.
- **`PhoneLookupResult`:** Contains `status` (`VERIFIED_SOURCE` | `UNVERIFIED_REPORT` | `NO_REPORTS_FOUND` | `LOOKUP_UNAVAILABLE`).

---

## 5. Backend Endpoint Mapping

When `enableLiveBackend` is enabled, `traceApi` communicates with Member 1's standard endpoints:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/transactions` | `GET` | Fetches user transaction list |
| `/api/detect/evaluate` | `POST` | Passes `TransactionManualInput` to Member 1 engine and returns `{ transaction, detectionResult }` |
| `/api/alerts` | `GET` | Fetches active consumer alerts |
| `/api/phone-lookup?number=` | `GET` | Queries phone intelligence records |

*Fallback Behavior:* If the backend is offline or unreachable, `traceApi` seamlessly uses the isolated mock datasets (`MOCK_TRANSACTIONS`, `MOCK_ALERTS`, `CURATED_PHONE_ENTRIES`) without throwing unhandled exceptions.

---

## 6. Tailwind CSS Theme Integration

Member 3 uses standard Tailwind utility classes with semantic theme variables (`var(--background)`, `var(--card)`, `var(--foreground)`, `var(--border)`). 

To ensure High Contrast mode renders cleanly, include this minimal CSS in your global styles:

```css
.theme-high-contrast {
  --background: #000000;
  --card: #121212;
  --foreground: #ffffff;
  --border: #facc15;
}
.text-scale-large {
  font-size: 1.125rem;
}
.text-scale-xl {
  font-size: 1.25rem;
}
```
