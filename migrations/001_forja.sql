CREATE SCHEMA IF NOT EXISTS forja;
CREATE TABLE forja.users (
 id text PRIMARY KEY, login text NOT NULL UNIQUE, password_hash text NOT NULL,
 role text NOT NULL CHECK (role IN ('ALUNO','PROFESSOR')), name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE forja.teachers (id text PRIMARY KEY REFERENCES forja.users(id), profile jsonb NOT NULL);
CREATE TABLE forja.students (
 id text PRIMARY KEY, user_id text UNIQUE REFERENCES forja.users(id), profile jsonb NOT NULL
);
CREATE TABLE forja.teacher_students (
 teacher_id text REFERENCES forja.teachers(id), student_id text REFERENCES forja.students(id),
 PRIMARY KEY (teacher_id,student_id), UNIQUE(student_id)
);
CREATE TABLE forja.student_data (
 user_id text PRIMARY KEY REFERENCES forja.users(id), data jsonb NOT NULL,
 checkins jsonb NOT NULL DEFAULT '{}', revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE forja.workouts (
 owner_id text REFERENCES forja.users(id), id text, student_id text REFERENCES forja.students(id),
 source text NOT NULL CHECK(source IN ('student','teacher')), data jsonb NOT NULL, archived boolean NOT NULL DEFAULT false,
 PRIMARY KEY(owner_id,id)
);
CREATE TABLE forja.exercises (
 owner_id text REFERENCES forja.users(id), id text, workout_id text NOT NULL DEFAULT '',
 data jsonb NOT NULL, archived boolean NOT NULL DEFAULT false, PRIMARY KEY(owner_id,id,workout_id)
);
CREATE TABLE forja.workout_history (
 user_id text REFERENCES forja.users(id), id text, data jsonb NOT NULL,
 archived boolean NOT NULL DEFAULT false, PRIMARY KEY(user_id,id)
);
CREATE TABLE forja.physical_assessments (
 teacher_id text REFERENCES forja.teachers(id), id text, student_id text NOT NULL REFERENCES forja.students(id),
 data jsonb NOT NULL, archived boolean NOT NULL DEFAULT false, PRIMARY KEY(teacher_id,id)
);
CREATE TABLE forja.teacher_activities (
 teacher_id text REFERENCES forja.teachers(id), id text, data jsonb NOT NULL, PRIMARY KEY(teacher_id,id)
);
CREATE TABLE forja.sessions (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES forja.users(id),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry ON forja.sessions(expires_at);
CREATE TABLE forja.login_attempts (key text PRIMARY KEY, attempts integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE TABLE forja.local_imports (
 user_id text REFERENCES forja.users(id), source text, checksum text, original jsonb NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,source,checksum)
);
