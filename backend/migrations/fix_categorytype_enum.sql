-- Fix CategoryType enum to include all required values
-- Issue: PostgreSQL enum 'categorytype' is missing 'product' and 'recipe' values

-- Check current enum values
-- SELECT unnest(enum_range(NULL::categorytype));

-- Add missing enum values if they don't exist
DO $$
BEGIN
    -- Add 'product' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'product'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'categorytype')
    ) THEN
        ALTER TYPE categorytype ADD VALUE 'product';
        RAISE NOTICE 'Added "product" to categorytype enum';
    END IF;

    -- Add 'recipe' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'recipe'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'categorytype')
    ) THEN
        ALTER TYPE categorytype ADD VALUE 'recipe';
        RAISE NOTICE 'Added "recipe" to categorytype enum';
    END IF;
END$$;

-- Verify all values exist
SELECT unnest(enum_range(NULL::categorytype)) AS category_types;
