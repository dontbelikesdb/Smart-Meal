import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

def check_tables():
    try:
        # Create engine with the database URL
        print(f"\n🔧 Attempting to connect to: {DATABASE_URL}")
        engine = create_engine(DATABASE_URL)
        
        # Create inspector
        inspector = inspect(engine)
        
        # Get table names
        tables = inspector.get_table_names()
        
        if not tables:
            print("No tables found in the database!")
            print("\nLet's check if we can connect to the database...")
            
            # Try to execute a simple query
            with engine.connect() as conn:
                result = conn.execute("SELECT 1")
                print("\n✅ Successfully connected to the database!")
                print("\nPossible issues:")
                print("1. Migrations might not have been applied")
                print("2. The database might be empty")
                print("\nTry running these commands:")
                print("1. cd backend")
                print("2. alembic upgrade head")
                
        else:
            print("\nTables in the database:")
            for table in tables:
                print(f"- {table}")
            
            # Show some table details
            print("\nTable details:")
            for table_name in tables:
                print(f"\nTable: {table_name}")
                columns = [c['name'] for c in inspector.get_columns(table_name)]
                print(f"Columns: {', '.join(columns)}")
                
    except Exception as e:
        print(f"\n Error connecting to the database: {e}")
        print("\nPlease check:")
        print(f"1. Is PostgreSQL running?")
        print(f"2. Check your DATABASE_URL in .env: {settings.DATABASE_URL}")
        print(f"3. Can you connect using pgAdmin?")

if __name__ == "__main__":
    print("🔍 Checking database connection and tables...")
    print(f"Using database: {DATABASE_URL}")
    check_tables()
