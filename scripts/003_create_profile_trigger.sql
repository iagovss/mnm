-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, user_type, name, email, phone, cpf_cnpj, company_name, fantasy_name, profile_photo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'client_individual')::user_type,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cpf_cnpj', ''),
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'fantasy_name',
    NEW.raw_user_meta_data ->> 'profile_photo'
  )
  ON CONFLICT (id) DO NOTHING;

  -- If user is a provider, create provider profile
  IF (NEW.raw_user_meta_data ->> 'user_type') LIKE '%provider%' THEN
    INSERT INTO public.provider_profiles (
      id, 
      bio, 
      hourly_rate, 
      service_rate, 
      pricing_type, 
      service_radius, 
      availability
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'bio',
      CASE WHEN NEW.raw_user_meta_data ->> 'hourly_rate' IS NOT NULL 
           THEN (NEW.raw_user_meta_data ->> 'hourly_rate')::DECIMAL(10,2) 
           ELSE NULL END,
      CASE WHEN NEW.raw_user_meta_data ->> 'service_rate' IS NOT NULL 
           THEN (NEW.raw_user_meta_data ->> 'service_rate')::DECIMAL(10,2) 
           ELSE NULL END,
      NEW.raw_user_meta_data ->> 'pricing_type',
      CASE WHEN NEW.raw_user_meta_data ->> 'service_radius' IS NOT NULL 
           THEN (NEW.raw_user_meta_data ->> 'service_radius')::INTEGER 
           ELSE NULL END,
      CASE WHEN NEW.raw_user_meta_data ->> 'availability' IS NOT NULL 
           THEN (NEW.raw_user_meta_data ->> 'availability')::JSONB 
           ELSE NULL END
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
