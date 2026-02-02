-- FirmOS Seed: Operator
-- Seed the single operator record

INSERT INTO operator (id, email, name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'operator@firmos.local',
    'FirmOS Operator'
)
ON CONFLICT (email) DO NOTHING;
