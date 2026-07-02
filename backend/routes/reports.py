from flask import Blueprint, request, jsonify
from models import db, Student, ResumeAnalysis, TechnicalTest, AptitudeTest, CodingTest, PlacementPrediction, MockInterview, ActiveAssessment, CodingQuestion
from routes.auth import verify_token
import json

reports_bp = Blueprint("reports", __name__)

# ─────────────────────────────────────────
# GET /api/reports/resume
# ─────────────────────────────────────────
@reports_bp.route("/resume", methods=["GET"])
def get_resume_report():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    analysis = ResumeAnalysis.query.filter_by(student_id=student_id).order_by(ResumeAnalysis.created_at.desc()).first()
    
    if not analysis:
        return jsonify({"success": False, "message": "No resume analysis found. Please upload a resume first."}), 404

    return jsonify({
        "success": True,
        "report": {
            "title": "ATS & Resume Analysis Report",
            "student_name": student.name,
            "email": student.email,
            "filename": analysis.filename,
            "ats_score": analysis.ats_score,
            "resume_score": analysis.resume_score,
            "skill_match_score": analysis.skill_match_score,
            "detected_skills": json.loads(analysis.detected_skills or "[]"),
            "missing_skills": json.loads(analysis.missing_skills or "[]"),
            "strengths": json.loads(analysis.strengths or "[]"),
            "weaknesses": json.loads(analysis.weaknesses or "[]"),
            "suggestions": json.loads(analysis.suggestions or "[]"),
            "analyzed_at": analysis.created_at.isoformat()
        }
    }), 200

# ─────────────────────────────────────────
# GET /api/reports/performance
# ─────────────────────────────────────────
@reports_bp.route("/performance", methods=["GET"])
def get_performance_report():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    
    tech_tests = TechnicalTest.query.filter_by(student_id=student_id).all()
    apt_tests = AptitudeTest.query.filter_by(student_id=student_id).all()
    coding_tests = CodingTest.query.filter_by(student_id=student_id).all()

    tech_data = [{
        "subject": t.subject,
        "score": t.score,
        "correct": t.correct_answers,
        "total": t.total_questions,
        "taken_at": t.created_at.isoformat()
    } for t in tech_tests]

    apt_data = [{
        "category": a.category,
        "score": a.score,
        "correct": a.correct_answers,
        "total": a.total_questions,
        "taken_at": a.created_at.isoformat()
    } for a in apt_tests]

    coding_data = [{
        "problem": c.problem_title,
        "language": c.language,
        "score": c.score,
        "status": c.status,
        "taken_at": c.created_at.isoformat()
    } for c in coding_tests]

    # Calculate average scores
    avg_tech = round(sum(t.score for t in tech_tests) / len(tech_tests)) if tech_tests else 0
    avg_apt = round(sum(a.score for a in apt_tests) / len(apt_tests)) if apt_tests else 0
    avg_coding = round(sum(c.score for c in coding_tests) / len(coding_tests)) if coding_tests else 0

    return jsonify({
        "success": True,
        "report": {
            "title": "Comprehensive Test Performance Report",
            "student_name": student.name,
            "email": student.email,
            "summary": {
                "total_tests_taken": len(tech_tests) + len(apt_tests) + len(coding_tests),
                "average_technical_score": avg_tech,
                "average_aptitude_score": avg_apt,
                "average_coding_score": avg_coding,
                "cgpa": student.cgpa or 0
            },
            "technical_history": tech_data,
            "aptitude_history": apt_data,
            "coding_history": coding_data
        }
    }), 200

# ─────────────────────────────────────────
# GET /api/reports/interview/<id>
# ─────────────────────────────────────────
@reports_bp.route("/interview/<int:iid>", methods=["GET"])
def get_interview_report(iid):
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    interview = MockInterview.query.filter_by(id=iid, student_id=student_id).first()
    
    if not interview:
        return jsonify({"success": False, "message": "Interview not found."}), 404

    return jsonify({
        "success": True,
        "report": {
            "title": f"AI Mock Interview Report ({interview.interview_type})",
            "student_name": student.name,
            "email": student.email,
            "interview_type": interview.interview_type,
            "scores": {
                "overall": interview.overall_score,
                "technical_accuracy": interview.technical_accuracy,
                "communication": interview.communication_score,
                "fluency": interview.fluency_score,
                "grammar": interview.grammar_score,
                "speaking_speed": interview.speaking_speed,
                "confidence": interview.confidence_score,
                "eye_contact": interview.eye_contact_score
            },
            "feedback": interview.overall_feedback.split("\n"),
            "answers_log": json.loads(interview.answers_log or "[]"),
            "created_at": interview.created_at.isoformat()
        }
    }), 200

# ─────────────────────────────────────────
# GET /api/reports/prediction
# ─────────────────────────────────────────
@reports_bp.route("/prediction", methods=["GET"])
def get_prediction_report():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    pred = PlacementPrediction.query.filter_by(student_id=student_id).order_by(PlacementPrediction.created_at.desc()).first()
    
    if not pred:
        return jsonify({"success": False, "message": "No placement prediction found. Please run a prediction first."}), 404

    from models import Recommendation
    recs = Recommendation.query.filter_by(student_id=student_id, prediction_id=pred.id).all()
    recs_data = [{
        "category": r.category,
        "suggestion": r.suggestion,
        "priority": r.priority
    } for r in recs]

    return jsonify({
        "success": True,
        "report": {
            "title": "AI Placement Prediction & Career Roadmap",
            "student_name": student.name,
            "email": student.email,
            "college": student.college or "N/A",
            "branch": student.branch or "N/A",
            "probability": pred.placement_probability,
            "readiness_label": pred.readiness_label,
            "scores_used": {
                "cgpa": pred.cgpa,
                "resume_score": pred.resume_score,
                "technical_score": pred.technical_score,
                "aptitude_score": pred.aptitude_score,
                "coding_score": pred.coding_score,
                "ats_score": pred.ats_score,
                "skill_match_score": pred.skill_match_score,
                "projects_count": pred.projects_count,
                "internships": pred.internships,
                "certifications": pred.certifications
            },
            "recommendations": recs_data,
            "generated_at": pred.created_at.isoformat()
        }
    }), 200


# ─────────────────────────────────────────
# GET /api/reports/coding
# ─────────────────────────────────────────
@reports_bp.route("/coding", methods=["GET"])
def get_coding_report():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    active = ActiveAssessment.query.filter_by(
        student_id=student_id,
        is_completed=True
    ).order_by(ActiveAssessment.completed_at.desc()).first()

    if not active:
        return jsonify({"success": False, "message": "No completed coding assessment found."}), 404

    answers = json.loads(active.answers_json or "{}")
    q_ids = [int(x) for x in active.question_ids.split(",") if x]
    questions = CodingQuestion.query.filter(CodingQuestion.id.in_(q_ids)).all()
    q_map = {q.id: q for q in questions}

    details = []
    solved_count = 0
    failed_count = 0
    topic_scores = {}
    difficulty_stats = {"Easy": {"total": 0, "solved": 0}, "Medium": {"total": 0, "solved": 0}, "Hard": {"total": 0, "solved": 0}}

    for qid in q_ids:
        if qid not in q_map:
            continue
        q = q_map[qid]
        ans = answers.get(str(qid), {})
        q_score = ans.get("score", 0)
        status = ans.get("status", "Unattempted")
        
        difficulty_stats[q.difficulty]["total"] += 1
        if status == "Accepted":
            difficulty_stats[q.difficulty]["solved"] += 1
            solved_count += 1
        else:
            failed_count += 1

        topic_scores[q.topic] = topic_scores.get(q.topic, []) + [q_score]

        details.append({
            "title": q.title,
            "category": q.category,
            "difficulty": q.difficulty,
            "topic": q.topic,
            "status": status,
            "score": q_score,
            "language": ans.get("language", "N/A"),
            "passed": ans.get("passed", 0),
            "total": ans.get("total", 0)
        })

    strengths = []
    weaknesses = []
    recs = []

    for topic, score_list in topic_scores.items():
        avg_topic = sum(score_list) / len(score_list)
        if avg_topic >= 80:
            strengths.append(topic)
        elif avg_topic < 60:
            weaknesses.append(topic)
            recs.append(f"Practice more '{topic}' challenges to build coding confidence.")

    if not recs:
        recs.append("Great coding accuracy! Try solving harder algorithmic optimizations.")

    return jsonify({
        "success": True,
        "report": {
            "title": "AI Adaptive Coding Assessment Report",
            "student_name": student.name,
            "email": student.email,
            "overall_score": active.score,
            "solved_questions": solved_count,
            "failed_questions": failed_count,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recs,
            "difficulty_breakdown": difficulty_stats,
            "questions": details,
            "submitted_at": active.completed_at.isoformat() if active.completed_at else None
        }
    }), 200
