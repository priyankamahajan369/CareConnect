CREATE TABLE patients(id UUID PRIMARY KEY,name VARCHAR(120) NOT NULL,email VARCHAR(255) UNIQUE NOT NULL,date_of_birth DATE NOT NULL,phone VARCHAR(30),insurance VARCHAR(255) NOT NULL,member_id VARCHAR(255) UNIQUE NOT NULL,owner_sub VARCHAR(255) NOT NULL,version BIGINT NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL);
CREATE INDEX patients_name_idx ON patients(lower(name));
CREATE INDEX patients_owner_idx ON patients(owner_sub);
INSERT INTO patients VALUES
('11111111-1111-4111-8111-111111111111','Maya Bennett','maya@example.test','1991-04-12','555-0101','Northstar Health','NS1001','patient-demo',0,now()),
('22222222-2222-4222-8222-222222222222','Noah Williams','noah@example.test','1985-09-03','555-0102','Cedar Care','CC1002','noah-demo',0,now()),
('33333333-3333-4333-8333-333333333333','Ava Patel','ava@example.test','1994-02-16','555-0103','Northstar Health','NS1003','ava-demo',0,now()),
('44444444-4444-4444-8444-444444444444','Oliver Chen','oliver@example.test','1978-11-22','555-0104','Harbor Plus','HP1004','oliver-demo',0,now());
