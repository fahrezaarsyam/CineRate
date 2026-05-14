import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "yamabiko.proxy.rlwy.net")
DB_PORT = os.getenv("DB_PORT", "18738")
DB_NAME = os.getenv("DB_NAME", "railway")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "XzaLjUuKhXRFCgjFCcBbpryoEpfwuInF")

print(f"Connecting to database {DB_NAME} at {DB_HOST}...")

try:
    # Connect to the database
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    # Path to your init.sql file
    sql_file_path = os.path.join(os.path.dirname(__file__), "..", "database", "init.sql")
    
    print(f"Reading SQL from {sql_file_path}...")
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_commands = f.read()
        
    print("Executing SQL commands (this will drop and recreate tables, and insert all data)...")
    cur.execute(sql_commands)
    
    print("Database seeded successfully! All movies, users, and tables have been initialized.")
    
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    if 'cur' in locals():
        cur.close()
    if 'conn' in locals():
        conn.close()
