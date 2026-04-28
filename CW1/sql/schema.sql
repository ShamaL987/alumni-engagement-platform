CREATE DATABASE IF NOT EXISTS alumni_bidding_platform;
USE alumni_bidding_platform;

CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  token_version INT NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('email_verification', 'password_reset') NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_token_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(150) NULL,
  biography TEXT NULL,
  linked_in_url VARCHAR(500) NULL,
  profile_image_path VARCHAR(500) NULL,
  degrees JSON NOT NULL,
  certifications JSON NOT NULL,
  licences JSON NOT NULL,
  short_courses JSON NOT NULL,
  employment_history JSON NOT NULL,
  monthly_event_bonus_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bidding_cycle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  featured_date DATE NOT NULL,
  status ENUM('active', 'processing', 'processed') NOT NULL DEFAULT 'active',
  winner_bid_id INT NULL,
  winner_user_id INT NULL,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bidding_cycle_status_end_time (status, end_time),
  INDEX idx_bidding_cycle_featured_date (featured_date),
  INDEX idx_bidding_cycle_winner_user (winner_user_id),
  CONSTRAINT fk_bidding_cycle_winner_user FOREIGN KEY (winner_user_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bid (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cycle_id INT NOT NULL,
  bid_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('active', 'cancelled', 'won', 'lost') NOT NULL DEFAULT 'active',
  selected_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_bid_user_cycle UNIQUE (user_id, cycle_id),
  INDEX idx_bid_cycle_status_amount (cycle_id, status, bid_amount),
  INDEX idx_bid_user_created_at (user_id, created_at),
  CONSTRAINT fk_bid_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  CONSTRAINT fk_bid_cycle FOREIGN KEY (cycle_id) REFERENCES bidding_cycle(id) ON DELETE CASCADE
);

ALTER TABLE bidding_cycle
  ADD CONSTRAINT fk_bidding_cycle_winner_bid FOREIGN KEY (winner_bid_id) REFERENCES bid(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS bid_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_id INT NOT NULL,
  bid_id INT NULL,
  user_id INT NULL,
  action ENUM('created', 'increased', 'cancelled', 'won', 'lost', 'cycle_processed_no_winner') NOT NULL,
  previous_amount DECIMAL(10, 2) NULL,
  new_amount DECIMAL(10, 2) NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bid_history_cycle_created_at (cycle_id, created_at),
  INDEX idx_bid_history_bid (bid_id),
  INDEX idx_bid_history_user (user_id),
  CONSTRAINT fk_bid_history_cycle FOREIGN KEY (cycle_id) REFERENCES bidding_cycle(id) ON DELETE CASCADE,
  CONSTRAINT fk_bid_history_bid FOREIGN KEY (bid_id) REFERENCES bid(id) ON DELETE SET NULL,
  CONSTRAINT fk_bid_history_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS request_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  token_subject VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_request_log_user (user_id),
  INDEX idx_request_log_created_at (created_at),
  CONSTRAINT fk_request_log_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);
