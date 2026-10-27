CREATE TABLE patient_contacts(id UUID PRIMARY KEY,patient_id UUID NOT NULL REFERENCES patients(id),label VARCHAR(255),value VARCHAR(255));
CREATE INDEX patient_contacts_owner ON patient_contacts(patient_id);
INSERT INTO patient_contacts SELECT gen_random_uuid(),id,'Mobile',phone FROM patients WHERE phone IS NOT NULL;
