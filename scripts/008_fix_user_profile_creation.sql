-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_metadata JSONB;
    provider_profile_id UUID;
BEGIN
    -- Get user metadata
    user_metadata := NEW.raw_user_meta_data;
    
    -- Log the trigger execution
    RAISE LOG 'Creating profile for user: %, metadata: %', NEW.id, user_metadata;
    
    -- Insert into users table with all metadata
    INSERT INTO public.users (
        id,
        name,
        email,
        phone,
        cpf_cnpj,
        user_type,
        company_name,
        fantasy_name,
        location,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(user_metadata->>'name', NEW.email),
        NEW.email,
        user_metadata->>'phone',
        user_metadata->>'cpf_cnpj',
        COALESCE(user_metadata->>'user_type', 'client_individual')::user_type_enum,
        user_metadata->>'company_name',
        user_metadata->>'fantasy_name',
        CASE 
            WHEN user_metadata->'address' IS NOT NULL THEN
                CONCAT(
                    COALESCE(user_metadata->'address'->>'street', ''), ', ',
                    COALESCE(user_metadata->'address'->>'city', ''), ', ',
                    COALESCE(user_metadata->'address'->>'state', '')
                )
            ELSE NULL
        END,
        NOW(),
        NOW()
    );
    
    -- If user is a provider, create provider profile
    IF user_metadata->>'user_type' LIKE '%provider%' THEN
        INSERT INTO public.provider_profiles (
            id,
            bio,
            hourly_rate,
            service_rate,
            pricing_type,
            service_radius,
            availability,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            user_metadata->>'bio',
            CASE 
                WHEN user_metadata->>'hourly_rate' IS NOT NULL 
                THEN (user_metadata->>'hourly_rate')::DECIMAL 
                ELSE NULL 
            END,
            CASE 
                WHEN user_metadata->>'service_rate' IS NOT NULL 
                THEN (user_metadata->>'service_rate')::DECIMAL 
                ELSE NULL 
            END,
            COALESCE(user_metadata->>'pricing_type', 'hourly'),
            CASE 
                WHEN user_metadata->>'service_radius' IS NOT NULL 
                THEN (user_metadata->>'service_radius')::INTEGER 
                ELSE NULL 
            END,
            user_metadata->'availability',
            NOW(),
            NOW()
        );
        
        -- Insert provider categories if they exist
        IF user_metadata->'categories' IS NOT NULL THEN
            INSERT INTO public.provider_categories (provider_id, category_name)
            SELECT NEW.id, category_name::TEXT
            FROM jsonb_array_elements_text(user_metadata->'categories') AS category_name;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Provider profiles policies
DROP POLICY IF EXISTS "Providers can manage own profile" ON public.provider_profiles;
CREATE POLICY "Providers can manage own profile" ON public.provider_profiles
    FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;
CREATE POLICY "Anyone can view provider profiles" ON public.provider_profiles
    FOR SELECT USING (true);

-- Provider categories policies
DROP POLICY IF EXISTS "Providers can manage own categories" ON public.provider_categories;
CREATE POLICY "Providers can manage own categories" ON public.provider_categories
    FOR ALL USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Anyone can view provider categories" ON public.provider_categories;
CREATE POLICY "Anyone can view provider categories" ON public.provider_categories
    FOR SELECT USING (true);

-- Service requests policies
DROP POLICY IF EXISTS "Clients can manage own requests" ON public.service_requests;
CREATE POLICY "Clients can manage own requests" ON public.service_requests
    FOR ALL USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Providers can view open requests" ON public.service_requests;
CREATE POLICY "Providers can view open requests" ON public.service_requests
    FOR SELECT USING (status = 'open');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
