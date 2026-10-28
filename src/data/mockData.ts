/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * Clearly Labelled Demonstration Dataset (Isolated Mock Data)
 * 
 * Complies with Member 1 contracts.
 * All records here are strictly for demonstration/testing and marked with isSampleDemonstration: true.
 */

import { Transaction, Alert, DetectionResult } from '../contracts/transaction';

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-2026-8812',
    transactionId: 'TXN-9024-CRIT',
    severity: 'CRITICAL',
    title: 'Urgent: High-Risk Transfer to Flagged Account',
    plainLanguageSummary: 'This transfer was made to an account linked to reported digital payment fraud incidents. Money may not be recoverable if sent.',
    technicalDetails: 'Graph degree-1 connection to known mule cluster (ID: CLUSTER-4091). High velocity incoming funds draining within 90 seconds.',
    createdAt: '2026-10-28T08:45:00Z',
    status: 'OPEN',
    recommendedActions: [
      'Do not approve any further requests from this recipient.',
      'Immediately call your bank helpline using the official number on the back of your card.',
      'Call the National Cybercrime Reporting Helpline 1930 to freeze transit funds.',
      'Document transaction ID and chat screenshots for your records.'
    ]
  },
  {
    id: 'ALT-2026-8813',
    transactionId: 'TXN-7731-HIGH',
    severity: 'HIGH',
    title: 'Unusual Recipient Pattern Detected',
    plainLanguageSummary: 'The recipient UPI ID was created less than 48 hours ago and has already received multiple rapid small transfers from different cities.',
    technicalDetails: 'Synthetic account anomaly score: 0.88. Burst velocity: 14 incoming transfers in 2 hours across distinct geographical circles.',
    createdAt: '2026-10-27T21:12:00Z',
    status: 'OPEN',
    recommendedActions: [
      'Verify the recipient through an independent channel before proceeding.',
      'Never share an OTP or enter your UPI PIN to "receive" money.',
      'Report any suspicious WhatsApp or SMS message to 1930.'
    ]
  },
  {
    id: 'ALT-2026-8814',
    transactionId: 'TXN-5542-MED',
    severity: 'MEDIUM',
    title: 'Unfamiliar Payment Request',
    plainLanguageSummary: 'Payment request note includes pressure keywords ("urgent disconnect", "immediate verification").',
    technicalDetails: 'Keyword NLP trigger: ["immediate electricity cut", "update kyc immediately"]. Sentiment urgency index: 0.94.',
    createdAt: '2026-10-26T14:30:00Z',
    status: 'OPEN',
    recommendedActions: [
      'Utility providers never ask you to transfer funds to personal UPI IDs.',
      'Check your actual bill status directly on the official utility company website or app.'
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-9024-CRIT',
    timestamp: '2026-10-28T08:45:00Z',
    amount: 24999.00,
    currency: 'INR',
    senderId: 'USR-ME-001',
    senderAccountOrVpa: 'user.protect@okaxis',
    senderPhone: '+919811122233',
    receiverId: 'SUSPECT-MULE-99',
    receiverAccountOrVpa: 'quick.refund.help@ybl',
    receiverPhone: '+919876543210',
    paymentMethod: 'UPI',
    category: 'Transfer / Customer Support',
    note: 'Customer care refund authorization fee',
    status: 'FLAGGED',
    isSampleDemonstration: true,
    alerts: [MOCK_ALERTS[0]],
    detectionResult: {
      transactionId: 'TXN-9024-CRIT',
      overallRiskScore: 94,
      riskLevel: 'CRITICAL',
      evaluatedAt: '2026-10-28T08:45:04Z',
      isEngineEvaluated: true,
      flags: [
        'MULE_ACCOUNT_CLUSTER_MATCH',
        'KNOWN_SCAM_PHONE_ASSOCIATION',
        'HIGH_DRAIN_VELOCITY',
        'UNUSUAL_HOURS_HIGH_VALUE'
      ],
      plainLanguageExplanation: 'TRACE detected that the destination UPI ID and phone number have been linked to multiple reported customer-support impersonation scams. Furthermore, funds entering this destination account are drained almost immediately to other accounts.',
      technicalSummary: 'Recipient cluster exhibits 98.4% pass-through velocity within 120s of credit. Receiver phone +919876543210 has 18 unverified community fraud reports on record.',
      evidenceList: [
        {
          id: 'EVD-901',
          category: 'KNOWN_SCAMMER_PATTERN',
          severity: 'CRITICAL',
          headline: 'Recipient Phone Linked to 18 Scam Complaints',
          detail: 'The number +919876543210 has been repeatedly flagged in digital scam reports claiming to be electricity or courier refund desks.',
          confidenceScore: 0.95
        },
        {
          id: 'EVD-902',
          category: 'NETWORK_GRAPH',
          severity: 'CRITICAL',
          headline: '1-Hop Link to Flagged Mule Account Cluster',
          detail: 'Recipient account has forwarded 87% of its received balance to a known cybercrime syndicate mule wallet within minutes.',
          confidenceScore: 0.92
        },
        {
          id: 'EVD-903',
          category: 'BEHAVIORAL_ANOMALY',
          severity: 'HIGH',
          headline: 'Urgency & Keyword Pressure in Transaction Note',
          detail: 'Transaction note matches standard phishing script ("refund authorization fee"). Remember: real refunds never require you to pay a fee.',
          confidenceScore: 0.89
        }
      ],
      ruleHits: [
        'R-201: Mule Account Rapid Pass-Through Rule',
        'R-404: Malicious Phone Association in CallShield Registry',
        'R-608: High-Value First-Time Transfer to Fresh VPA'
      ],
      graphInsights: {
        isMuleAccount: true,
        hopsFromKnownScammer: 1,
        communityRisk: 0.94,
        associatedReportCount: 18,
        clusterTag: 'Kolkata-Jamtara-FinMule-B'
      }
    }
  },
  {
    id: 'TXN-7731-HIGH',
    timestamp: '2026-10-27T21:12:00Z',
    amount: 8500.00,
    currency: 'INR',
    senderId: 'USR-ME-001',
    senderAccountOrVpa: 'user.protect@okaxis',
    senderPhone: '+919811122233',
    receiverId: 'FRESH-VPA-12',
    receiverAccountOrVpa: 'telegram.earn.tasks@icici',
    receiverPhone: '+919123456789',
    paymentMethod: 'UPI',
    category: 'Work / Task Deposit',
    note: 'VIP level 2 task activation deposit',
    status: 'FLAGGED',
    isSampleDemonstration: true,
    alerts: [MOCK_ALERTS[1]],
    detectionResult: {
      transactionId: 'TXN-7731-HIGH',
      overallRiskScore: 82,
      riskLevel: 'HIGH',
      evaluatedAt: '2026-10-27T21:12:05Z',
      isEngineEvaluated: true,
      flags: [
        'TASK_SCAM_VOCABULARY_DETECTED',
        'NEWLY_CREATED_ACCOUNT',
        'DISPERSED_MICRO_DEPOSITS'
      ],
      plainLanguageExplanation: 'This transaction resembles a "part-time task scam." Scammers promise high returns for simple tasks (like rating videos or Google maps locations) and demand upfront deposits to unlock bigger commissions.',
      technicalSummary: 'Entropy score on incoming transfers indicates high fragmentation. UPI handle registered 31 hours prior to transaction timestamp.',
      evidenceList: [
        {
          id: 'EVD-771',
          category: 'KNOWN_SCAMMER_PATTERN',
          severity: 'HIGH',
          headline: 'Telegram / WhatsApp "Task Investment" Pattern',
          detail: 'The note "task activation deposit" is a hallmark of Ponzi-style task scams where withdrawals are blocked after depositing.',
          confidenceScore: 0.91
        },
        {
          id: 'EVD-772',
          category: 'BEHAVIORAL_ANOMALY',
          severity: 'HIGH',
          headline: 'High-Velocity New Account',
          detail: 'Recipient VPA was created yesterday and has collected transfers from 24 different individuals across India.',
          confidenceScore: 0.85
        }
      ],
      ruleHits: [
        'R-502: Task-Job Scam Signature Filter',
        'R-310: Rapid Geographically Distributed Deposits'
      ],
      graphInsights: {
        isMuleAccount: false,
        hopsFromKnownScammer: 2,
        communityRisk: 0.82,
        associatedReportCount: 7,
        clusterTag: 'Telegram-TaskScam-Network'
      }
    }
  },
  {
    id: 'TXN-5542-MED',
    timestamp: '2026-10-26T14:30:00Z',
    amount: 1450.00,
    currency: 'INR',
    senderId: 'USR-ME-001',
    senderAccountOrVpa: 'user.protect@okaxis',
    senderPhone: '+919811122233',
    receiverId: 'SUSP-BILL-DESK',
    receiverAccountOrVpa: 'officer.electricity.board@paytm',
    receiverPhone: '+919899887766',
    paymentMethod: 'UPI',
    category: 'Utilities',
    note: 'Urgent power bill clearance to prevent disconnection tonight',
    status: 'FLAGGED',
    isSampleDemonstration: true,
    alerts: [MOCK_ALERTS[2]],
    detectionResult: {
      transactionId: 'TXN-5542-MED',
      overallRiskScore: 61,
      riskLevel: 'MEDIUM',
      evaluatedAt: '2026-10-26T14:30:04Z',
      isEngineEvaluated: true,
      flags: [
        'PERSONAL_VPA_FOR_UTILITY_CLAIM',
        'URGENCY_KEYWORD_THREAT'
      ],
      plainLanguageExplanation: 'Official utility boards never accept bill payments to personal Paytm/UPI IDs or threaten immediate disconnection via personal phone numbers. Legitimate bills should only be paid on official portals or verified BBPS biller handles.',
      technicalSummary: 'Recipient VPA is an unverified individual handle, not an RBI-approved BBPS (Bharat Bill Payment System) merchant.',
      evidenceList: [
        {
          id: 'EVD-551',
          category: 'RULE_TRIGGER',
          severity: 'MEDIUM',
          headline: 'Non-BBPS Utility Impersonation',
          detail: 'Recipient is using a personal UPI address while claiming to represent a public electricity distribution company.',
          confidenceScore: 0.88
        }
      ],
      ruleHits: [
        'R-109: Personal UPI Account Claiming Utility Affiliation'
      ],
      graphInsights: {
        isMuleAccount: false,
        hopsFromKnownScammer: 3,
        communityRisk: 0.58,
        associatedReportCount: 4
      }
    }
  },
  {
    id: 'TXN-3321-LOW',
    timestamp: '2026-10-25T19:15:00Z',
    amount: 320.00,
    currency: 'INR',
    senderId: 'USR-ME-001',
    senderAccountOrVpa: 'user.protect@okaxis',
    senderPhone: '+919811122233',
    receiverId: 'LOCAL-CAFE-08',
    receiverAccountOrVpa: 'cornerbistro@okhdfcbank',
    paymentMethod: 'UPI',
    category: 'Dining & Food',
    note: 'Coffee and sandwich',
    status: 'COMPLETED',
    isSampleDemonstration: true,
    alerts: [],
    detectionResult: {
      transactionId: 'TXN-3321-LOW',
      overallRiskScore: 8,
      riskLevel: 'SAFE',
      evaluatedAt: '2026-10-25T19:15:02Z',
      isEngineEvaluated: true,
      flags: ['VERIFIED_LOCAL_MERCHANT'],
      plainLanguageExplanation: 'This transaction was made to a verified business merchant with an established positive transaction history. No fraud patterns or anomalies were detected.',
      evidenceList: [
        {
          id: 'EVD-331',
          category: 'RULE_TRIGGER',
          severity: 'SAFE',
          headline: 'Verified Merchant Account',
          detail: 'Recipient is an HDFC Bank verified merchant operating over 18 months with zero consumer disputes.',
          confidenceScore: 0.98
        }
      ],
      ruleHits: ['R-001: Verified Business Whitelist Match']
    }
  },
  {
    id: 'TXN-1109-SAFE',
    timestamp: '2026-10-24T11:00:00Z',
    amount: 2800.00,
    currency: 'INR',
    senderId: 'USR-ME-001',
    senderAccountOrVpa: 'user.protect@okaxis',
    senderPhone: '+919811122233',
    receiverId: 'APOLLO-PHARMA-101',
    receiverAccountOrVpa: 'apollopharmacy@icici',
    paymentMethod: 'UPI',
    category: 'Healthcare & Medicine',
    note: 'Monthly prescribed medicines',
    status: 'COMPLETED',
    isSampleDemonstration: true,
    alerts: [],
    detectionResult: {
      transactionId: 'TXN-1109-SAFE',
      overallRiskScore: 3,
      riskLevel: 'SAFE',
      evaluatedAt: '2026-10-24T11:00:02Z',
      isEngineEvaluated: true,
      flags: ['BBPS_REGISTERED_ENTERPRISE', 'RECURRENT_LEGITIMATE_PAYMENT'],
      plainLanguageExplanation: 'Verified pharmacy chain transaction. Fully compliant with banking security protocols.',
      evidenceList: [],
      ruleHits: ['R-001: Verified Enterprise Whitelist Match']
    }
  }
];
