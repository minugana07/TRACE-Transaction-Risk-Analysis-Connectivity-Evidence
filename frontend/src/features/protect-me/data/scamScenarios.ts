/**
 * TRACE - Transaction Risk Analysis, Connectivity & Evidence
 * ScamShield Interactive Educational Scenarios
 * 
 * Fictional scenarios designed to teach safe digital payment habits.
 * Never asks for real credentials or real payments.
 */

import { ScamScenario } from '../contracts/scamShield';

export const SCAM_SCENARIOS: ScamScenario[] = [
  {
    id: 'SCAM-01-UPI-COLLECT',
    scamType: 'UPI_COLLECT',
    title: 'The "Enter PIN to Receive Money" Trick',
    shortSummary: 'A buyer on an online marketplace offers advance payment via QR code or collect request.',
    realWorldContext: 'You listed an old sofa or bicycle on an online marketplace. Within minutes, an enthusiastic buyer agrees to pay full price without negotiating and insists on paying via UPI immediately.',
    channel: 'WHATSAPP',
    fictionalMessages: [
      {
        id: 'M1',
        sender: 'scammer',
        senderName: 'Buyer (Ramesh)',
        avatarText: 'RB',
        text: 'Sir, I am transferring the full Rs. 6,500 advance for the sofa right now. I have sent an authorization request to your Google Pay / PhonePe.',
        timestamp: '10:14 AM'
      },
      {
        id: 'M2',
        sender: 'system',
        senderName: 'Simulated Notification',
        avatarText: '⚠️',
        text: 'Incoming Payment Request: Ramesh Kumar has requested Rs. 6,500. [Decline] [Pay - Enter UPI PIN]',
        timestamp: '10:15 AM',
        highlightedPhrase: 'has requested Rs. 6,500'
      },
      {
        id: 'M3',
        sender: 'scammer',
        senderName: 'Buyer (Ramesh)',
        avatarText: 'RB',
        text: 'Sir, hurry! Open your app, tap Pay and type your 6-digit UPI PIN. The government gateway will instantly credit Rs. 6,500 into your account!',
        timestamp: '10:15 AM',
        highlightedPhrase: 'tap Pay and type your 6-digit UPI PIN'
      }
    ],
    warningSigns: [
      {
        phrase: 'Entering PIN to receive money',
        explanation: 'GOLDEN RULE: You NEVER need to enter your UPI PIN to receive money. PIN is solely required to debit (send) money out of your bank.'
      },
      {
        phrase: 'Incoming "Collect / Pay" request disguised as a deposit',
        explanation: 'Scammers send a debit request hoping you assume clicking "Pay" means receiving payment.'
      },
      {
        phrase: 'High urgency ("Hurry, it will expire")',
        explanation: 'Scammers rush victims so they don\'t stop to read the screen carefully.'
      }
    ],
    decisionPrompt: 'What should you do right now?',
    decisionOptions: [
      {
        id: 'OPT-1',
        text: 'Tap "Pay" and enter my UPI PIN so the money gets deposited into my account.',
        isSafe: false,
        immediateFeedback: 'DANGER! You would lose Rs. 6,500 immediately.',
        explanation: 'Tapping Pay and entering your UPI PIN authorizes your bank to transfer Rs. 6,500 to the scammer. Money cannot be received by typing your PIN.'
      },
      {
        id: 'OPT-2',
        text: 'Send him a QR code instead, but follow his instructions if he sends another link.',
        isSafe: false,
        immediateFeedback: 'RISKY! Scammers use alternate tricks once they know you are engaged.',
        explanation: 'Sending QR codes or chatting further keeps you exposed to social engineering.'
      },
      {
        id: 'OPT-3',
        text: 'Tap "Decline", block the caller, and never enter any PIN.',
        isSafe: true,
        immediateFeedback: 'CORRECT! You saved yourself from an instant financial loss.',
        explanation: 'Rejecting the request protects your bank balance. Legitimate buyers can transfer funds directly to your phone number or UPI ID without you needing to do anything.'
      }
    ],
    explainBack: {
      question: 'Which of the following statements about UPI PIN is 100% TRUE?',
      promptGuidance: 'Think about how bank transfers work in India:',
      options: [
        {
          id: 'EB-1',
          text: 'You must enter your UPI PIN whenever receiving money from a new contact.',
          isCorrect: false,
          feedback: 'Incorrect. Entering a PIN is never needed to receive money from anyone.'
        },
        {
          id: 'EB-2',
          text: 'UPI PIN is strictly a debit authorization password. Entering it always moves money OUT of your account.',
          isCorrect: true,
          feedback: 'Spot on! Memorize this rule: "PIN is for spending, not for receiving."'
        },
        {
          id: 'EB-3',
          text: 'Scanning a QR code is required to verify your bank account for incoming refunds.',
          isCorrect: false,
          feedback: 'Incorrect. QR codes are strictly payment destinations, not incoming verifications.'
        }
      ],
      keyRuleToRemember: 'Rule #1: Receiving money is 100% passive. If an app or person asks for your UPI PIN, money is leaving your account.'
    },
    safeNextSteps: [
      'Decline any collect requests immediately in your UPI application.',
      'Report the profile on the marketplace platform.',
      'Never share your screen or install apps suggested by buyers.',
      'If you accidentally entered your PIN, call 1930 and your bank immediately to block your account.'
    ]
  },
  {
    id: 'SCAM-02-UTILITY-BILL',
    scamType: 'UTILITY_BILL',
    title: 'The "Electricity Power Cut Tonight" Threat',
    shortSummary: 'An urgent SMS warns your power will be disconnected at 9:30 PM unless you call a private mobile number.',
    realWorldContext: 'At 7:45 PM on a hot summer evening, you receive an alarming SMS claiming your previous month power bill is unpaid and technicians are scheduled to cut your power in 90 minutes.',
    channel: 'SMS',
    fictionalMessages: [
      {
        id: 'M1',
        sender: 'scammer',
        senderName: 'Unknown Mobile (+91 9899887766)',
        avatarText: '⚡',
        text: 'Dear Consumer, Your Electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer at 9899887766.',
        timestamp: '7:45 PM',
        highlightedPhrase: 'disconnected tonight at 9:30 PM'
      },
      {
        id: 'M2',
        sender: 'scammer',
        senderName: 'Fake Power Officer (Phone Call)',
        avatarText: '⚡',
        text: 'Sir, your payment didn\'t sync with our server. Just download our official quick-update support app "Bijli_Service.apk" so we can refresh your meter token.',
        timestamp: '7:50 PM',
        highlightedPhrase: 'download our official quick-update support app "Bijli_Service.apk"'
      }
    ],
    warningSigns: [
      {
        phrase: 'Personal mobile number for official electricity board',
        explanation: 'State utility companies (e.g. BSES, TNEB, MSEDCL, BESCOM) send official SMS from verified government headers (like VK-BSESDL or VM-MSEDCL), never from standard 10-digit mobile numbers.'
      },
      {
        phrase: 'Asking to install an ".apk" file or screen-sharing app',
        explanation: 'Any request to install an APK file from a message or WhatsApp is MALWARE designed to steal SMS OTPs and control your device.'
      },
      {
        phrase: 'Threat of night-time disconnection',
        explanation: 'Electricity regulations in India prohibit disconnecting residential power lines at night without prior written statutory notice.'
      }
    ],
    decisionPrompt: 'How should you respond to this message?',
    decisionOptions: [
      {
        id: 'OPT-1',
        text: 'Download the APK file so the officer can update my meter quickly before 9:30 PM.',
        isSafe: false,
        immediateFeedback: 'CRITICAL DANGER! The APK will grant remote access and drain your bank account.',
        explanation: 'APK files outside official app stores (Google Play) are almost always Trojan malware designed to read your banking OTPs.'
      },
      {
        id: 'OPT-2',
        text: 'Transfer Rs. 100 to the officer\'s personal UPI number just to be safe.',
        isSafe: false,
        immediateFeedback: 'DO NOT DO THIS! Government departments never collect payments to personal UPI handles.',
        explanation: 'Sending money to private UPI IDs rewards scammers and confirms your number is an active target.'
      },
      {
        id: 'OPT-3',
        text: 'Ignore the SMS, delete any APK links, and check my real bill directly on the official power company website or banking app.',
        isSafe: true,
        immediateFeedback: 'EXCELLENT CHOICE! You avoided a major cyber intrusion.',
        explanation: 'Checking your genuine electricity portal or Bharat BillPay (BBPS) gives you the accurate bill status without any risk.'
      }
    ],
    explainBack: {
      question: 'Why do scammers urge victims to install an APK file or quick-support app?',
      promptGuidance: 'Consider what permissions mobile apps request:',
      options: [
        {
          id: 'EB-1',
          text: 'Because the electricity department servers are too old to work with web browsers.',
          isCorrect: false,
          feedback: 'False. Utility boards have secure web portals and BBPS integrations.'
        },
        {
          id: 'EB-2',
          text: 'The APK file is spyware that secretly intercepts incoming bank OTPs and gives scammers control of your phone.',
          isCorrect: true,
          feedback: 'Correct! Malicious APKs forward your incoming OTP messages straight to cybercriminals.'
        },
        {
          id: 'EB-3',
          text: 'To make sure you get a digital receipt faster.',
          isCorrect: false,
          feedback: 'False. Receipts are issued via email or standard portal downloads.'
        }
      ],
      keyRuleToRemember: 'Rule #2: Never install an .apk file sent by someone over WhatsApp, SMS, or Telegram.'
    },
    safeNextSteps: [
      'Check your actual bill on your authorized banking app or state electricity board website.',
      'Report the sender mobile number on the Sanchar Saathi "Chakshu" portal.',
      'If you already installed an APK file, immediately turn on Airplane Mode, uninstall the app, and format the phone.'
    ]
  },
  {
    id: 'SCAM-03-TASK-INVESTMENT',
    scamType: 'TASK_INVESTMENT',
    title: 'The "Part-Time Review Task / Telegram Job" Trap',
    shortSummary: 'Earn Rs. 3,000 daily by simply liking YouTube videos or rating Google Maps hotels, leading to high-deposit extortion.',
    realWorldContext: 'You receive a WhatsApp message from an HR recruiter offering flexible work from home with guaranteed daily payouts.',
    channel: 'TELEGRAM',
    fictionalMessages: [
      {
        id: 'M1',
        sender: 'scammer',
        senderName: 'HR Recruiter Pooja',
        avatarText: 'PJ',
        text: 'Hello! Our global marketing agency is hiring part-time assistants. Just like 3 YouTube videos and submit screenshots to earn Rs. 150 immediately.',
        timestamp: '11:00 AM'
      },
      {
        id: 'M2',
        sender: 'user',
        senderName: 'You (Curious)',
        avatarText: 'ME',
        text: 'Okay, I took screenshots and sent them.',
        timestamp: '11:05 AM'
      },
      {
        id: 'M3',
        sender: 'system',
        senderName: 'Bank SMS',
        avatarText: '🏦',
        text: 'Your account has been credited with INR 150.00 via IMPS.',
        timestamp: '11:07 AM'
      },
      {
        id: 'M4',
        sender: 'scammer',
        senderName: 'Telegram Group Admin',
        avatarText: 'ADM',
        text: 'Great job! You made Rs. 150! Now for VIP Task 2, you must deposit Rs. 5,000 security prepaid fee. You will receive Rs. 8,500 return in 20 minutes!',
        timestamp: '11:15 AM',
        highlightedPhrase: 'you must deposit Rs. 5,000 security prepaid fee'
      }
    ],
    warningSigns: [
      {
        phrase: 'Small initial payout to build false trust',
        explanation: 'Scammers deliberately send Rs. 150 or Rs. 200 of stolen money upfront so you believe the system is genuine.'
      },
      {
        phrase: 'Paying money to get paid for a job',
        explanation: 'No legitimate employer or freelancing platform asks candidates to deposit "security fees" or "prepaid task funds".'
      },
      {
        phrase: 'Fake Telegram dashboards with artificially inflating balances',
        explanation: 'Scammers display fake websites showing your "earnings" increasing, but every attempt to withdraw triggers demands for more tax/release deposits.'
      }
    ],
    decisionPrompt: 'You received the initial Rs. 150, and the admin asks for Rs. 5,000. What is your best action?',
    decisionOptions: [
      {
        id: 'OPT-1',
        text: 'Deposit Rs. 5,000. Since they already paid Rs. 150, they are obviously trustworthy.',
        isSafe: false,
        immediateFeedback: 'TRAPPED! You will never get that Rs. 5,000 back.',
        explanation: 'The Rs. 150 was bait. Once you deposit Rs. 5,000, they will demand Rs. 25,000 and then Rs. 1,00,000 to "unlock" your funds.'
      },
      {
        id: 'OPT-2',
        text: 'Stop immediately, exit and report the Telegram group, and do not send a single rupee.',
        isSafe: true,
        immediateFeedback: 'SMART MOVE! You recognized the classic task-fraud funnel.',
        explanation: 'Walking away immediately prevents substantial financial ruin. Legitimate jobs never charge candidates to work.'
      },
      {
        id: 'OPT-3',
        text: 'Ask the group members if they received their money before sending your deposit.',
        isSafe: false,
        immediateFeedback: 'BEWARE! All the other members in the group are scam accomplices or fake bots.',
        explanation: 'Scammers populate these groups with fake accounts posting fabricated bank withdrawal screenshots.'
      }
    ],
    explainBack: {
      question: 'What is the primary psychological purpose of the initial small payment (e.g. Rs. 150)?',
      promptGuidance: 'Why would a scammer give you money first?',
      options: [
        {
          id: 'EB-1',
          text: 'To demonstrate company compliance with international labor laws.',
          isCorrect: false,
          feedback: 'False. There are no such laws.'
        },
        {
          id: 'EB-2',
          text: 'It is a small bait investment to gain your trust before defrauding you of thousands of rupees.',
          isCorrect: true,
          feedback: 'Exactly right! It is known as the "bait-and-bleed" tactic.'
        },
        {
          id: 'EB-3',
          text: 'It is a technical test of your bank account bandwidth.',
          isCorrect: false,
          feedback: 'False. Bank bandwidth does not exist for consumer accounts.'
        }
      ],
      keyRuleToRemember: 'Rule #3: Any job that requires you to invest or deposit money to work is an investment scam.'
    },
    safeNextSteps: [
      'Leave and block the Telegram / WhatsApp group immediately.',
      'Do not attempt to recover funds by sending further "clearance" deposits.',
      'Report the incident on cybercrime.gov.in (Helpline 1930).'
    ]
  },
  {
    id: 'SCAM-04-URGENT-FRIEND',
    scamType: 'URGENT_FRIEND',
    title: 'The "Emergency Hospital / Stranded Friend" Impersonation',
    shortSummary: 'A WhatsApp message from an unknown number uses a friend\'s photo claiming an urgent medical crisis.',
    realWorldContext: 'You get a message from an unfamiliar number displaying your close college friend\'s profile photo and name.',
    channel: 'WHATSAPP',
    fictionalMessages: [
      {
        id: 'M1',
        sender: 'scammer',
        senderName: 'Friend\'s Photo ("Vikram")',
        avatarText: 'VK',
        text: 'Hey buddy, this is Vikram. My phone was smashed in an auto accident, so I am texting from this temporary hospital number. Please help me, I am in severe trouble!',
        timestamp: '3:20 PM'
      },
      {
        id: 'M2',
        sender: 'scammer',
        senderName: 'Friend\'s Photo ("Vikram")',
        avatarText: 'VK',
        text: 'The emergency chemist needs Rs. 12,500 immediately for CT scan contrast medicine. My bank app is locked. Please UPI to this chemist UPI: chemist.emergency.pay@icici. I will refund you first thing tomorrow!',
        timestamp: '3:21 PM',
        highlightedPhrase: 'Please UPI to this chemist UPI: chemist.emergency.pay@icici'
      }
    ],
    warningSigns: [
      {
        phrase: 'New unverified number using a known person\'s photo',
        explanation: 'Photos downloaded from social media profiles (Instagram, LinkedIn) are used to create spoof WhatsApp accounts.'
      },
      {
        phrase: 'Extreme emotional distress / hospital emergency',
        explanation: 'Scammers trigger panic to bypass your rational verification filters.'
      },
      {
        phrase: 'Third-party UPI ID',
        explanation: 'The recipient UPI ID belongs to a mule account, not a verified hospital billing desk.'
      }
    ],
    decisionPrompt: 'What should be your very first step?',
    decisionOptions: [
      {
        id: 'OPT-1',
        text: 'Immediately UPI the Rs. 12,500 because life-and-death emergencies cannot wait.',
        isSafe: false,
        immediateFeedback: 'DANGER! You may be sending money to an impersonator.',
        explanation: 'Panicking without checking is the exact psychological reaction the scammer engineered.'
      },
      {
        id: 'OPT-2',
        text: 'Call Vikram\'s original, known phone number or call a mutual friend/family member to verify.',
        isSafe: true,
        immediateFeedback: 'PERFECT! Always verify out-of-band using known contact details.',
        explanation: 'Calling Vikram\'s real number or his family reveals within 30 seconds that he is safe at home and someone stole his picture.'
      },
      {
        id: 'OPT-3',
        text: 'Ask the sender to take a selfie in the hospital room.',
        isSafe: false,
        immediateFeedback: 'RISKY! AI face-swapping and stock medical photos make visual proof deceptive.',
        explanation: 'Scammers routinely use fake medical photos or claim their camera is broken.'
      }
    ],
    explainBack: {
      question: 'What is the "Out-of-Band Verification" principle in cyber safety?',
      promptGuidance: 'How do you reliably verify someone who messages you from a new number?',
      options: [
        {
          id: 'EB-1',
          text: 'Checking if their WhatsApp "About" status contains their nickname.',
          isCorrect: false,
          feedback: 'False. Scammers can copy any text.'
        },
        {
          id: 'EB-2',
          text: 'Contacting the person through an existing, previously verified channel (like their old phone number or family member) rather than the new unverified channel.',
          isCorrect: true,
          feedback: 'Spot on! Out-of-band verification is the single most effective defense against impersonation.'
        },
        {
          id: 'EB-3',
          text: 'Sending Rs. 1 first to see if the name matches.',
          isCorrect: false,
          feedback: 'False. Scammers routinely use bank accounts registered under stolen identities.'
        }
      ],
      keyRuleToRemember: 'Rule #4: Whenever an emergency request comes from a new number, ALWAYS call the person\'s known original number first.'
    },
    safeNextSteps: [
      'Call your friend\'s real existing number directly.',
      'Alert mutual friends if someone is impersonating them.',
      'Never transfer money to third-party UPI IDs without independent verification.'
    ]
  }
];
