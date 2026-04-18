-- Migration 00009: Fix share_token DEFAULT encoding
--
-- PostgreSQL's encode() function does not support 'base64url'.
-- Supported encodings are: base64, hex, escape.
-- Replace the DEFAULT with standard base64, then translate the
-- URL-unsafe characters (+, /, =) to URL-safe equivalents (-, _, '').

ALTER TABLE project_shares
  ALTER COLUMN share_token SET DEFAULT
    translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
