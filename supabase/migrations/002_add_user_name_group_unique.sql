-- Migration 002: Remove old predictions table (replaced by group_standings + bracket_predictions)
-- This migration is for existing databases that have the old schema

-- Drop old tables if they exist
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS point_rules CASCADE;

-- The new schema is in 001_initial_schema.sql
