CREATE TABLE appointments(id UUID PRIMARY KEY,patient_id UUID NOT NULL,patient_name VARCHAR(255) NOT NULL,patient_email VARCHAR(255) NOT NULL,owner_sub VARCHAR(255) NOT NULL,provider_id VARCHAR(255) NOT NULL,provider_name VARCHAR(255) NOT NULL,specialty VARCHAR(255) NOT NULL,starts_at TIMESTAMPTZ NOT NULL,status VARCHAR(255) NOT NULL CHECK(status IN ('CONFIRMED','CANCELLED','COMPLETED')),visit_type VARCHAR(255) NOT NULL,idempotency_key VARCHAR(255) UNIQUE NOT NULL,request_hash VARCHAR(255) NOT NULL,version BIGINT NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL);
CREATE UNIQUE INDEX appointments_slot_unique ON appointments(provider_id,starts_at) WHERE status='CONFIRMED';
CREATE UNIQUE INDEX appointments_patient_slot_unique ON appointments(patient_id,starts_at) WHERE status='CONFIRMED';
CREATE INDEX appointments_owner_time ON appointments(owner_sub,starts_at);
CREATE TABLE audit_records(id UUID PRIMARY KEY,actor VARCHAR(255),action VARCHAR(255),aggregate_id UUID,created_at TIMESTAMPTZ);
CREATE TABLE outbox_events(id UUID PRIMARY KEY,payload TEXT NOT NULL,published BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ);
CREATE INDEX outbox_pending ON outbox_events(created_at) WHERE published=false;
