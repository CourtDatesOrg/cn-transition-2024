DROP TABLE IF EXISTS cn.criminal_dates_staging;
DROP TABLE IF EXISTS cn.file_imports;
DROP TABLE IF EXISTS cn.criminal_dates;
DROP TYPE IF EXISTS cn.calendar_sessions;
DROP TYPE IF EXISTS cn.case_types;
DROP SCHEMA IF EXISTS cn;
DROP ROLE IF EXISTS cn_user;

CREATE ROLE cn_user WITH 
	NOSUPERUSER
	NOCREATEDB
	NOCREATEROLE
	INHERIT
	LOGIN
	NOREPLICATION
	NOBYPASSRLS
	CONNECTION LIMIT -1;

CREATE SCHEMA cn;

CREATE TYPE cn.case_types AS ENUM (
'CR', 
'IF');

CREATE TYPE cn.calendar_sessions AS ENUM (
'AM', 
'PM',
'NC');

-- Guessing a bit at which might turn out to have nulls
CREATE TABLE cn.criminal_dates (
	case_number text PRIMARY KEY,
	case_type cn.case_types NOT NULL,
	citation_number text NULL,
	calendar_date date NOT NULL,
	calendar_session cn.calendar_sessions NOT NULL,
	courtroom text NULL,
	defendant_name text NOT NULL,
	defendant_race text NULL,
	defendant_sex text NULL,
	offense_code text NULL,
	offense_description text NULL,
	officer_witness_type text NULL,
	officer_agency text NULL,
	officer_number text NULL,
	officer_name text NULL,
	officer_city text NULL,
	court_type text NULL,
	ethnicity text NULL
);

CREATE TABLE cn.criminal_dates_staging (LIKE cn.criminal_dates);
	ALTER TABLE cn.criminal_dates_staging ADD PRIMARY KEY (case_number);

CREATE TABLE cn.file_imports (
	import_date timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	filename text NULL,
	comment text NULL
);

-- Permissions
ALTER TABLE cn.criminal_dates OWNER TO cn_user;
ALTER TABLE cn.criminal_dates_staging OWNER TO cn_user;
ALTER TABLE cn.file_imports OWNER TO cn_user;
GRANT ALL ON TABLE cn.criminal_dates TO cn_user;
GRANT ALL ON TABLE cn.criminal_dates_staging TO cn_user;
GRANT ALL ON TABLE cn.file_imports TO cn_user;
