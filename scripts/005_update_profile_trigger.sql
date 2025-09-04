-- Updated trigger to handle metadata from signup and create complete user profiles
-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle user profile creation from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  user_metadata jsonb;
  category_name text;
  category_record record;
BEGIN
  -- Get user metadata
  user_metadata := NEW.raw_user_meta_data;
  
  -- Only proceed if we have metadata (from our signup form)
  IF user_metadata IS NOT NULL AND user_metadata ? 'user_type' THEN
    
    -- Insert into users table
    INSERT INTO public.users (
      id,
      email,
      name,
      user_type,
      phone,
      cpf_cnpj,
      company_name,
      fantasy_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(user_metadata->>'name', ''),
      COALESCE(user_metadata->>'user_type', 'client_individual'),
      COALESCE(user_metadata->>'phone', ''),
      COALESCE(user_metadata->>'cpf_cnpj', ''),
      user_metadata->>'company_name',
      user_metadata->>'fantasy_name',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- If user is a provider, create provider profile
    IF (user_metadata->>'user_type') LIKE '%provider%' THEN
      
      -- Insert provider profile
      INSERT INTO public.provider_profiles (
        id,
        bio,
        pricing_type,
        hourly_rate,
        service_rate,
        service_radius,
        availability,
        rating,
        total_jobs,
        is_verified,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(user_metadata->>'bio', ''),
        COALESCE(user_metadata->>'pricing_type', 'hourly'),
        CASE WHEN user_metadata->>'hourly_rate' IS NOT NULL 
             THEN (user_metadata->>'hourly_rate')::numeric 
             ELSE NULL END,
        CASE WHEN user_metadata->>'service_rate' IS NOT NULL 
             THEN (user_metadata->>'service_rate')::numeric 
             ELSE NULL END,
        CASE WHEN user_metadata->>'service_radius' IS NOT NULL 
             THEN (user_metadata->>'service_radius')::integer 
             ELSE 10 END,
        COALESCE(user_metadata->'availability', '{}'::jsonb),
        0,
        0,
        false,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;

      -- Handle provider categories if they exist
      IF user_metadata ? 'categories' AND jsonb_array_length(user_metadata->'categories') > 0 THEN
        -- Loop through categories and insert them
        FOR category_name IN SELECT jsonb_array_elements_text(user_metadata->'categories')
        LOOP
          -- Find the category by name
          SELECT * INTO category_record 
          FROM public.service_categories 
          WHERE name = category_name 
          LIMIT 1;
          
          -- Insert provider category relationship if category exists
          IF category_record.id IS NOT NULL THEN
            INSERT INTO public.provider_categories (
              provider_id,
              category_id,
              created_at
            ) VALUES (
              NEW.id,
              category_record.id,
              NOW()
            ) ON CONFLICT (provider_id, category_id) DO NOTHING;
          END IF;
        END LOOP;
      END IF;
      
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
