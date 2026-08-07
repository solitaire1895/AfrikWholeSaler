-- ============================================================================
-- AfrikWholesaler — Demo Users Seed Data
-- Run this in the Supabase SQL Editor to create demo users.
-- This creates auth.users entries, which trigger profile + customer creation.
-- Password for all demo users: DemoPassword123!
-- ============================================================================

-- Insert demo users into auth.users
-- The triggers will auto-create profiles and customer records
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT * FROM (VALUES
  -- Customer 1: Senegal
  (gen_random_uuid(), 'amadou.diallo@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Amadou', 'last_name', 'Diallo', 'company', 'Diallo Distribution SARL', 'phone', '+221 77 123 45 67', 'country', 'Senegal')),
  -- Customer 2: Nigeria
  (gen_random_uuid(), 'fatima.okonkwo@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Fatima', 'last_name', 'Okonkwo', 'company', 'Okonkwo Trading Co.', 'phone', '+234 803 555 0100', 'country', 'Nigeria')),
  -- Customer 3: Cameroon
  (gen_random_uuid(), 'jean.mbeki@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Jean-Pierre', 'last_name', 'Mbeki', 'company', 'Mbeki Import Solutions', 'phone', '+237 677 889 900', 'country', 'Cameroon')),
  -- Customer 4: Kenya
  (gen_random_uuid(), 'grace.achieng@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Grace', 'last_name', 'Achieng', 'company', 'Achieng Wholesale Ltd', 'phone', '+254 722 100 200', 'country', 'Kenya')),
  -- Customer 5: Ghana
  (gen_random_uuid(), 'kwame.mensah@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Kwame', 'last_name', 'Mensah', 'company', 'Mensah Enterprises', 'phone', '+233 244 555 666', 'country', 'Ghana')),
  -- Customer 6: Germany (Europe)
  (gen_random_uuid(), 'thomas.mueller@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Thomas', 'last_name', 'Mueller', 'company', 'Mueller Handels GmbH', 'phone', '+49 30 12345678', 'country', 'Germany')),
  -- Customer 7: Brazil (South America)
  (gen_random_uuid(), 'carlos.silva@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Carlos', 'last_name', 'Silva', 'company', 'Silva Comercio Ltda', 'phone', '+55 11 987654321', 'country', 'Brazil')),
  -- Customer 8: United States (North America)
  (gen_random_uuid(), 'sarah.johnson@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Sarah', 'last_name', 'Johnson', 'company', 'Johnson Imports LLC', 'phone', '+1 212 555 0100', 'country', 'United States')),
  -- Staff: Sales Rep
  (gen_random_uuid(), 'sales.rep@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'David', 'last_name', 'Owusu', 'company', 'AfrikWholesaler', 'phone', '+233 244 777 888', 'country', 'Ghana')),
  -- Staff: Support Agent
  (gen_random_uuid(), 'support.agent@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Aminata', 'last_name', 'Traore', 'company', 'AfrikWholesaler', 'phone', '+221 77 999 0000', 'country', 'Senegal')),
  -- Staff: Admin
  (gen_random_uuid(), 'admin@demo.com', crypt('DemoPassword123!', gen_salt('bf')), now(), now(), now(), jsonb_build_object('first_name', 'Admin', 'last_name', 'User', 'company', 'AfrikWholesaler', 'phone', '+237 677 111 222', 'country', 'Cameroon'))
) AS t(id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = t.email);

-- Wait for triggers to create profiles, then update roles
-- Update staff roles (the trigger creates them as 'customer' by default)
UPDATE profiles SET role = 'sales_rep' WHERE email = 'sales.rep@demo.com';
UPDATE profiles SET role = 'support_agent' WHERE email = 'support.agent@demo.com';
UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@demo.com';

-- Create staff records for the staff users
INSERT INTO staff (user_id, employee_id, department, position, hire_date, is_active)
SELECT p.id, 
  CASE p.email
    WHEN 'sales.rep@demo.com' THEN 'EMP-001'
    WHEN 'support.agent@demo.com' THEN 'EMP-002'
    WHEN 'admin@demo.com' THEN 'EMP-003'
  END,
  CASE p.email
    WHEN 'sales.rep@demo.com' THEN 'Sales'
    WHEN 'support.agent@demo.com' THEN 'Support'
    WHEN 'admin@demo.com' THEN 'Management'
  END,
  CASE p.email
    WHEN 'sales.rep@demo.com' THEN 'Senior Sales Agent'
    WHEN 'support.agent@demo.com' THEN 'Customer Support Agent'
    WHEN 'admin@demo.com' THEN 'System Administrator'
  END,
  CURRENT_DATE,
  true
FROM profiles p
WHERE p.email IN ('sales.rep@demo.com', 'support.agent@demo.com', 'admin@demo.com')
AND NOT EXISTS (SELECT 1 FROM staff s WHERE s.user_id = p.id);

-- Update some customer verification statuses
UPDATE customers SET verification_status = 'verified' WHERE email IN ('amadou.diallo@demo.com', 'fatima.okonkwo@demo.com', 'jean.mbeki@demo.com');
UPDATE customers SET verification_status = 'pending' WHERE email IN ('grace.achieng@demo.com', 'kwame.mensah@demo.com');

-- Update some customer stats
UPDATE customers SET total_orders = 12, total_spent = 28450.00 WHERE email = 'amadou.diallo@demo.com';
UPDATE customers SET total_orders = 8, total_spent = 15200.00 WHERE email = 'fatima.okonkwo@demo.com';
UPDATE customers SET total_orders = 5, total_spent = 8900.00 WHERE email = 'jean.mbeki@demo.com';
UPDATE customers SET total_orders = 3, total_spent = 4200.00 WHERE email = 'grace.achieng@demo.com';
