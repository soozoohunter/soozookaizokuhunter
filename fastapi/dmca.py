import os
import psycopg2

DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME
    )

def bulk_infringement_check(urls):
    """
    批量檢查是否有侵權(示例)
    """
    results = []
    conn = get_db_connection()
    cur = conn.cursor()
    for u in urls:
        # 以 param query 避免注入
        cur.execute("SELECT id FROM works WHERE cloudinaryUrl = %s", (u,))
        row = cur.fetchone()
        if row:
            results.append({
                "url": u,
                "infringed": True,
                "workId": row[0]
            })
        else:
            results.append({
                "url": u,
                "infringed": False,
                "workId": None
            })
    cur.close()
    conn.close()
    return results

def initiate_lawsuit(work_id):
    """
    參數化查詢
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM works WHERE id = %s", (work_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return "Work not found, cannot initiate lawsuit."

    # 假設記錄到 lawsuit table
    cur.execute("INSERT INTO lawsuits(work_id, status) VALUES (%s, %s) RETURNING id", (work_id, 'pending'))
    lawsuit_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return f"Lawsuit initiated with ID={lawsuit_id}."
