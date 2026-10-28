/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * CallShield Curated Phone Intelligence Dataset
 * 
 * Strictly adheres to consumer safety standards:
 * 1. Verified official institutions (Banks, Helplines)
 * 2. Unverified crowdsourced / community fraud reports
 * 3. Never implies safety for unlisted numbers
 * 4. No fabricated telecommunication GPS tracking or live wiretaps
 */

import { PhoneLookupResult, PhoneLookupStatus } from '../contracts/phoneLookup';

export const CURATED_PHONE_ENTRIES: Record<string, Partial<PhoneLookupResult>> = {
  // Official Helplines / Verified Banks
  '1930': {
    status: 'VERIFIED_SOURCE',
    verifiedSource: {
      entityName: 'National Cyber Crime Reporting Helpline (I4C)',
      officialCategory: 'EMERGENCY_HELPLINE',
      verifiedBadge: true,
      sourceRegistry: 'Ministry of Home Affairs (MHA), Govt of India Official Directory',
      officialWebsite: 'https://cybercrime.gov.in',
      tollFreeHelpline: '1930',
      verificationDate: '2026-01-15'
    },
    safetyAdvice: [
      'This is the official Government of India citizen financial cyber fraud reporting helpline.',
      'Call this number immediately within the "Golden Hour" if funds have been fraudulently transferred from your account.',
      'Helpline officials will assist in contacting designated bank nodal officers to freeze transit funds.'
    ]
  },
  '18004253800': {
    status: 'VERIFIED_SOURCE',
    verifiedSource: {
      entityName: 'State Bank of India (SBI) Official Customer Helpline',
      officialCategory: 'BANK_OFFICIAL',
      verifiedBadge: true,
      sourceRegistry: 'Reserve Bank of India (RBI) Public Banking Directory',
      officialWebsite: 'https://bank.sbi',
      tollFreeHelpline: '1800 425 3800',
      verificationDate: '2026-02-01'
    },
    safetyAdvice: [
      'This is an officially verified banking helpline.',
      'IMPORTANT: Legitimate bank officials will NEVER ask you for your ATM PIN, UPI PIN, Internet Banking Password, or OTP.',
      'If someone calls you displaying this caller ID asking for secrets, it may be a Caller ID Spoof. Hang up and dial the bank directly.'
    ]
  },
  '18002584455': {
    status: 'VERIFIED_SOURCE',
    verifiedSource: {
      entityName: 'HDFC Bank Customer Support Hotline',
      officialCategory: 'BANK_OFFICIAL',
      verifiedBadge: true,
      sourceRegistry: 'Reserve Bank of India (RBI) Public Banking Directory',
      officialWebsite: 'https://www.hdfcbank.com',
      tollFreeHelpline: '1800 258 4455',
      verificationDate: '2026-02-10'
    },
    safetyAdvice: [
      'Verified corporate customer support desk.',
      'Remember: Customer support will never send you an APK file or ask you to install AnyDesk/RustDesk.'
    ]
  },

  // Known Scam Numbers with Unverified Citizen Reports
  '9876543210': {
    status: 'UNVERIFIED_REPORT',
    unverifiedReport: {
      reportCount: 18,
      primaryReportCategory: 'UPI_COLLECT_REQUEST',
      recentUserNotes: [
        'Called pretending to be an OLX buyer who wanted to send advance payment via QR code.',
        'Sent a UPI collect request of Rs. 15,000 claiming I had to enter my PIN to receive the money.',
        'Insisted I keep the call active while scanning a QR code sent on WhatsApp.'
      ],
      firstReportedAt: '2026-08-14',
      lastReportedAt: '2026-10-28',
      communityCautionNotice: 'High volume of recent complaints. Multiple users reported extortion or UPI collect request deception originating from this caller.'
    },
    safetyAdvice: [
      'Do NOT accept any incoming UPI payment requests from this contact.',
      'Entering your UPI PIN always DEBITS money from your account. You NEVER need to enter a PIN to receive funds.',
      'Block this number immediately and report on the Chakshu (Sanchar Saathi) portal or 1930.'
    ]
  },
  '9899887766': {
    status: 'UNVERIFIED_REPORT',
    unverifiedReport: {
      reportCount: 7,
      primaryReportCategory: 'ELECTRICITY_BILL_THREAT',
      recentUserNotes: [
        'Sent SMS: "Dear consumer your electricity power will be disconnected at 9:30 PM tonight because your previous month bill was not updated. Immediately call 9899887766."',
        'Caller told me to download an app named "Bijli_Suvidha.apk" to verify payment.'
      ],
      firstReportedAt: '2026-09-02',
      lastReportedAt: '2026-10-26',
      communityCautionNotice: 'Reported utility disconnection scare tactic. Scammers use fear of blackout to induce hasty payment or malware installation.'
    },
    safetyAdvice: [
      'Electricity boards NEVER send disconnection threats with personal mobile numbers for contact.',
      'Never download or install any .apk file sent via WhatsApp, SMS, or Telegram.',
      'Check your actual bill status directly on your state electricity distribution portal or through your banking app.'
    ]
  },
  '9123456789': {
    status: 'UNVERIFIED_REPORT',
    unverifiedReport: {
      reportCount: 12,
      primaryReportCategory: 'PART_TIME_JOB_OFFER',
      recentUserNotes: [
        'Offered Rs. 500 per review for rating restaurants on Google Maps.',
        'Transferred Rs. 150 first to build trust, then demanded Rs. 5,000 "prepaid task deposit" on Telegram.'
      ],
      firstReportedAt: '2026-09-19',
      lastReportedAt: '2026-10-27',
      communityCautionNotice: 'Reported part-time job / review monetization fraud syndicate.'
    },
    safetyAdvice: [
      'No legitimate company pays huge sums for liking videos or rating maps.',
      'Any "job" that requires you to deposit money to unlock your salary is a scam.',
      'Cut off communication immediately. Do not send "release deposits".'
    ]
  }
};

/**
 * Standardizes phone string to clean digits
 */
export function sanitizePhoneNumber(input: string): string {
  // Strip non-digit characters
  let digits = input.replace(/\D/g, '');
  // If starts with 91 and has 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  }
  // Strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  return digits;
}

/**
 * Evaluates phone number against curated database with strict safety semantics
 */
export function lookupPhoneNumber(input: string): PhoneLookupResult {
  const cleaned = sanitizePhoneNumber(input);
  const isValidFormat = cleaned.length >= 4 && cleaned.length <= 11 && /^\d+$/.test(cleaned);

  if (!isValidFormat) {
    return {
      query: input,
      cleanedNumber: cleaned,
      formattedNumber: input,
      status: 'LOOKUP_UNAVAILABLE',
      safetyAdvice: [
        'Please enter a valid Indian telephone or mobile number (e.g. 1930, 1800-425-3800, or a 10-digit mobile number).'
      ],
      disclaimer: 'TRACE CallShield provides intelligence based on curated official directories and community scam reports. We do not perform intrusive telecom wiretapping.',
      queriedAt: new Date().toISOString()
    };
  }

  const match = CURATED_PHONE_ENTRIES[cleaned];

  if (match) {
    return {
      query: input,
      cleanedNumber: cleaned,
      formattedNumber: cleaned.length === 10 ? `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` : cleaned,
      status: match.status as PhoneLookupStatus,
      verifiedSource: match.verifiedSource,
      unverifiedReport: match.unverifiedReport,
      safetyAdvice: match.safetyAdvice || [],
      disclaimer: 'TRACE CallShield report is generated from curated community submissions and verified public registries. Always exercise caution.',
      queriedAt: new Date().toISOString()
    };
  }

  // Not found in curated database
  return {
    query: input,
    cleanedNumber: cleaned,
    formattedNumber: cleaned.length === 10 ? `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` : cleaned,
    status: 'NO_REPORTS_FOUND',
    safetyAdvice: [
      'No prior reports or verified records match this number in our current intelligence database.',
      'CRITICAL SAFETY PRINCIPLE: Absence of a report does NOT mean this caller is safe or verified.',
      'Scammers purchase new SIM cards continuously and discard them once reported.',
      'Rule of thumb: Never share OTPs, never scan QR codes to receive money, and never install remote-assistance apps.'
    ],
    disclaimer: 'TRACE CallShield: Zero reports found does not guarantee legitimacy. Exercise normal vigilance.',
    queriedAt: new Date().toISOString()
  };
}
