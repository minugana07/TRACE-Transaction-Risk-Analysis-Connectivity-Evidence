# TRACE - Protect Me Test Checklist & Verification Plan

This checklist outlines the verification steps for validating the Protect Me consumer experience.

---

## 1. Branding & Product Name Compliance
- [ ] Verify product name is **TRACE** in all titles, headers, toolbars, buttons, and footers.
- [ ] Confirm no prohibited or legacy project names appear in any UI strings, metadata, documentation, or code comments.
- [ ] Confirm no claims are made regarding unauthorized integrations (e.g. claiming direct internal control of Google Pay or automated money recovery).

---

## 2. Ingestion & Transaction Processing
- [ ] **Manual Ingestion Validation:**
  - [ ] Attempt submission with an empty amount -> Verify error prompt.
  - [ ] Attempt submission with amount <= 0 -> Verify error prompt.
  - [ ] Attempt submission with missing recipient UPI ID -> Verify validation message.
  - [ ] Submit valid transfer (e.g., ₹2,500 to `store@upi`) -> Verify transaction appears at the top of the history list with evaluated risk score.
  - [ ] Submit transfer with suspicious note keywords (e.g., "urgent electricity bill cut") -> Verify TRACE engine triggers medium/high risk flags.
- [ ] **CSV Ingestion Validation:**
  - [ ] Test pasting CSV text directly or uploading file.
  - [ ] Test empty CSV submission -> Verify graceful error message.
  - [ ] Click "Insert Sample Data" -> Ingest batch -> Verify all rows are ingested and summary count is displayed.
- [ ] **Data Integrity:**
  - [ ] Verify mock sample transactions are explicitly labeled with `[Sample Record]` badges.
  - [ ] Verify newly entered transactions are marked as live user inputs.

---

## 3. Transaction History & Plain-Language Risk Explanations
- [ ] **Search & Filter:**
  - [ ] Type "refund" into search bar -> Verify only transactions matching "refund" appear.
  - [ ] Click "Flagged" filter pill -> Verify only High and Critical risk transactions display.
  - [ ] Click "Safe" filter pill -> Verify only Safe and Low risk transactions display.
  - [ ] Test query with zero matches (e.g. "xyz999") -> Verify accessible empty state is rendered with a reset button.
- [ ] **Risk Explanation Modal:**
  - [ ] Click "Why Flagged? →" on critical transaction `TXN-9024-CRIT`.
  - [ ] Verify dialog opens with focus trapped and accessible ARIA attributes.
  - [ ] Check plain-language summary: explains why it was flagged without technical jargon.
  - [ ] Check evidence items: displays category badge, headline, and clear explanation.
  - [ ] Check connectivity/graph insights: verifies mule cluster match and hop distance.
  - [ ] Check practical next steps: clearly displays bank helpline and National Cybercrime Reporting Helpline 1930.
  - [ ] Press `Escape` key or click "Close" -> Verify modal closes smoothly.

---

## 4. CallShield Phone Reputation & Intelligence
- [ ] **Verified Official Source Test:**
  - [ ] Search `1930` or `1800 425 3800` -> Verify status is `VERIFIED OFFICIAL SOURCE`.
  - [ ] Confirm official entity name, registry source, and verification date are displayed.
  - [ ] Verify caller ID spoof warning is prominently shown ("Legitimate bank officers never ask for UPI PIN or OTP").
- [ ] **Unverified Citizen Reports Test:**
  - [ ] Search `9876543210` -> Verify status is `UNVERIFIED CITIZEN REPORTS`.
  - [ ] Confirm report count (18 reports) and sample citizen complaint quotes are displayed.
  - [ ] Confirm bold safety warning against transferring funds or scanning QR codes.
- [ ] **No Reports Found Test:**
  - [ ] Search standard unlisted number `9811122233`.
  - [ ] Verify status is `NO MATCHING REPORTS FOUND`.
  - [ ] **CRITICAL:** Confirm prominent amber disclaimer appears: *"Absence of reports does NOT mean this number is safe. Scammers routinely rotate SIM cards."*
- [ ] **Invalid / Unavailable Format Test:**
  - [ ] Enter `12` or invalid text -> Verify status is `LOOKUP UNAVAILABLE` with formatting advice.

---

## 5. ScamShield Educational Simulator
- [ ] **Catalog & Selection:**
  - [ ] Open ScamShield tab -> Verify scenario cards are displayed with channel badges (WhatsApp, SMS, Telegram).
  - [ ] Select Scenario 1: *"The Enter PIN to Receive Money Trick"*.
- [ ] **Roleplay Chat Simulation:**
  - [ ] Verify simulated chat displays realistic scam messages and system collect notifications.
  - [ ] Verify red flag highlights are explained in simple language.
- [ ] **Multiple-Choice Decision:**
  - [ ] Select dangerous option ("Tap Pay and enter my PIN") -> Verify immediate warning feedback explaining financial loss.
  - [ ] Select safe option ("Decline and block caller") -> Verify congratulatory feedback explaining why this protects the balance.
- [ ] **Explain-Back Comprehension Question:**
  - [ ] Verify explain-back question tests understanding of UPI PIN debit mechanics.
  - [ ] Select incorrect option -> Verify constructive corrective explanation.
  - [ ] Select correct option -> Verify explanation and golden rule takeaway.
- [ ] **Practical Next Steps:**
  - [ ] Verify safe next steps checklist appears upon completing the scenario.
  - [ ] Return to catalog -> Verify scenario is marked as `✓ Completed`.

---

## 6. Safety Loop (Concern-to-Evidence Matcher)
- [ ] **Matching Real Transaction Evidence:**
  - [ ] Enter phone number `9876543210` or UPI ID `quick.refund.help@ybl`.
  - [ ] Click "Inspect Connection" -> Verify real match is made with Transaction ID `TXN-9024-CRIT`.
  - [ ] Verify matching evidence items, detection results, and specific risk recommendations are shown.
- [ ] **No Match Found Handling:**
  - [ ] Enter unlisted query `random.stranger@bank`.
  - [ ] Click "Inspect Connection" -> Verify clear notification: *"No matching record or transaction was found in your TRACE records."*
  - [ ] Confirm the system does **NOT** invent a fake transaction or fake risk score.
  - [ ] Confirm practical advice is given (e.g. check CallShield, keep money safe, call 1930 if funds already moved).

---

## 7. Accessibility & Sensory Support
- [ ] **Text Size Scaling:**
  - [ ] Click `A` -> Default text scale (100%).
  - [ ] Click `A+` -> Large text scale (115%).
  - [ ] Click `A++` -> Extra-large text scale (130%).
  - [ ] Verify all container layouts reflow smoothly without text truncation.
- [ ] **High Contrast Mode:**
  - [ ] Click "High Contrast" button.
  - [ ] Verify high contrast borders, dark background, yellow highlights, and colorblind-safe icons engage across all components.
  - [ ] Toggle off -> Verify standard theme restores smoothly.
- [ ] **Text-to-Speech (Read Aloud):**
  - [ ] Click "Read Aloud" on Accessibility Bar -> Verify browser speech synthesis begins reading page summary.
  - [ ] Click "Listen" on any Transaction, Alert, or CallShield card -> Verify audio reads specific card content cleanly.
  - [ ] Click "Stop" -> Verify speech synthesis cancels immediately.
- [ ] **Touch Targets & Focus:**
  - [ ] Confirm all interactive buttons meet minimum touch target standards (≥44px height/width).
  - [ ] Test full navigation using `Tab` and `Shift+Tab`.
