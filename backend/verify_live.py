import json
import subprocess
import time
import urllib.request
import sys


def main():
    print("Starting backend and frontend services...")

    b_proc = subprocess.Popen(
        ["backend/venv/Scripts/python.exe", "-m", "uvicorn", "app.main:app", "--port", "8000"],
        cwd="backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    f_proc = subprocess.Popen(
        ["node", "node_modules/vite/bin/vite.js", "--port", "5173", "--host", "127.0.0.1"],
        cwd="frontend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    time.sleep(4)

    results = {}
    try:
        # 1. Probe frontend root
        with urllib.request.urlopen("http://127.0.0.1:5173/") as resp:
            html = resp.read().decode()
            results["frontend_http_status"] = resp.status
            results["frontend_has_root_element"] = '<div id="root"></div>' in html
            results["frontend_references_main_tsx"] = '/src/main.tsx' in html

        # 2. Probe frontend Vite module compilation
        with urllib.request.urlopen("http://127.0.0.1:5173/src/main.tsx") as resp:
            tsx = resp.read().decode()
            results["frontend_compiles_main_tsx"] = "createRoot" in tsx

        # 3. Probe frontend proxy to backend /api/health
        with urllib.request.urlopen("http://127.0.0.1:5173/api/health") as resp:
            health = json.loads(resp.read().decode())
            results["vite_proxy_to_backend_health"] = health.get("status")

        # 4. Probe frontend proxy to backend /api/alerts
        with urllib.request.urlopen("http://127.0.0.1:5173/api/alerts") as resp:
            alerts = json.loads(resp.read().decode())
            results["vite_proxy_alerts_count"] = len(alerts)

        # 5. Probe direct backend case detail
        with urllib.request.urlopen("http://127.0.0.1:8000/api/cases/CASE-STRUC-ACC-101") as resp:
            case_detail = json.loads(resp.read().decode())
            results["case_id"] = case_detail.get("case_id")
            results["case_transactions_count"] = len(case_detail.get("transactions", []))
            results["case_evidence_count"] = len(case_detail.get("alert", {}).get("evidence", []))

        print("\n=== LIVE INTEGRATION VERIFICATION REPORT ===")
        for k, v in results.items():
            print(f"  {k}: {v}")
        print("=== END REPORT ===\n")

    except Exception as e:
        print(f"Error during verification: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        f_proc.terminate()
        b_proc.terminate()
        f_proc.wait(timeout=5)
        b_proc.wait(timeout=5)


if __name__ == "__main__":
    main()
