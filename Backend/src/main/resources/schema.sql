DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;

-- Students table (USN is PRIMARY KEY)
CREATE TABLE students (
  usn VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  department VARCHAR(100),
  semester VARCHAR(50),
  section VARCHAR(50),
  subject VARCHAR(100)
);

-- Marks table (linked by USN)
CREATE TABLE marks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usn VARCHAR(20) NOT NULL,
  subject VARCHAR(100),
  marks_obtained DOUBLE,
  max_marks DOUBLE,
  exam_date DATE,
  CONSTRAINT fk_marks_student
    FOREIGN KEY (usn)
    REFERENCES students(usn)
    ON DELETE CASCADE
);

-- Attendance table (linked by USN)
CREATE TABLE attendance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usn VARCHAR(20) NOT NULL,
  subject VARCHAR(100),
  date DATE,
  present BOOLEAN,
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (usn)
    REFERENCES students(usn)
    ON DELETE CASCADE
);


CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);
