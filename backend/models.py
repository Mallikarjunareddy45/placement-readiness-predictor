from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Student(db.Model):
    __tablename__ = "students"

    id              = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name            = db.Column(db.String(100), nullable=False)
    email           = db.Column(db.String(100), unique=True, nullable=False)
    password        = db.Column(db.String(255), nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    cgpa            = db.Column(db.Float,       nullable=True)
    branch          = db.Column(db.String(100), nullable=True)
    college         = db.Column(db.String(200), nullable=True)
    graduation_year = db.Column(db.Integer,     nullable=True)
    internships     = db.Column(db.Integer,     nullable=True, default=0)
    projects_count  = db.Column(db.Integer,     nullable=True, default=0)
    certifications  = db.Column(db.Integer,     nullable=True, default=0)
    github_url      = db.Column(db.String(200), nullable=True)
    linkedin_url    = db.Column(db.String(200), nullable=True)

    resume_analyses = db.relationship("ResumeAnalysis",     backref="student", lazy=True, cascade="all, delete-orphan")
    technical_tests = db.relationship("TechnicalTest",      backref="student", lazy=True, cascade="all, delete-orphan")
    aptitude_tests  = db.relationship("AptitudeTest",       backref="student", lazy=True, cascade="all, delete-orphan")
    coding_tests    = db.relationship("CodingTest",         backref="student", lazy=True, cascade="all, delete-orphan")
    predictions     = db.relationship("PlacementPrediction",backref="student", lazy=True, cascade="all, delete-orphan")
    recommendations = db.relationship("Recommendation",     backref="student", lazy=True, cascade="all, delete-orphan")
    profile         = db.relationship("Profile",             backref="student", uselist=False, lazy=True, cascade="all, delete-orphan")
    skills_list     = db.relationship("Skill",               backref="student", lazy=True, cascade="all, delete-orphan")
    projects_list   = db.relationship("Project",             backref="student", lazy=True, cascade="all, delete-orphan")
    certificates    = db.relationship("Certificate",         backref="student", lazy=True, cascade="all, delete-orphan")
    notifications   = db.relationship("Notification",        backref="student", lazy=True, cascade="all, delete-orphan")
    leaderboard_entry=db.relationship("Leaderboard",         backref="student", uselist=False, lazy=True, cascade="all, delete-orphan")
    achievements    = db.relationship("Achievement",         backref="student", lazy=True, cascade="all, delete-orphan")
    mock_interviews = db.relationship("MockInterview",       backref="student", lazy=True, cascade="all, delete-orphan")


class ResumeAnalysis(db.Model):
    __tablename__ = "resume_analysis"

    id                  = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id          = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    filename            = db.Column(db.String(255), nullable=True)
    extracted_text      = db.Column(db.Text,    nullable=True)
    detected_skills     = db.Column(db.Text,    nullable=True)
    missing_skills      = db.Column(db.Text,    nullable=True)
    education_info      = db.Column(db.Text,    nullable=True)
    projects_info       = db.Column(db.Text,    nullable=True)
    internship_info     = db.Column(db.Text,    nullable=True)
    certifications_info = db.Column(db.Text,    nullable=True)
    ats_score           = db.Column(db.Integer, nullable=True)
    resume_score        = db.Column(db.Integer, nullable=True)
    skill_match_score   = db.Column(db.Integer, nullable=True)
    strengths           = db.Column(db.Text,    nullable=True)
    weaknesses          = db.Column(db.Text,    nullable=True)
    suggestions         = db.Column(db.Text,    nullable=True)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)


class TechnicalTest(db.Model):
    __tablename__ = "technical_tests"

    id              = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id      = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    subject         = db.Column(db.String(50),  nullable=False)
    total_questions = db.Column(db.Integer,     nullable=False)
    correct_answers = db.Column(db.Integer,     nullable=False)
    score           = db.Column(db.Integer,     nullable=False)
    time_taken_secs = db.Column(db.Integer,     nullable=True)
    answers_log     = db.Column(db.Text,        nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)


class AptitudeTest(db.Model):
    __tablename__ = "aptitude_tests"

    id              = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id      = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    category        = db.Column(db.String(50), nullable=False)
    total_questions = db.Column(db.Integer,   nullable=False)
    correct_answers = db.Column(db.Integer,   nullable=False)
    score           = db.Column(db.Integer,   nullable=False)
    time_taken_secs = db.Column(db.Integer,   nullable=True)
    answers_log     = db.Column(db.Text,      nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)


class CodingTest(db.Model):
    __tablename__ = "coding_tests"

    id                = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id        = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    problem_id        = db.Column(db.String(50),  nullable=False)
    problem_title     = db.Column(db.String(200), nullable=False)
    difficulty        = db.Column(db.String(20),  nullable=False)
    language          = db.Column(db.String(20),  nullable=False)
    code_submitted    = db.Column(db.Text,        nullable=True)
    test_cases_total  = db.Column(db.Integer,     nullable=True)
    test_cases_passed = db.Column(db.Integer,     nullable=True)
    score             = db.Column(db.Integer,     nullable=True)
    runtime_ms        = db.Column(db.Integer,     nullable=True)
    status            = db.Column(db.String(30),  nullable=True)
    time_complexity   = db.Column(db.String(50),  nullable=True)
    memory_used_kb    = db.Column(db.Integer,     nullable=True)
    created_at        = db.Column(db.DateTime, default=datetime.utcnow)


class PlacementPrediction(db.Model):
    __tablename__ = "placement_predictions"

    id                    = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id            = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    resume_score          = db.Column(db.Integer, nullable=True)
    technical_score       = db.Column(db.Integer, nullable=True)
    aptitude_score        = db.Column(db.Integer, nullable=True)
    coding_score          = db.Column(db.Integer, nullable=True)
    ats_score             = db.Column(db.Integer, nullable=True)
    skill_match_score     = db.Column(db.Integer, nullable=True)
    cgpa                  = db.Column(db.Float,   nullable=True)
    internships           = db.Column(db.Integer, nullable=True)
    projects_count        = db.Column(db.Integer, nullable=True)
    certifications        = db.Column(db.Integer, nullable=True)
    placement_probability = db.Column(db.Float,   nullable=True)
    readiness_label       = db.Column(db.String(20), nullable=True)
    overall_score         = db.Column(db.Integer, nullable=True)
    created_at            = db.Column(db.DateTime, default=datetime.utcnow)


class Recommendation(db.Model):
    __tablename__ = "recommendations"

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id    = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    prediction_id = db.Column(db.Integer, db.ForeignKey("placement_predictions.id"), nullable=True)
    category      = db.Column(db.String(50), nullable=False)
    suggestion    = db.Column(db.Text,       nullable=False)
    priority      = db.Column(db.String(10), nullable=False)
    is_completed  = db.Column(db.Boolean,    default=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)


class ModuleProgress(db.Model):
    __tablename__ = "module_progress"

    id              = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id      = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    resume_done     = db.Column(db.Boolean, default=False)
    technical_done  = db.Column(db.Boolean, default=False)
    aptitude_done   = db.Column(db.Boolean, default=False)
    coding_done     = db.Column(db.Boolean, default=False)
    profile_done    = db.Column(db.Boolean, default=False)
    resume_score    = db.Column(db.Integer, nullable=True)
    technical_score = db.Column(db.Integer, nullable=True)
    aptitude_score  = db.Column(db.Integer, nullable=True)
    coding_score    = db.Column(db.Integer, nullable=True)
    last_updated    = db.Column(db.DateTime, default=datetime.utcnow)


class Profile(db.Model):
    __tablename__ = "profiles"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), unique=True, nullable=False)
    photo_url  = db.Column(db.String(255), nullable=True)
    phone      = db.Column(db.String(20), nullable=True)
    college    = db.Column(db.String(200), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    cgpa       = db.Column(db.Float, nullable=True)
    languages  = db.Column(db.String(200), nullable=True)
    github     = db.Column(db.String(200), nullable=True)
    linkedin   = db.Column(db.String(200), nullable=True)
    portfolio  = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MockInterview(db.Model):
    __tablename__ = "mock_interviews"

    id                  = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id          = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    interview_type      = db.Column(db.String(50), nullable=False) # HR, Technical, Behavioral, Project, Resume-based
    duration_secs       = db.Column(db.Integer, default=0)
    answers_log         = db.Column(db.Text, nullable=True) # JSON array of Q&As
    confidence_score    = db.Column(db.Integer, default=0)
    eye_contact_score   = db.Column(db.Integer, default=0)
    speaking_speed      = db.Column(db.Integer, default=0) # Words per minute
    communication_score = db.Column(db.Integer, default=0)
    grammar_score       = db.Column(db.Integer, default=0)
    fluency_score       = db.Column(db.Integer, default=0)
    technical_accuracy  = db.Column(db.Integer, default=0)
    overall_score       = db.Column(db.Integer, default=0)
    overall_feedback    = db.Column(db.Text, nullable=True)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)


class Skill(db.Model):
    __tablename__ = "skills"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id  = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    name        = db.Column(db.String(100), nullable=False)
    proficiency = db.Column(db.String(50), nullable=True) # Beginner, Intermediate, Advanced


class Project(db.Model):
    __tablename__ = "projects"

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    title        = db.Column(db.String(200), nullable=False)
    description  = db.Column(db.Text, nullable=True)
    technologies = db.Column(db.String(200), nullable=True)
    github_url   = db.Column(db.String(255), nullable=True)
    live_url     = db.Column(db.String(255), nullable=True)


class Certificate(db.Model):
    __tablename__ = "certificates"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    name       = db.Column(db.String(200), nullable=False)
    issuer     = db.Column(db.String(200), nullable=False)
    issue_date = db.Column(db.String(100), nullable=True)
    url        = db.Column(db.String(255), nullable=True)


class Notification(db.Model):
    __tablename__ = "notifications"

    id                = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id        = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    message           = db.Column(db.String(500), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False) # Toast, Email, Reminder, Update
    is_read           = db.Column(db.Boolean, default=False)
    created_at        = db.Column(db.DateTime, default=datetime.utcnow)


class Leaderboard(db.Model):
    __tablename__ = "leaderboard"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), unique=True, nullable=False)
    points     = db.Column(db.Integer, default=0)
    rank       = db.Column(db.Integer, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Achievement(db.Model):
    __tablename__ = "achievements"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id  = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    title       = db.Column(db.String(150), nullable=False)
    badge_icon  = db.Column(db.String(50), nullable=True)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)


class CodingQuestion(db.Model):
    __tablename__ = "coding_questions"

    id                  = db.Column(db.Integer, primary_key=True, autoincrement=True)
    slug                = db.Column(db.String(100), unique=True, nullable=False)
    title               = db.Column(db.String(200), nullable=False)
    description         = db.Column(db.Text, nullable=False)
    languages_supported = db.Column(db.String(200), nullable=False) # comma-separated list
    category            = db.Column(db.String(50), nullable=False)  # e.g., Python, SQL, Javascript, Cpp, Java, DSA, ML
    difficulty          = db.Column(db.String(20), nullable=False)  # Easy, Medium, Hard
    topic               = db.Column(db.String(50), nullable=True)   # e.g., Arrays, Strings, Queries, Regression
    sample_test_cases   = db.Column(db.Text, nullable=True)        # JSON list
    hidden_test_cases   = db.Column(db.Text, nullable=True)        # JSON list
    constraints         = db.Column(db.Text, nullable=True)
    starter_code        = db.Column(db.Text, nullable=True)        # JSON dictionary
    solution            = db.Column(db.Text, nullable=True)
    explanation         = db.Column(db.Text, nullable=True)
    company_tags        = db.Column(db.String(200), nullable=True)
    estimated_time      = db.Column(db.Integer, nullable=True)      # in minutes


class ActiveAssessment(db.Model):
    __tablename__ = "active_assessments"

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    question_ids = db.Column(db.String(200), nullable=False) # comma-separated IDs
    started_at   = db.Column(db.DateTime, default=datetime.utcnow)
    duration_secs= db.Column(db.Integer, default=3600)       # 60 minutes default
    is_completed = db.Column(db.Boolean, default=False)
    answers_json = db.Column(db.Text, nullable=True)        # JSON containing code and score details per qid
    score        = db.Column(db.Integer, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)