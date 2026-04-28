CREATE DATABASE IF NOT EXISTS alumni_cw2_mvc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alumni_cw2_mvc;

-- Sequelize can create/alter the tables automatically with npm start.
-- This file documents the normalized schema used by the MVC implementation.

CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('alumni','client','admin') NOT NULL DEFAULT 'alumni',
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  token_version INT NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(150),
  biography TEXT,
  linked_in_url VARCHAR(500),
  profile_image_path VARCHAR(500),
  programme VARCHAR(150),
  graduation_year INT,
  graduation_date DATE,
  industry_sector VARCHAR(150),
  current_job_title VARCHAR(150),
  employer VARCHAR(150),
  country VARCHAR(100),
  city VARCHAR(100),
  skills JSON NOT NULL,
  degrees JSON NOT NULL,
  certifications JSON NOT NULL,
  licences JSON NOT NULL,
  short_courses JSON NOT NULL,
  employment_history JSON NOT NULL,
  monthly_event_bonus_count INT NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE profile_document (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  user_id INT NOT NULL,
  document_type ENUM('degree','certification','licence','short_course','employment_evidence','other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  issuer VARCHAR(200),
  file_path VARCHAR(500),
  external_url VARCHAR(500),
  issued_at DATE,
  expires_at DATE,
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_document_profile FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  CONSTRAINT fk_document_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE auth_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('email_verification','password_reset') NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_auth_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE bidding_cycle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  featured_date DATE NOT NULL,
  status ENUM('active','processing','processed') NOT NULL DEFAULT 'active',
  winner_bid_id INT NULL,
  winner_user_id INT NULL,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE bid (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cycle_id INT NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_attempt_count INT NOT NULL DEFAULT 1,
  status ENUM('active','cancelled','won','lost') NOT NULL DEFAULT 'active',
  selected_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_bid_user_cycle (user_id, cycle_id),
  CONSTRAINT fk_bid_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  CONSTRAINT fk_bid_cycle FOREIGN KEY (cycle_id) REFERENCES bidding_cycle(id) ON DELETE CASCADE
);

ALTER TABLE bidding_cycle
  ADD CONSTRAINT fk_cycle_winner_bid FOREIGN KEY (winner_bid_id) REFERENCES bid(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_cycle_winner_user FOREIGN KEY (winner_user_id) REFERENCES user(id) ON DELETE SET NULL;

CREATE TABLE bid_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_id INT NOT NULL,
  bid_id INT NULL,
  user_id INT NULL,
  action ENUM('created','increased','cancelled','won','lost','cycle_processed_no_winner') NOT NULL,
  previous_amount DECIMAL(10,2),
  new_amount DECIMAL(10,2),
  note VARCHAR(255),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_history_cycle FOREIGN KEY (cycle_id) REFERENCES bidding_cycle(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_bid FOREIGN KEY (bid_id) REFERENCES bid(id) ON DELETE SET NULL,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE api_key (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  client_type ENUM('analytics_dashboard','mobile_ar_app','custom') NOT NULL,
  key_prefix VARCHAR(24) NOT NULL UNIQUE,
  key_hash VARCHAR(128) NOT NULL UNIQUE,
  permissions JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at DATETIME NULL,
  created_by_user_id INT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_api_key_creator FOREIGN KEY (created_by_user_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE api_usage_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT NULL,
  user_id INT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  ip_address VARCHAR(80),
  user_agent VARCHAR(500),
  permissions_used JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_usage_api_key FOREIGN KEY (api_key_id) REFERENCES api_key(id) ON DELETE SET NULL,
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);
