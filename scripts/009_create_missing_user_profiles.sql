-- Create user profiles for existing auth users who don't have profiles yet
-- This will help resolve the "No user profile found in database" issue

-- First, let's create a function to create missing user profiles
CREATE OR REPLACE FUNCTION create_missing_user_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Loop through auth.users who don't have profiles in public.users
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
        AND au.email_confirmed_at IS NOT NULL
    LOOP
        -- Create basic user profile
        INSERT INTO public.users (
            id,
            email,
            name,
            phone,
            cpf_cnpj,
            user_type,
            company_name,
            fantasy_name,
            created_at,
            updated_at
        ) VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE((auth_user.raw_user_meta_data->>'name')::text, ''),
            COALESCE((auth_user.raw_user_meta_data->>'phone')::text, ''),
            COALESCE((auth_user.raw_user_meta_data->>'cpf_cnpj')::text, ''),
            COALESCE((auth_user.raw_user_meta_data->>'user_type')::text, 'client_individual'),
            COALESCE((auth_user.raw_user_meta_data->>'company_name')::text, NULL),
            COALESCE((auth_user.raw_user_meta_data->>'fantasy_name')::text, NULL),
            NOW(),
            NOW()
        );

        -- If user is a provider, create provider profile
        IF (auth_user.raw_user_meta_data->>'user_type')::text LIKE '%provider%' THEN
            INSERT INTO public.provider_profiles (
                id,
                bio,
                hourly_rate,
                service_rate,
                pricing_type,
                service_radius,
                availability,
                rating,
                total_jobs,
                is_verified,
                created_at,
                updated_at
            ) VALUES (
                auth_user.id,
                COALESCE((auth_user.raw_user_meta_data->>'bio')::text, ''),
                COALESCE((auth_user.raw_user_meta_data->>'hourly_rate')::text::numeric, 0),
                COALESCE((auth_user.raw_user_meta_data->>'service_rate')::text::numeric, 0),
                COALESCE((auth_user.raw_user_meta_data->>'pricing_type')::text, 'hourly'),
                COALESCE((auth_user.raw_user_meta_data->>'service_radius')::text::integer, 10),
                COALESCE(auth_user.raw_user_meta_data->'availability', '{}'::jsonb),
                4.5,
                0,
                false,
                NOW(),
                NOW()
            );

            -- Add provider categories if they exist
            IF auth_user.raw_user_meta_data ? 'categories' THEN
                INSERT INTO public.provider_categories (provider_id, category_id)
                SELECT 
                    auth_user.id,
                    sc.id
                FROM jsonb_array_elements_text(auth_user.raw_user_meta_data->'categories') AS category_name
                JOIN public.service_categories sc ON sc.name ILIKE category_name
                ON CONFLICT (provider_id, category_id) DO NOTHING;
            END IF;
        END IF;

        RAISE NOTICE 'Created profile for user: %', auth_user.email;
    END LOOP;
END;
$$;

-- Execute the function to create missing profiles
SELECT create_missing_user_profiles();

-- Drop the function as it's no longer needed
DROP FUNCTION create_missing_user_profiles();
