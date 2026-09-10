-- Minimal seed for local development.
insert into universities (slug, name, country, email_domains) values
  ('example', 'Example University', 'AU', array['student.example.edu']),
  ('unimelb', 'University of Melbourne', 'AU', array['student.unimelb.edu.au']);

insert into courses (university_id, code, title, slug)
select id, 'EXAMPLE101', 'Introduction to Everything', 'example101'
from universities where slug = 'example';
