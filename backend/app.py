from flask        import Flask, jsonify
from flask_cors   import CORS
from flask_bcrypt import Bcrypt
from config       import Config
from models       import db

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
Bcrypt(app)
db.init_app(app)

from routes.auth       import auth_bp
from routes.predict    import predict_bp
from routes.resume     import resume_bp
from routes.technical  import technical_bp
from routes.aptitude   import aptitude_bp
from routes.profile    import profile_bp        # ← ADD
from routes.dashboard  import dashboard_bp      # ← ADD
from routes.coding     import coding_bp
from routes.interview  import interview_bp
from routes.notification import notification_bp
from routes.admin      import admin_bp
from routes.reports    import reports_bp

app.register_blueprint(auth_bp,       url_prefix="/api/auth")
app.register_blueprint(predict_bp,    url_prefix="/api")
app.register_blueprint(resume_bp,     url_prefix="/api/resume")
app.register_blueprint(technical_bp,  url_prefix="/api/technical")
app.register_blueprint(aptitude_bp,   url_prefix="/api/aptitude")
app.register_blueprint(profile_bp,    url_prefix="/api/profile")   # ← ADD
app.register_blueprint(dashboard_bp,  url_prefix="/api/dashboard") # ← ADD
app.register_blueprint(coding_bp,     url_prefix="/api/coding")
app.register_blueprint(interview_bp,  url_prefix="/api/interview")
app.register_blueprint(notification_bp, url_prefix="/api/notifications")
app.register_blueprint(admin_bp,      url_prefix="/api/admin")
app.register_blueprint(reports_bp,    url_prefix="/api/reports")


# ── Database Migration & Self-Healing Startup Hook ──
# Runs on both direct invocation and when imported by production WSGI servers like gunicorn
with app.app_context():
    # 1. Create tables if they do not exist
    db.create_all()
    
    # 2. Add missing columns dynamically to existing students table (Self-Healing Migrations)
    try:
        engine = db.engine
        inspector = db.inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('students')]
        
        new_cols = {
            "cgpa": "FLOAT",
            "backlogs": "INTEGER DEFAULT 0",
            "internships": "INTEGER DEFAULT 0",
            "projects_count": "INTEGER DEFAULT 0",
            "certifications": "INTEGER DEFAULT 0",
            "college_tier": "INTEGER DEFAULT 3",
            "project_complexity": "VARCHAR(50) DEFAULT 'Medium'",
            "github_url": "VARCHAR(255)",
            "linkedin_url": "VARCHAR(255)"
        }
        
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                alter_query = f"ALTER TABLE students ADD COLUMN {col_name} {col_type}"
                db.session.execute(db.text(alter_query))
                print(f"[MIGRATION] Added column '{col_name}' to 'students' table.")
        db.session.commit()
    except Exception as e:
        print(f"[MIGRATION WARNING] Alter table failed: {e}")
        db.session.rollback()

    # 3. Seed coding questions if empty
    try:
        from routes.coding import seed_coding_questions
        seed_coding_questions()
        print("[SUCCESS] Seeding coding questions completed.")
    except Exception as se:
        print(f"[WARNING] Seeding failed: {se}")
    print("[SUCCESS] Database tables ready.")


@app.route("/")
def health_check():
    return jsonify({"message": "Placement Predictor Backend Running ✅"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)