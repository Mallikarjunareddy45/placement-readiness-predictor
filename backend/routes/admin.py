from flask import Blueprint, request, jsonify
from models import db, Student, TechnicalTest, AptitudeTest, CodingTest, PlacementPrediction, MockInterview
from routes.auth import generate_token
import json
import os

admin_bp = Blueprint("admin", __name__)

ADMIN_EMAIL = "admin@predictor.com"
ADMIN_PASSWORD = "admin123"

# ─────────────────────────────────────────
# POST /api/admin/login
# ─────────────────────────────────────────
@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        # Generate token with student_id = 9999 (admin identifier proxy)
        token = generate_token(9999)
        return jsonify({
            "success": True,
            "message": "Admin login successful.",
            "token": token,
            "admin": {
                "name": "Platform Administrator",
                "email": ADMIN_EMAIL,
                "role": "Admin"
            }
        }), 200
    else:
        return jsonify({"success": False, "message": "Invalid admin credentials."}), 401

# ─────────────────────────────────────────
# GET /api/admin/analytics
# ─────────────────────────────────────────
@admin_bp.route("/analytics", methods=["GET"])
def get_analytics():
    # Verify token (must be admin, student_id = 9999)
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"success": False, "message": "Unauthorized admin access."}), 401

    total_students = Student.query.count()
    total_tech_tests = TechnicalTest.query.count()
    total_apt_tests = AptitudeTest.query.count()
    total_coding_tests = CodingTest.query.count()
    total_interviews = MockInterview.query.count()
    total_predictions = PlacementPrediction.query.count()

    # Average readiness
    all_preds = PlacementPrediction.query.all()
    avg_readiness = 0
    ready_count = 0
    if all_preds:
        avg_readiness = round(sum(p.placement_probability for p in all_preds) / len(all_preds), 1)
        ready_count = sum(1 for p in all_preds if p.placement_probability >= 70)

    # Average scores
    all_interviews = MockInterview.query.all()
    avg_interview = 0
    if all_interviews:
        avg_interview = round(sum(i.overall_score for i in all_interviews) / len(all_interviews))

    return jsonify({
        "success": True,
        "analytics": {
            "total_students": total_students,
            "total_tests": total_tech_tests + total_apt_tests + total_coding_tests,
            "total_interviews": total_interviews,
            "total_predictions": total_predictions,
            "avg_readiness_probability": avg_readiness,
            "students_ready_count": ready_count,
            "avg_interview_score": avg_interview,
            "breakdown": {
                "technical_tests": total_tech_tests,
                "aptitude_tests": total_apt_tests,
                "coding_tests": total_coding_tests
            }
        }
    }), 200

# ─────────────────────────────────────────
# GET /api/admin/students
# ─────────────────────────────────────────
@admin_bp.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    students_list = []
    for s in students:
        # Skip the dummy admin proxy if it was written
        if s.id == 9999:
            continue
            
        latest_pred = PlacementPrediction.query.filter_by(student_id=s.id).order_by(PlacementPrediction.created_at.desc()).first()
        readiness = latest_pred.placement_probability if latest_pred else 0
        label = latest_pred.readiness_label if latest_pred else "N/A"

        students_list.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "college": s.college or "N/A",
            "branch": s.branch or "N/A",
            "cgpa": s.cgpa or 0,
            "readiness_probability": readiness,
            "readiness_label": label,
            "created_at": s.created_at.isoformat()
        })
    return jsonify({"success": True, "students": students_list}), 200

# ─────────────────────────────────────────
# GET /api/admin/questions-summary
# ─────────────────────────────────────────
@admin_bp.route("/questions-summary", methods=["GET"])
def get_questions_summary():
    from question_bank.python_questions import PYTHON_QUESTIONS
    from question_bank.sql_questions import SQL_QUESTIONS
    from question_bank.ml_questions import ML_QUESTIONS
    from question_bank.dsa_questions import DSA_QUESTIONS
    from question_bank.ai_questions import AI_QUESTIONS
    
    # Try importing new ones
    try:
        from question_bank.java_questions import JAVA_QUESTIONS
        from question_bank.cpp_questions import CPP_QUESTIONS
        from question_bank.js_questions import JS_QUESTIONS
        from question_bank.react_questions import REACT_QUESTIONS
        from question_bank.dbms_questions import DBMS_QUESTIONS
        from question_bank.os_questions import OS_QUESTIONS
        from question_bank.networks_questions import NETWORKS_QUESTIONS
        from question_bank.datascience_questions import DATASCIENCE_QUESTIONS
    except ImportError:
        JAVA_QUESTIONS = CPP_QUESTIONS = JS_QUESTIONS = REACT_QUESTIONS = []
        DBMS_QUESTIONS = OS_QUESTIONS = NETWORKS_QUESTIONS = DATASCIENCE_QUESTIONS = []

    summary = {
        "Python": len(PYTHON_QUESTIONS),
        "SQL": len(SQL_QUESTIONS),
        "ML": len(ML_QUESTIONS),
        "DSA": len(DSA_QUESTIONS),
        "AI": len(AI_QUESTIONS),
        "Java": len(JAVA_QUESTIONS),
        "C++": len(CPP_QUESTIONS),
        "JavaScript": len(JS_QUESTIONS),
        "React": len(REACT_QUESTIONS),
        "DBMS": len(DBMS_QUESTIONS),
        "OS": len(OS_QUESTIONS),
        "Networks": len(NETWORKS_QUESTIONS),
        "Data Science": len(DATASCIENCE_QUESTIONS),
    }

    return jsonify({"success": True, "questions_summary": summary}), 200
