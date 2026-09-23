
CREATE TYPE public.app_role AS ENUM ('student','faculty','admin');

CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  number int NOT NULL,
  label text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.batches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  batch_id uuid REFERENCES public.batches ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  department text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  room text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'available',
  status_note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faculty TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty TO authenticated;
GRANT ALL ON public.faculty TO service_role;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty ON DELETE SET NULL,
  subject text NOT NULL,
  room text NOT NULL DEFAULT '',
  day_of_week int NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lectures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lectures TO authenticated;
GRANT ALL ON public.lectures TO service_role;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  event_date date,
  venue text NOT NULL DEFAULT '',
  contact_faculty_id uuid REFERENCES public.faculty ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject text NOT NULL,
  class_date date NOT NULL DEFAULT CURRENT_DATE,
  present boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject, class_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "public read batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "staff manage batches" ON public.batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "public read faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "faculty update own" ON public.faculty FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff insert faculty" ON public.faculty FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete faculty" ON public.faculty FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "public read lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "staff manage lectures" ON public.lectures FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "staff manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'faculty') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "own attendance" ON public.attendance_records FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- New user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''),'student')::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data
INSERT INTO public.batches (id, department, number, label) VALUES
 ('11111111-1111-1111-1111-111111111101','Civil',3,'Civil Batch 3'),
 ('11111111-1111-1111-1111-111111111102','Civil',2,'Civil Batch 2'),
 ('11111111-1111-1111-1111-111111111103','CSE',2,'CSE Batch 2'),
 ('11111111-1111-1111-1111-111111111104','Mechanical',1,'Mechanical Batch 1');

INSERT INTO public.faculty (id, name, department, subject, room, status, status_note) VALUES
 ('22222222-2222-2222-2222-222222222201','Prof. M. Rahman','Civil','Structural Dynamics','C-204','in_class','Taking Civil Batch 3'),
 ('22222222-2222-2222-2222-222222222202','Dr. S. Iyer','Civil','Fluid Mechanics','B-110','available','Free until 2 PM'),
 ('22222222-2222-2222-2222-222222222203','Prof. L. Devi','Civil','Thermodynamics','A-05','on_leave','Back on Monday'),
 ('22222222-2222-2222-2222-222222222204','Dr. R. Nair','Civil','Geotechnical Lab','Lab 2','busy','Preparing lab setup'),
 ('22222222-2222-2222-2222-222222222205','Prof. A. Deshmukh','CSE','Data Structures','D-301','available','Office hours'),
 ('22222222-2222-2222-2222-222222222206','Prof. S. Kapoor','Mechanical','Strength of Materials','M-108','in_class','Mechanical Batch 1');

INSERT INTO public.lectures (batch_id, faculty_id, subject, room, day_of_week, start_time, end_time)
SELECT b.id, f.id, s.subject, s.room, d.dow, s.start_time, s.end_time
FROM (VALUES
  ('Fluid Mechanics','B-110','22222222-2222-2222-2222-222222222202','09:00'::time,'10:00'::time),
  ('Structural Dynamics II','C-204','22222222-2222-2222-2222-222222222201','10:40'::time,'11:40'::time),
  ('Thermodynamics','A-05','22222222-2222-2222-2222-222222222203','12:20'::time,'13:20'::time),
  ('Geotechnical Lab','Lab 2','22222222-2222-2222-2222-222222222204','14:00'::time,'16:00'::time)
) AS s(subject, room, fid, start_time, end_time)
JOIN public.faculty f ON f.id = s.fid::uuid
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(dow)
JOIN public.batches b ON b.label = 'Civil Batch 3';

INSERT INTO public.lectures (batch_id, faculty_id, subject, room, day_of_week, start_time, end_time)
SELECT b.id, f.id, s.subject, s.room, d.dow, s.start_time, s.end_time
FROM (VALUES
  ('Data Structures','D-301','22222222-2222-2222-2222-222222222205','09:30'::time,'10:30'::time),
  ('Operating Systems','D-305','22222222-2222-2222-2222-222222222205','11:00'::time,'12:00'::time)
) AS s(subject, room, fid, start_time, end_time)
JOIN public.faculty f ON f.id = s.fid::uuid
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(dow)
JOIN public.batches b ON b.label = 'CSE Batch 2';

INSERT INTO public.lectures (batch_id, faculty_id, subject, room, day_of_week, start_time, end_time)
SELECT b.id, f.id, 'Strength of Materials', 'M-108', d.dow, '09:00'::time, '10:00'::time
FROM public.faculty f
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(dow)
JOIN public.batches b ON b.label = 'Mechanical Batch 1'
WHERE f.id = '22222222-2222-2222-2222-222222222206';

INSERT INTO public.announcements (title, body, category, event_date, venue, contact_faculty_id) VALUES
 ('Annual TechFest · Registration open','Teams of up to four can register for the robotics and bridge-building tracks. Bring your student ID.','Event', CURRENT_DATE + 7, 'Admin Block','22222222-2222-2222-2222-222222222203'),
 ('Guest lecture: Bridges of the Future','A talk on long-span bridge design and sustainable materials, followed by a Q&A session.','Seminar', CURRENT_DATE + 11, 'Auditorium B','22222222-2222-2222-2222-222222222204'),
 ('Mid-semester lab reports due','Submit your geotechnical lab reports before Friday evening at the department office.','Academic', CURRENT_DATE + 3, 'Civil Department Office','22222222-2222-2222-2222-222222222202');
