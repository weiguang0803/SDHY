"""
SDHY 数据库种子数据导出与初始化工具
- 运行 `python init_db_seed.py`：自动建表并导入基础种子数据（零第三方库依赖，纯 Python 原生支持）
- 运行 `python init_db_seed.py --export`：将当前本地数据库中的种子数据导出为 data/seed_data.json
"""
import sys
import os
import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "sdhy.db"
SEED_FILE = DATA_DIR / "seed_data.json"

TABLES_TO_SEED = [
    "system_settings",
    "users",
    "knowledge_entries",
    "knowledge_reviews",
    "user_learning_profiles"
]

SCHEMA_DDL = """
CREATE TABLE IF NOT EXISTS users (
	id VARCHAR NOT NULL PRIMARY KEY, 
	username VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	display_name VARCHAR, 
	native_language VARCHAR, 
	chinese_level VARCHAR, 
	learning_goals JSON, 
	profile_summary TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	role VARCHAR DEFAULT 'user', 
	email VARCHAR, 
	is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS conversations (
	id VARCHAR NOT NULL PRIMARY KEY, 
	user_id VARCHAR NOT NULL, 
	title VARCHAR, 
	created_at DATETIME, 
	updated_at DATETIME, 
	is_deleted BOOLEAN DEFAULT 0, 
	deleted_at DATETIME, 
	is_favorite BOOLEAN DEFAULT 0, 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS messages (
	id VARCHAR NOT NULL PRIMARY KEY, 
	conversation_id VARCHAR NOT NULL, 
	role VARCHAR NOT NULL, 
	content TEXT NOT NULL, 
	agent_process JSON, 
	intent_type VARCHAR, 
	knowledge_points JSON, 
	created_at DATETIME, 
	multimodal JSON, 
	is_favorite BOOLEAN DEFAULT 0, 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id)
);

CREATE TABLE IF NOT EXISTS system_settings (
	"key" VARCHAR NOT NULL PRIMARY KEY, 
	value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_entries (
	id VARCHAR NOT NULL PRIMARY KEY, 
	word VARCHAR(100) NOT NULL, 
	pinyin VARCHAR(100), 
	category VARCHAR(50), 
	hsk_level VARCHAR(20), 
	tags JSON, 
	text_content JSON, 
	image_content JSON, 
	video_content JSON, 
	status VARCHAR(20), 
	created_by VARCHAR NOT NULL, 
	updated_by VARCHAR, 
	created_at DATETIME, 
	updated_at DATETIME, 
	FOREIGN KEY(created_by) REFERENCES users (id), 
	FOREIGN KEY(updated_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS knowledge_reviews (
	id VARCHAR NOT NULL PRIMARY KEY, 
	entry_id VARCHAR NOT NULL, 
	applicant_id VARCHAR NOT NULL, 
	reviewer_id VARCHAR, 
	action VARCHAR(20) NOT NULL, 
	comment TEXT, 
	snapshot JSON, 
	created_at DATETIME, 
	FOREIGN KEY(entry_id) REFERENCES knowledge_entries (id), 
	FOREIGN KEY(applicant_id) REFERENCES users (id), 
	FOREIGN KEY(reviewer_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS conversation_summaries (
	id VARCHAR NOT NULL PRIMARY KEY, 
	conversation_id VARCHAR NOT NULL, 
	user_id VARCHAR NOT NULL, 
	summary_text TEXT NOT NULL, 
	key_knowledge_points JSON, 
	turn_range VARCHAR(50), 
	created_at DATETIME, 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS user_learning_profiles (
	user_id VARCHAR NOT NULL PRIMARY KEY, 
	weak_points JSON, 
	mastered_points JSON, 
	preference_style VARCHAR(50) DEFAULT 'comparison', 
	recent_topics JSON, 
	radar_scores JSON, 
	updated_at DATETIME, 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
"""

def export_seed_data():
    """将当前 SQLite 数据库中的种子数据导出到 seed_data.json"""
    if not DB_PATH.exists():
        print(f"[错误] 数据库文件不存在: {DB_PATH}")
        sys.exit(1)
        
    print(f"[*] 正在从 {DB_PATH} 导出种子数据...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    seed_data = {}
    for table in TABLES_TO_SEED:
        try:
            rows = cur.execute(f"SELECT * FROM {table}").fetchall()
            seed_data[table] = [dict(row) for row in rows]
            print(f"  - 导出表 {table}: {len(seed_data[table])} 条记录")
        except sqlite3.OperationalError as e:
            print(f"  - [跳过] 表 {table} 读取失败: {e}")
            
    conn.close()
    
    SEED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SEED_FILE, "w", encoding="utf-8") as f:
        json.dump(seed_data, f, ensure_ascii=False, indent=2)
        
    print(f"[完成] 种子数据已成功导出至: {SEED_FILE}")

def import_seed_data():
    """初始化数据库并导入 seed_data.json 中的种子数据（零第三方库依赖）"""
    if not SEED_FILE.exists():
        print(f"[错误] 种子数据文件未找到: {SEED_FILE}")
        sys.exit(1)
        
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"[*] 正在使用原生 SQLite 结构初始化 {DB_PATH} ...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA_DDL)
    conn.commit()
    print("  - 数据库表结构校验与初始化完成！")
    
    print(f"[*] 正在将种子数据导入 {DB_PATH}...")
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_data = json.load(f)
        
    for table, rows in seed_data.items():
        if not rows:
            continue
        columns = list(rows[0].keys())
        col_names = ", ".join(f'"{c}"' for c in columns)
        placeholders = ", ".join([f":{col}" for col in columns])
        sql = f"INSERT OR IGNORE INTO {table} ({col_names}) VALUES ({placeholders})"
        
        inserted_count = 0
        for row in rows:
            try:
                cur.execute(sql, row)
                if cur.rowcount > 0:
                    inserted_count += 1
            except Exception as e:
                print(f"  [跳过行] {table}: {e}")
                
        print(f"  - 表 {table}: 写入 {inserted_count} 条数据 (已存在则忽略)")
        
    conn.commit()
    conn.close()
    print("[完成] 数据库种子数据就绪！新环境已可无缝运行。")

if __name__ == "__main__":
    if "--export" in sys.argv:
        export_seed_data()
    else:
        import_seed_data()
