from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["Protect Me Consumer Shield"])

# Curated reference phone records for anti-fraud CallShield lookup
PHONE_DATABASE = {
    "+18005550199": {
        "status": "VERIFIED_SOURCE",
        "verifiedSource": {
            "entityName": "First National Customer Care",
            "category": "BANK_OFFICIAL",
            "badgeText": "Verified Official Bank Line",
            "registeredDomain": "firstnational.com",
            "safetyGuidance": "This is an official inbound line for First National. Staff will never ask for PIN or OTP."
        }
    },
    "+18882422100": {
        "status": "VERIFIED_SOURCE",
        "verifiedSource": {
            "entityName": "National Cyber Crime Helpline",
            "category": "GOVERNMENT_AGENCY",
            "badgeText": "Verified Government Helpline",
            "registeredDomain": "cybercrime.gov",
            "safetyGuidance": "Official citizen assistance helpline. Never transfers calls to private payment apps."
        }
    },
    "+18004321000": {
        "status": "VERIFIED_SOURCE",
        "verifiedSource": {
            "entityName": "Metro Power & Utility Co.",
            "category": "UTILITY_PROVIDER",
            "badgeText": "Verified Utility Provider",
            "registeredDomain": "metropowerservice.com",
            "safetyGuidance": "Legitimate utility number. Does not demand immediate payment via prepaid cards or crypto."
        }
    },
    "+19175550143": {
        "status": "UNVERIFIED_REPORT",
        "unverifiedReport": {
            "reportCount": 47,
            "firstReportedDate": "2026-09-12",
            "lastReportedDate": "2026-10-27",
            "commonTags": ["Electricity Disconnection Scam", "Demands Crypto", "Impersonating Utility Agent"],
            "topReportedNames": ["Metro Power Billing Agent", "Urgent Cutoff Department"],
            "safetyWarning": "High scam density! 47 citizens reported receiving threats of immediate power disconnection."
        }
    },
    "+14155550188": {
        "status": "UNVERIFIED_REPORT",
        "unverifiedReport": {
            "reportCount": 118,
            "firstReportedDate": "2026-08-01",
            "lastReportedDate": "2026-10-28",
            "commonTags": ["Task / Job Scam", "Telegram Refund Bot", "Part-time Review Scheme"],
            "topReportedNames": ["HR Hiring Director", "Global E-Commerce Tasks"],
            "safetyWarning": "Critical fraud report! Linked to daily payment task scam rings."
        }
    }
}


class ManualTransactionInput(BaseModel):
    amount: float
    senderAccountOrVpa: str = "ACC-CURRENT-USER"
    receiverAccountOrVpa: str
    receiverName: Optional[str] = None
    receiverPhone: Optional[str] = None
    paymentMethod: str = "ONLINE"
    note: Optional[str] = None


@router.get("/phone-lookup")
def phone_lookup(number: str = Query(..., description="Phone number with country code, e.g. +18005550199")):
    clean_num = number.strip().replace(" ", "").replace("-", "")
    if clean_num in PHONE_DATABASE:
        return {"queryNumber": number, **PHONE_DATABASE[clean_num]}
    
    # Generic unverified clean number
    return {
        "queryNumber": number,
        "status": "NO_REPORTS_FOUND",
        "neutralNotice": {
            "text": "No citizen scam reports found for this phone number.",
            "safetyAdvice": "Clean record does not guarantee safety. Never share one-time PINs or send money under pressure."
        }
    }


@router.post("/detect/evaluate")
def evaluate_manual_transaction(input_data: ManualTransactionInput):
    """
    Evaluates a consumer's pending transfer against TRACE fraud rules before submission.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    txn_id = f"TXN-PREVIEW-{int(datetime.now(timezone.utc).timestamp())}"
    
    risk_score = 12.0
    risk_level = "LOW"
    flags = []
    evidence_list = []
    
    note_lower = (input_data.note or "").lower()
    
    # Rule 1: High-pressure keyword analysis
    scam_keywords = ["refund", "fee", "electricity", "task", "urgent", "kyc", "fine", "penalty"]
    matched_words = [kw for kw in scam_keywords if kw in note_lower]
    if matched_words:
        risk_score += 45.0
        flags.append("SUSPICIOUS_KEYWORD_IN_NOTE")
        evidence_list.append({
            "id": f"EVD-{txn_id}-1",
            "category": "BEHAVIORAL_ANOMALY",
            "severity": "HIGH",
            "headline": f"Urgency Keywords Detected ({', '.join(matched_words)})",
            "detail": f"Transfer memo contains keywords '{input_data.note}' commonly associated with social engineering scams.",
            "confidenceScore": 0.88
        })

    # Rule 2: Receiver phone check
    if input_data.receiverPhone:
        clean_p = input_data.receiverPhone.strip().replace(" ", "").replace("-", "")
        if clean_p in PHONE_DATABASE and PHONE_DATABASE[clean_p]["status"] == "UNVERIFIED_REPORT":
            risk_score += 40.0
            flags.append("RECIPIENT_PHONE_REPORTED_IN_CALLSHIELD")
            report = PHONE_DATABASE[clean_p]["unverifiedReport"]
            evidence_list.append({
                "id": f"EVD-{txn_id}-2",
                "category": "KNOWN_SCAMMER_PATTERN",
                "severity": "CRITICAL",
                "headline": f"Recipient Phone Flagged ({report['reportCount']} Citizen Reports)",
                "detail": f"Phone number {input_data.receiverPhone} is linked to citizen fraud reports.",
                "confidenceScore": 0.94
            })

    # Rule 3: Amount thresholds
    if input_data.amount >= 20000.0:
        risk_score += 25.0
        flags.append("HIGH_VALUE_OUTFLOW")
        evidence_list.append({
            "id": f"EVD-{txn_id}-3",
            "category": "HIGH_VALUE_OUTFLOW",
            "severity": "HIGH",
            "headline": f"High Value Transfer (${input_data.amount:,.2f})",
            "detail": "Transfer exceeds standard high-value threshold.",
            "confidenceScore": 0.75
        })

    risk_score = min(risk_score, 100.0)
    if risk_score >= 80:
        risk_level = "CRITICAL"
    elif risk_score >= 60:
        risk_level = "HIGH"
    elif risk_score >= 35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "transaction": {
            "id": txn_id,
            "timestamp": now_iso,
            "amount": input_data.amount,
            "currency": "USD",
            "senderAccountOrVpa": input_data.senderAccountOrVpa,
            "receiverAccountOrVpa": input_data.receiverAccountOrVpa,
            "paymentMethod": input_data.paymentMethod,
            "status": "FLAGGED" if risk_score >= 60 else "COMPLETED",
            "note": input_data.note,
        },
        "detectionResult": {
            "overallRiskScore": risk_score,
            "riskLevel": risk_level,
            "plainLanguageExplanation": (
                f"Evaluation completed with priority score {risk_score:.0f}/100. "
                + ("Multiple risk indicators triggered review recommendations." if risk_score >= 60 else "Transaction aligns with safe parameters.")
            ),
            "evidenceList": evidence_list,
            "ruleHits": flags,
        }
    }
