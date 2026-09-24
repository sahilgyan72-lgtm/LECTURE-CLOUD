DELETE FROM public.lectures WHERE true;
UPDATE public.announcements SET contact_faculty_id = NULL WHERE contact_faculty_id IS NOT NULL;
DELETE FROM public.faculty WHERE true;
INSERT INTO public.faculty (name, department, subject, room) VALUES
('DAP','H&S','Maths-1','7104'),('VF','H&S','Maths-1 / PPS','7111'),('VF1','H&S','Maths-1 / BCE','7111'),
('KMK','H&S','Physics','8103'),('HNC','Electrical','BEE','4010'),('JHP','Electrical','BEE','4010'),('RBC','Electrical','BEE','4010'),
('KSB','Mechanical','Workshop','WS6000'),('DMP','Mechanical','Workshop','WS6000'),('PKG','Mechanical','BME / Workshop','5112'),
('BDP','Mechanical','BME','5112'),('ADP','Mechanical','IPDC / BME','5012'),('AKP','Mechanical','BME','5112'),('ARC','Mechanical','BME','4109'),
('PNB','Mechanical','BME','8109'),('SKD','Mechanical','BME','5112'),('CGP','H&S','IPDC','7012'),
('MKP','Computer','PPS / DFWS','4114'),('HVH','Computer','PPS','4114'),('KMG','Computer','PPS','4111'),('BRP','Computer','DFWS','4009'),('MGP','Computer','DFWS','4009'),
('VJC','Civil','BCE','7104'),('VHK','Civil','BCE','7111');