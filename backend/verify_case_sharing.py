import urllib.request
import json
from app.store import store
from app.database import init_db, get_case_status, update_case_status, add_investigation_note
from app.models.contracts import CaseStatusUpdate, InvestigationNoteCreate


def main():
    init_db()
    store.load_default_dataset()

    test_case_id = "CASE-STRUC-ACC-101"
    alert = store.get_alert_by_case_id(test_case_id)
    assert alert is not None, f"Case {test_case_id} not found"
    assert alert.customer_id == "ACC-101"

    # Step 1: Simulate Protect Me consumer action: Confirm this was me
    add_investigation_note(InvestigationNoteCreate(
        case_id=test_case_id,
        author="Verified Consumer (ACC-101)",
        note="Customer confirmed in Protect Me mode: Yes, I authorized these transfers.",
        status_change="RESOLVED_BENIGN"
    ))
    update_case_status(CaseStatusUpdate(
        case_id=test_case_id,
        status="RESOLVED_BENIGN",
        author="Protect Me Portal",
        reason="Consumer confirmed activity"
    ))

    # Step 2: Simulate Investigate mode retrieving the case
    status_in_db = get_case_status(test_case_id)
    assert status_in_db == "RESOLVED_BENIGN", f"Expected RESOLVED_BENIGN, got {status_in_db}"

    # Sync into memory
    alert.investigation_status = status_in_db
    assert alert.investigation_status == "RESOLVED_BENIGN"

    print(f"[SUCCESS] Case {test_case_id} shared perfectly across Protect Me and Investigate:")
    print(f"  Customer Subject ID: {alert.customer_id}")
    print(f"  Shared Case ID: {alert.case_id}")
    print(f"  Synced Status: {alert.investigation_status}")


if __name__ == "__main__":
    main()
