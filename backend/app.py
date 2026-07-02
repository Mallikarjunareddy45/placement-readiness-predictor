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


@app.route("/")
def health_check():
    return jsonify({"message": "Placement Predictor Backend Running ✅"})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        try:
            from routes.coding import seed_coding_questions
            seed_coding_questions()
            print("[SUCCESS] Seeding coding questions completed.")
        except Exception as se:
            print(f"[WARNING] Seeding failed: {se}")
        print("[SUCCESS] Database tables ready.")
    app.run(debug=True, port=5000)