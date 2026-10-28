import os
from app.ai.explainer import generate_trace_ai_explanation
from app.store import store


def main():
    # Explicitly verify fallback when API key is completely absent
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]

    store.load_default_dataset()
    alert = store.get_alert_by_case_id("CASE-STRUC-ACC-101")
    txs = store.get_transactions_for_case("CASE-STRUC-ACC-101")

    assert alert is not None
    assert len(txs) == 4

    print("Testing TRACE AI Explainer in INVESTIGATE mode (without Gemini API key)...")
    res_inv = generate_trace_ai_explanation(alert, txs, mode="investigate")
    assert "Deterministic" in res_inv.engine_used
    assert len(res_inv.observations) >= 2
    assert len(res_inv.inferences) >= 2
    assert len(res_inv.limitations) >= 1
    assert len(res_inv.recommended_actions) >= 3
    assert res_inv.disclaimer

    print("Testing TRACE AI Explainer in PROTECT_ME mode (without Gemini API key)...")
    res_prot = generate_trace_ai_explanation(alert, txs, mode="protect_me")
    assert "Deterministic" in res_prot.engine_used
    assert "Security Notice" in res_prot.headline or "Review activity" in res_prot.headline
    assert len(res_prot.observations) >= 2
    assert len(res_prot.inferences) >= 1
    assert len(res_prot.recommended_actions) >= 3

    print("\n[SUCCESS] TRACE AI Fallback engine verified working without Gemini API key:")
    print(f"  Investigate Headline: {res_inv.headline}")
    print(f"  Investigate Engine: {res_inv.engine_used}")
    print(f"  Protect Me Headline: {res_prot.headline}")
    print(f"  Protect Me Engine: {res_prot.engine_used}")


if __name__ == "__main__":
    main()
