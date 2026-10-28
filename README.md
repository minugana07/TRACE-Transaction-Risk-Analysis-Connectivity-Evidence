# TRACE - Protect Me Consumer Safety Experience (Member 3)

> **Official Product Name:** The product name is strictly **TRACE** (*Transaction Risk Analysis, Connectivity & Evidence*). All branding, interfaces, and documentation strictly use TRACE.

---

## Overview

The **Protect Me** module provides a consumer-facing, highly accessible safety experience for **TRACE**. It empowers consumers, everyday digital payment users, and seniors to:
1. **Understand Transaction Risks:** Inspect transactions with plain-language explanations of actual `DetectionResult` and `Alert` data rather than cryptic technical codes.
2. **Ingest Transactions:** Add transactions via manual entry or CSV upload with instant risk evaluation against TRACE detection models.
3. **Verify Incoming Callers (CallShield):** Screen phone numbers and SMS headers against official verified directories and crowdsourced scam complaints, strictly distinguishing verified sources from unverified reports while never assuming unlisted numbers are safe.
4. **Learn Digital Payment Defense (ScamShield):** Interactive educational roleplays covering UPI collect requests, utility disconnection threats, work-from-home task scams, and emergency friend impersonation with comprehension explain-back checks.
5. **Connect Concerns to Evidence (Safety Loop):** Ground user concerns in genuine transaction evidence and detection results from Member 1 without inventing or fabricating connections.
6. **Accessible to Everyone:** Built with large touch targets (≥44px), high contrast mode, 3-tier text magnification (100%, 115%, 130%), and browser-native Text-to-Speech (TTS) read-aloud support.

---

## Directory Structure

```
trace-protect-me/
├── package.json
├── tsconfig.json
├── README.md
├── INTEGRATION.md
├── TEST_CHECKLIST.md
└── src/
    ├── index.ts                      # Public exports
    ├── contracts/
    │   ├── transaction.ts            # Member 1 shared contracts (Transaction, Alert, DetectionResult)
    │   ├── phoneLookup.ts            # CallShield contract (Verified vs Unverified vs Not Found vs Unavailable)
    │   └── scamShield.ts             # ScamShield interactive scenario & explain-back contracts
    ├── data/
    │   ├── mockData.ts               # Isolated demonstration dataset tagged with isSampleDemonstration: true
    │   ├── curatedPhoneDataset.ts    # Curated phone entries & search engine
    │   └── scamScenarios.ts          # 4 fictional interactive educational scenarios
    ├── services/
    │   ├── apiClient.ts              # Pluggable backend adapter (Member 1 endpoint bridge & offline fallback)
    │   └── ttsService.ts             # SpeechSynthesis read-aloud accessibility engine
    ├── context/
    │   └── AccessibilityContext.tsx  # Text scale, high contrast, and voice state
    └── components/
        ├── ProtectMeContainer.tsx    # Root container with responsive tab navigation
        ├── accessibility/
        │   ├── AccessibilityBar.tsx  # Accessible toolbar (A/A+/A++, High Contrast, Read Aloud)
        │   └── VoiceReaderButton.tsx # Per-item speech synthesizer button
        ├── dashboard/
        │   ├── SafetyOverview.tsx    # Consumer dashboard with safety pulse & metrics
        │   └── RecentAlertsBanner.tsx# Plain-language alert warnings
        ├── transactions/
        │   ├── TransactionIngestion.tsx   # CSV file upload & manual input form
        │   ├── TransactionHistory.tsx     # Filterable list, search, and empty states
        │   ├── TransactionCard.tsx        # High-contrast transaction card
        │   └── RiskExplanationModal.tsx   # Deep-dive modal explaining DetectionResult & next steps
        ├── callshield/
        │   ├── CallShieldLookup.tsx       # Phone search interface with test presets
        │   └── PhoneReportCard.tsx        # 4 distinct outcome states
        ├── scamshield/
        │   ├── ScamShieldHome.tsx         # Educational scenario hub & progress
        │   ├── ScenarioInteractive.tsx    # Roleplay message simulator & decisions
        │   └── ExplainBackCard.tsx        # Comprehension verification questions
        └── safetyloop/
            └── SafetyLoop.tsx             # Strict evidence matcher (phone/VPA/ID -> transaction)
```

---

## Key Consumer Safety Principles Adhered To

- **Zero Credential Requests:** Never requests a UPI PIN, OTP, password, or card security code. Explicitly warns users that UPI PINs are only for debiting money.
- **No Fabricated Data:** Does not fabricate live telecom GPS tracking, fake caller identity, or imaginary account freezes.
- **Accurate Reputational Caveats:** Clearly displays that "No reports found" does NOT mean a number is safe.
- **Isolated Demonstration Data:** All mock records are labeled with `isSampleDemonstration: true` and clearly distinguishable from user-entered transactions.
