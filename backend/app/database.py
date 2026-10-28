import os
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional
from app.models.contracts import InvestigationNote, InvestigationNoteCreate, CaseStatusUpdate

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "trace.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the SQLite tables for persistent investigation notes and statuses."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigation_notes (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        alert_id TEXT,
        author TEXT NOT NULL,
        note TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        status_change TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_statuses (
        case_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        author TEXT NOT NULL,
        reason TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('analyst', 'consumer')),
        full_name TEXT NOT NULL,
        account_id TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Seed default demonstration users if not present
    import hashlib
    def _hash_pw(pw: str) -> str:
        return hashlib.sha256((pw + "trace_salt_v2").encode()).hexdigest()

    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        now_str = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, role, full_name, account_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "analyst",
                "lead.analyst@trace-intelligence.internal",
                _hash_pw("password123"),
                "analyst",
                "Lead Financial Crime Analyst",
                None,
                now_str,
            ),
        )
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, role, full_name, account_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "consumer",
                "verified.consumer@trace.safety",
                _hash_pw("password123"),
                "consumer",
                "Jane Batch (Verified Consumer)",
                "ACC-101",
                now_str,
            ),
        )

    conn.commit()
    conn.close()


def add_investigation_note(note_data: InvestigationNoteCreate) -> InvestigationNote:
    conn = get_db_connection()
    cursor = conn.cursor()

    note_id = f"NOTE-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO investigation_notes (id, case_id, alert_id, author, note, timestamp, status_change)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            note_id,
            note_data.case_id,
            note_data.alert_id,
            note_data.author,
            note_data.note,
            now_iso,
            note_data.status_change,
        ),
    )

    # If status change is included, also update case status
    if note_data.status_change:
        cursor.execute(
            """
            INSERT INTO case_statuses (case_id, status, updated_at, author, reason)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(case_id) DO UPDATE SET
                status = excluded.status,
                updated_at = excluded.updated_at,
                author = excluded.author,
                reason = excluded.reason
            """,
            (
                note_data.case_id,
                note_data.status_change,
                now_iso,
                note_data.author,
                f"Status updated via note: {note_data.note[:60]}",
            ),
        )

    # Record history
    cursor.execute(
        """
        INSERT INTO case_history (case_id, action, details, author, timestamp)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            note_data.case_id,
            "NOTE_ADDED",
            note_data.note,
            note_data.author,
            now_iso,
        ),
    )

    conn.commit()
    conn.close()

    return InvestigationNote(
        id=note_id,
        case_id=note_data.case_id,
        alert_id=note_data.alert_id,
        author=note_data.author,
        note=note_data.note,
        timestamp=now_iso,
        status_change=note_data.status_change,
    )


def get_investigation_notes(case_id: str) -> List[InvestigationNote]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, case_id, alert_id, author, note, timestamp, status_change
        FROM investigation_notes
        WHERE case_id = ?
        ORDER BY timestamp ASC
        """,
        (case_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    return [
        InvestigationNote(
            id=row["id"],
            case_id=row["case_id"],
            alert_id=row["alert_id"],
            author=row["author"],
            note=row["note"],
            timestamp=row["timestamp"],
            status_change=row["status_change"],
        )
        for row in rows
    ]


def update_case_status(update: CaseStatusUpdate) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO case_statuses (case_id, status, updated_at, author, reason)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(case_id) DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at,
            author = excluded.author,
            reason = excluded.reason
        """,
        (update.case_id, update.status, now_iso, update.author, update.reason or ""),
    )

    cursor.execute(
        """
        INSERT INTO case_history (case_id, action, details, author, timestamp)
        VALUES (?, ?, ?, ?, ?)
        """,
        (update.case_id, "STATUS_CHANGE", f"Changed status to {update.status}. Reason: {update.reason}", update.author, now_iso),
    )

    conn.commit()
    conn.close()

    return {
        "case_id": update.case_id,
        "status": update.status,
        "updated_at": now_iso,
        "author": update.author,
        "reason": update.reason,
    }


def get_case_status(case_id: str) -> Optional[str]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT status FROM case_statuses WHERE case_id = ?", (case_id,))
    row = cursor.fetchone()
    conn.close()

    return row["status"] if row else None


def get_case_history(case_id: str) -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, case_id, action, details, author, timestamp
        FROM case_history
        WHERE case_id = ?
        ORDER BY timestamp ASC
        """,
        (case_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def hash_password(password: str) -> str:
    import hashlib
    return hashlib.sha256((password + "trace_salt_v2").encode()).hexdigest()


def create_user(username: str, email: str, password: str, role: str, full_name: str, account_id: Optional[str] = None) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    pw_hash = hash_password(password)

    try:
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, role, full_name, account_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (username.lower().strip(), email.lower().strip(), pw_hash, role, full_name.strip(), account_id or "ACC-101", now_iso),
        )
        user_id = cursor.lastrowid
        conn.commit()
    finally:
        conn.close()

    return {
        "id": user_id,
        "username": username.lower().strip(),
        "email": email.lower().strip(),
        "role": role,
        "full_name": full_name.strip(),
        "account_id": account_id or "ACC-101",
    }


def authenticate_user(identifier: str, password: str) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    pw_hash = hash_password(password)
    ident = identifier.lower().strip()

    cursor.execute(
        """
        SELECT id, username, email, password_hash, role, full_name, account_id
        FROM users
        WHERE (username = ? OR email = ?) AND password_hash = ?
        """,
        (ident, ident, pw_hash),
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
            "full_name": row["full_name"],
            "account_id": row["account_id"],
        }
    return None

