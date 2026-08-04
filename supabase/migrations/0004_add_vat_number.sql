-- =============================================================================
-- Pitchwright — Add VAT registration number to brand settings
-- Migration: 0004_add_vat_number.sql
-- =============================================================================
-- Optional field — not every workspace is VAT-registered. Per-proposal VAT
-- toggle/rate live in proposals.content (JSONB), so no schema change is
-- needed there.

ALTER TABLE brand_settings ADD COLUMN vat_number TEXT;
