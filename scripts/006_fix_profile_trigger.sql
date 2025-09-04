-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table with metadata from auth.users
  INSERT INTO public.users (
    id,
    user_type,
    name,
    email,
    phone,
    cpf_cnpj,
    company_name,
    fantasy_name,
    profile_photo
  ) VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'client_individual'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', ''),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'fantasy_name',
    NEW.raw_user_meta_data->>'profile_photo'
  );

  -- If user is a provider, create provider profile
  IF (NEW.raw_user_meta_data->>'user_type') LIKE 'provider_%' THEN
    INSERT INTO public.provider_profiles (
      user_id,
      bio,
      hourly_rate,
      service_rate,
      pricing_type,
      service_radius,
      availability
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'bio',
      CASE 
        WHEN NEW.raw_user_meta_data->>'hourly_rate' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'hourly_rate')::decimal
        ELSE NULL
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->>'service_rate' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'service_rate')::decimal
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'pricing_type',
      CASE 
        WHEN NEW.raw_user_meta_data->>'service_radius' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'service_radius')::integer
        ELSE NULL
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->>'availability' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'availability')::jsonb
        ELSE NULL
      END
    );

    -- Insert provider categories if they exist
    IF NEW.raw_user_meta_data->>'categories' IS NOT NULL THEN
      INSERT INTO public.provider_categories (user_id, category_id)
      SELECT 
        NEW.id,
        sc.id
      FROM service_categories sc
      WHERE sc.name = ANY(
        SELECT jsonb_array_elements_text((NEW.raw_user_meta_data->>'categories')::jsonb)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
