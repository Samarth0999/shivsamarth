-- =========================================================================
-- PostgreSQL Database Schema for ShivSamarth Motor Driving School
-- Defined according to System Requirements Specification (SRS)
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL DEFAULT 'password123',
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'branch_manager', 'instructor', 'office_staff')),
  max_discount_limit NUMERIC(10,2) DEFAULT 0,
  salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily')),
  base_salary NUMERIC(10,2) DEFAULT 18000,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Granular User Permissions Table (as defined in SRS)
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  is_granted SMALLINT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_permission UNIQUE(user_id, permission_key)
);

-- 4. Leads & Inquiries Table (Connected to Public Enquiry & Booking Form)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  course_id VARCHAR(50),
  course_name VARCHAR(150),
  preferred_time VARCHAR(100),
  address TEXT,
  message TEXT,
  source VARCHAR(50) DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'booking_modal', 'walk_in', 'phone_call')),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Course Types Table
CREATE TABLE IF NOT EXISTS course_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 26,
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 7000,
  is_license_course SMALLINT DEFAULT 1,
  is_active SMALLINT DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Batches Table
CREATE TABLE IF NOT EXISTS batches (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  time_slot VARCHAR(100) NOT NULL,
  capacity INTEGER DEFAULT 4,
  is_active SMALLINT DEFAULT 1
);

-- 7. Students Table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  enroll_id VARCHAR(50) UNIQUE NOT NULL,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  course_type_id INTEGER NOT NULL REFERENCES course_types(id),
  primary_instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  gender VARCHAR(20) DEFAULT 'Male',
  dob DATE,
  address TEXT,
  admission_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  base_fee NUMERIC(10,2) NOT NULL,
  discount_given NUMERIC(10,2) DEFAULT 0,
  net_total_fee NUMERIC(10,2) NOT NULL,
  total_paid NUMERIC(10,2) DEFAULT 0,
  pending_balance NUMERIC(10,2) NOT NULL,
  days_completed INTEGER DEFAULT 0,
  total_course_days INTEGER DEFAULT 26,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Conditional RTO fields
  is_license_course SMALLINT DEFAULT 1,
  ll_application_no VARCHAR(100),
  ll_receipt_no VARCHAR(100),
  ll_receipt_amount NUMERIC(10,2) DEFAULT 0,
  ll_issue_date DATE,
  ll_expiry_date DATE,
  dl_application_no VARCHAR(100),
  dl_receipt_no VARCHAR(100),
  dl_receipt_amount NUMERIC(10,2) DEFAULT 0,
  dl_number VARCHAR(100),
  dl_expiry_date DATE,
  rto_test_status VARCHAR(50) DEFAULT 'pending',
  rto_test_date DATE,
  last_whatsapp_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_enroll_id ON students(enroll_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
