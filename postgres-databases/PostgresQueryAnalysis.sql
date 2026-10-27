-- Run in the appointment database after inserting a realistic volume of synthetic data.
-- EXPLAIN does not alter data. Execution plans vary with size, selectivity and statistics.
EXPLAIN (ANALYZE, BUFFERS)
SELECT id,patient_name,provider_name,starts_at,status
FROM appointments WHERE owner_sub='patient-demo' ORDER BY starts_at LIMIT 20;

-- Inspect pending event backlog without exposing payload contents.
SELECT count(*) AS unpublished_events FROM outbox_events WHERE published=false;

-- Run in the patient database: a local relational join, not a cross-service join.
SELECT p.name,c.label,c.value FROM patients p
LEFT JOIN patient_contacts c ON c.patient_id=p.id ORDER BY p.name;
