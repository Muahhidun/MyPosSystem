#!/usr/bin/env python3
"""
Fix CategoryType enum to include 'product' and 'recipe' values

Issue: PostgreSQL enum 'categorytype' is missing values that code expects
Error: invalid input value for enum categorytype: "product"
"""

import os
import sys
from sqlalchemy import create_engine, text

def main():
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("Usage: DATABASE_URL='postgresql://...' python fix_categorytype_enum.py")
        return 1

    print("🔧 Fixing CategoryType enum...")
    print(f"📍 Database: {database_url.split('@')[1] if '@' in database_url else 'local'}")

    engine = create_engine(database_url)

    with engine.connect() as conn:
        # Check current enum values
        print("\n📋 Current categorytype enum values:")
        result = conn.execute(text("""
            SELECT unnest(enum_range(NULL::categorytype)) AS value
        """))
        current_values = [row[0] for row in result]
        for value in current_values:
            print(f"  ✓ {value}")

        # Add missing values
        print("\n🔄 Adding missing values...")

        # Add 'product' if missing
        if 'product' not in current_values:
            conn.execute(text("ALTER TYPE categorytype ADD VALUE 'product'"))
            conn.commit()
            print("  ✅ Added 'product'")
        else:
            print("  ⏭️  'product' already exists")

        # Add 'recipe' if missing
        if 'recipe' not in current_values:
            conn.execute(text("ALTER TYPE categorytype ADD VALUE 'recipe'"))
            conn.commit()
            print("  ✅ Added 'recipe'")
        else:
            print("  ⏭️  'recipe' already exists")

        # Verify final state
        print("\n✅ Final categorytype enum values:")
        result = conn.execute(text("""
            SELECT unnest(enum_range(NULL::categorytype)) AS value
        """))
        final_values = [row[0] for row in result]
        for value in final_values:
            print(f"  ✓ {value}")

        print("\n✅ CategoryType enum fixed successfully!")

    return 0

if __name__ == "__main__":
    sys.exit(main())
