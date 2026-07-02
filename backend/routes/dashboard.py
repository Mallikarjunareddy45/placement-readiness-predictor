import json
from flask   import Blueprint, request, jsonify
from models  import (db, Student, ModuleProgress, ResumeAnalysis,
                     TechnicalTest, AptitudeTest, PlacementPrediction,
                     Recommendation, MockInterview)
from routes.auth import verify_token
from sqlalchemy  import func

dashboard_bp = Blueprint("dashboard", __name__)


# ─────────────────────────────────────────
# Helper: get best score for a subject
# ─────────────────────────────────────────
def best_technical_score(student_id, subject):
    result = db.session.query(
        func.max(TechnicalTest.score)
    ).filter_by(student_id=student_id, subject=subject).scalar()
    return result or 0


def best_aptitude_score(student_id, category):
    result = db.session.query(
        func.max(AptitudeTest.score)
    ).filter_by(student_id=student_id, category=category).scalar()
    return result or 0


# ─────────────────────────────────────────
# Helper: calculate overall technical score
# Average of best scores across all subjects
# ─────────────────────────────────────────
def get_overall_technical(student_id):
    subjects = ["Python", "SQL", "ML", "DSA", "AI"]
    scores   = [best_technical_score(student_id, s) for s in subjects]
    attempted = [s for s in scores if s > 0]
    if not attempted:
        return 0, {}
    avg = round(sum(attempted) / len(attempted))
    breakdown = {s: best_technical_score(student_id, s) for s in subjects}
    return avg, breakdown


# ─────────────────────────────────────────
# Helper: calculate overall aptitude score
# ─────────────────────────────────────────
def get_overall_aptitude(student_id):
    categories = ["Quantitative", "Logical", "Verbal"]
    scores     = [best_aptitude_score(student_id, c) for c in categories]
    attempted  = [s for s in scores if s > 0]
    if not attempted:
        return 0, {}
    avg = round(sum(attempted) / len(attempted))
    breakdown = {c: best_aptitude_score(student_id, c) for c in categories}
    return avg, breakdown


# ─────────────────────────────────────────
# Helper: generate readiness label
# ─────────────────────────────────────────
def get_label(score):
    if score >= 80:   return "Ready"
    if score >= 65:   return "Almost Ready"
    if score >= 50:   return "Needs Improvement"
    return "Not Ready"


def get_label_color(label):
    colors = {
        "Ready":            "#22c55e",
        "Almost Ready":     "#3b82f6",
        "Needs Improvement":"#f59e0b",
        "Not Ready":        "#ef4444"
    }
    return colors.get(label, "#6b7280")


# ─────────────────────────────────────────
# Helper: smart overall score calculation
# Weights match real placement importance
# ─────────────────────────────────────────
def calculate_overall_score(scores):
    weights = {
        "resume_score":           0.10,
        "ats_score":              0.10,
        "technical_score":        0.15,
        "aptitude_score":         0.10,
        "coding_score":           0.15,
        "mock_interview_score":   0.15,
        "projects_score":         0.05,
        "internships_score":      0.05,
        "certs_score":            0.05,
        "cgpa_score":             0.05,
        "skill_match_score":      0.05,
    }
    
    total = 0.0
    for key, weight in weights.items():
        total += scores.get(key, 0) * weight
        
    score = int(total)
    
    # Heuristic checks:
    # 1. Cap at 99%
    if score >= 99:
        score = 99
        
    # 2. Limit score if only resume and profile are uploaded
    non_zero_modules = sum(1 for k, v in scores.items() if v > 0)
    if non_zero_modules <= 2:
        score = min(max(score, 30), 50)
        
    # 3. Cap at 85% if core modules are pending
    core_modules_completed = all([
        scores.get("resume_score", 0) > 0,
        scores.get("technical_score", 0) > 0,
        scores.get("aptitude_score", 0) > 0,
        scores.get("coding_score", 0) > 0,
        scores.get("mock_interview_score", 0) > 0,
    ])
    if not core_modules_completed:
        score = min(score, 85)
        
    return score


# ─────────────────────────────────────────
# GET /api/dashboard
# Master endpoint — returns everything
# ─────────────────────────────────────────
@dashboard_bp.route("/", methods=["GET"])
def get_dashboard():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    # ── Fetch student ──
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"success": False, "message": "Student not found."}), 404

    # ── Module Progress ──
    progress = ModuleProgress.query.filter_by(
        student_id=student_id
    ).first()

    # ── Resume Analysis ──
    resume = ResumeAnalysis.query.filter_by(
        student_id=student_id
    ).order_by(ResumeAnalysis.created_at.desc()).first()

    resume_score      = resume.resume_score      if resume else 0
    ats_score         = resume.ats_score         if resume else 0
    skill_match_score = resume.skill_match_score if resume else 0
    detected_skills   = json.loads(resume.detected_skills or "[]") if resume else []
    missing_skills    = json.loads(resume.missing_skills  or "[]") if resume else []

    # ── Technical Scores ──
    tech_overall, tech_breakdown = get_overall_technical(student_id)

    # ── Aptitude Scores ──
    apt_overall, apt_breakdown = get_overall_aptitude(student_id)

    # ── Mock Interview Scores ──
    interview = MockInterview.query.filter_by(
        student_id=student_id
    ).order_by(MockInterview.created_at.desc()).first()

    mock_interview_score = interview.overall_score if interview else 0
    communication_score = interview.communication_score if interview else apt_breakdown.get("Verbal", 0)

    # ── Latest Prediction ──
    prediction = PlacementPrediction.query.filter_by(
        student_id=student_id
    ).order_by(PlacementPrediction.created_at.desc()).first()

    placement_probability = prediction.placement_probability if prediction else None
    readiness_label       = prediction.readiness_label       if prediction else None

    # ── CGPA score (normalize to 0-100) ──
    cgpa       = student.cgpa or 0
    cgpa_score = min(round((cgpa / 10.0) * 100), 100)

    # ── Projects score ──
    projects       = student.projects_count or 0
    projects_score = min(projects * 15, 100)

    # ── Certifications score ──
    certs      = student.certifications or 0
    cert_score = min(certs * 15, 100)

    # ── DSA score from technical breakdown ──
    dsa_score = tech_breakdown.get("DSA", 0)

    # ── Composite overall score ──
    score_inputs = {
        "resume_score":           resume_score,
        "ats_score":              ats_score,
        "technical_score":        tech_overall,
        "aptitude_score":         apt_overall,
        "coding_score":           dsa_score if dsa_score > 0 else tech_breakdown.get("DSA", 0),
        "mock_interview_score":   mock_interview_score,
        "projects_score":         projects_score,
        "internships_score":      min((student.internships or 0) * 50, 100),
        "certs_score":            cert_score,
        "cgpa_score":             cgpa_score,
        "skill_match_score":      skill_match_score,
    }
    overall_score = calculate_overall_score(score_inputs)

    # Automatically synchronize dynamic prediction value into database
    if prediction:
        prediction.placement_probability = overall_score
        prediction.overall_score = overall_score
        prediction.readiness_label = get_label(overall_score)
    else:
        prediction = PlacementPrediction(
            student_id=student_id,
            resume_score=resume_score,
            technical_score=tech_overall,
            aptitude_score=apt_overall,
            coding_score=dsa_score,
            ats_score=ats_score,
            skill_match_score=skill_match_score,
            cgpa=student.cgpa,
            internships=student.internships,
            projects_count=student.projects_count,
            certifications=student.certifications,
            placement_probability=overall_score,
            overall_score=overall_score,
            readiness_label=get_label(overall_score)
        )
        db.session.add(prediction)
    db.session.commit()

    placement_probability = overall_score
    readiness_label = get_label(overall_score)
    label_color = get_label_color(readiness_label)

    # ── Modules completion status ──
    modules_status = {
        "profile": {
            "name":      "Profile Completion",
            "done":      progress.profile_done if progress else False,
            "score":     cgpa_score,
            "icon":      "👤",
            "route":     "/profile"
        },
        "resume": {
            "name":      "Resume Analysis",
            "done":      progress.resume_done if progress else False,
            "score":     resume_score,
            "icon":      "📄",
            "route":     "/resume"
        },
        "technical": {
            "name":      "Technical Assessment",
            "done":      progress.technical_done if progress else False,
            "score":     tech_overall,
            "icon":      "💻",
            "route":     "/technical"
        },
        "aptitude": {
            "name":      "Aptitude Assessment",
            "done":      progress.aptitude_done if progress else False,
            "score":     apt_overall,
            "icon":      "🧠",
            "route":     "/aptitude"
        },
        "coding": {
            "name":      "Coding Assessment",
            "done":      progress.coding_done if progress else False,
            "score":     progress.coding_score if progress else 0,
            "icon":      "⌨️",
            "route":     "/coding"
        },
    }

    modules_completed = sum(1 for m in modules_status.values() if m["done"])
    modules_total     = len(modules_status)
    modules_pct       = round((modules_completed / modules_total) * 100)

    # ── Score breakdown for charts ──
    score_breakdown = {
        "Resume Score":        resume_score,
        "ATS Score":           ats_score,
        "Skill Match":         skill_match_score,
        "Technical Score":     tech_overall,
        "Aptitude Score":      apt_overall,
        "CGPA Score":          cgpa_score,
        "Projects Score":      projects_score,
        "Certifications":      cert_score,
    }

    # ── Technical subject breakdown ──
    technical_subjects = {
        "Python": tech_breakdown.get("Python", 0),
        "SQL":    tech_breakdown.get("SQL",    0),
        "ML":     tech_breakdown.get("ML",     0),
        "DSA":    tech_breakdown.get("DSA",    0),
        "AI":     tech_breakdown.get("AI",     0),
    }

    # ── Aptitude category breakdown ──
    aptitude_categories = {
        "Quantitative": apt_breakdown.get("Quantitative", 0),
        "Logical":      apt_breakdown.get("Logical",      0),
        "Verbal":       apt_breakdown.get("Verbal",       0),
    }

    # ── Identify weak areas ──
    weak_areas   = []
    strong_areas = []

    checks = [
        ("DSA & Coding",    dsa_score,        60),
        ("Technical Skills",tech_overall,     60),
        ("Aptitude",        apt_overall,      60),
        ("Resume",          resume_score,     65),
        ("ATS Score",       ats_score,        60),
        ("Quantitative",    apt_breakdown.get("Quantitative", 0), 55),
        ("Logical Reasoning",apt_breakdown.get("Logical", 0),     55),
        ("Verbal Ability",  apt_breakdown.get("Verbal",   0),     55),
        ("Python",          tech_breakdown.get("Python",  0),     55),
        ("SQL",             tech_breakdown.get("SQL",     0),     55),
        ("CGPA",            cgpa_score,       65),
    ]

    for name, score, threshold in checks:
        if score == 0:
            weak_areas.append({"area": name, "score": score, "status": "Not Attempted"})
        elif score < threshold:
            weak_areas.append({"area": name, "score": score, "status": "Needs Improvement"})
        elif score >= threshold + 15:
            strong_areas.append({"area": name, "score": score, "status": "Strong"})

    # ── Latest recommendations ──
    recommendations = Recommendation.query.filter_by(
        student_id=student_id
    ).order_by(Recommendation.created_at.desc()).limit(6).all()

    recs_list = [{
        "category":   r.category,
        "suggestion": r.suggestion,
        "priority":   r.priority,
    } for r in recommendations]

    # ── Test history counts ──
    tech_tests_count = TechnicalTest.query.filter_by(student_id=student_id).count()
    apt_tests_count  = AptitudeTest.query.filter_by(student_id=student_id).count()

    # ── Profile completion ──
    profile_fields = {
        "name":            bool(student.name),
        "cgpa":            student.cgpa is not None,
        "branch":          bool(student.branch),
        "college":         bool(student.college),
        "graduation_year": student.graduation_year is not None,
        "github_url":      bool(student.github_url),
        "linkedin_url":    bool(student.linkedin_url),
    }
    profile_pct = round(sum(profile_fields.values()) / len(profile_fields) * 100)

    # ── Compile Recent Activities ──
    activities = []
    if resume:
        activities.append({
            "type": "resume",
            "message": "Resume uploaded and ATS analyzed",
            "date": resume.created_at.isoformat()
        })
    
    # Latest technical tests
    latest_tech = TechnicalTest.query.filter_by(student_id=student_id).order_by(TechnicalTest.created_at.desc()).limit(3).all()
    for t in latest_tech:
        activities.append({
            "type": "technical",
            "message": f"Completed Technical Test in {t.subject}",
            "date": t.created_at.isoformat()
        })
        
    # Latest aptitude tests
    latest_apt = AptitudeTest.query.filter_by(student_id=student_id).order_by(AptitudeTest.created_at.desc()).limit(3).all()
    for a in latest_apt:
        activities.append({
            "type": "aptitude",
            "message": f"Completed Aptitude Test in {a.category}",
            "date": a.created_at.isoformat()
        })
        
    # Latest mock interview
    if interview:
        activities.append({
            "type": "interview",
            "message": f"Completed AI Mock Interview ({interview.interview_type})",
            "date": interview.created_at.isoformat()
        })
        
    # Sort activities by date desc
    activities = sorted(activities, key=lambda x: x["date"], reverse=True)[:5]

    # ── Dynamic AI Confidence Score calculation ──
    raw_conf = 0
    raw_conf += min(profile_pct * 0.20, 20)
    if resume is not None:
        raw_conf += 15
    if ats_score > 0:
        raw_conf += 15
    raw_conf += min(tech_tests_count * 5, 15)
    raw_conf += min(apt_tests_count * 5, 15)
    if progress and progress.coding_done:
        raw_conf += 10
    if interview is not None:
        raw_conf += 10
    predictions_run = PlacementPrediction.query.filter_by(student_id=student_id).count()
    if predictions_run > 0:
        raw_conf += 5
        
    ai_confidence_score = 40 + int((raw_conf / 100.0) * 59)
    ai_confidence_score = min(max(ai_confidence_score, 40), 99)

    if ai_confidence_score >= 90:
        ai_confidence_label = "Very High"
    elif ai_confidence_score >= 80:
        ai_confidence_label = "High"
    elif ai_confidence_score >= 60:
        ai_confidence_label = "Medium"
    else:
        ai_confidence_label = "Low"

    # ── Build complete dashboard response ──
    return jsonify({
        "success": True,

        # Student info
        "student": {
            "id":              student.id,
            "name":            student.name,
            "email":           student.email,
            "cgpa":            student.cgpa,
            "branch":          student.branch,
            "college":         student.college,
            "graduation_year": student.graduation_year,
            "internships":     student.internships or 0,
            "projects_count":  student.projects_count or 0,
            "certifications":  student.certifications or 0,
            "github_url":      student.github_url,
            "linkedin_url":    student.linkedin_url,
        },

        # Overall placement readiness
        "placement": {
            "overall_score":          overall_score,
            "placement_probability":  placement_probability or overall_score,
            "readiness_label":        readiness_label,
            "label_color":            label_color,
            "last_prediction_at":     prediction.created_at.isoformat() if prediction else None,
            "ai_confidence_score":    ai_confidence_score,
            "ai_confidence_label":    ai_confidence_label,
        },

        # Individual module scores
        "scores": {
            "resume_score":           resume_score,
            "ats_score":              ats_score,
            "skill_match_score":      skill_match_score,
            "technical_score":        tech_overall,
            "aptitude_score":         apt_overall,
            "cgpa_score":             cgpa_score,
            "projects_score":         projects_score,
            "cert_score":             cert_score,
            "dsa_score":              dsa_score,
            "mock_interview_score":   mock_interview_score,
            "communication_score":    communication_score,
        },

        # Detailed breakdowns for charts
        "breakdowns": {
            "score_breakdown":      score_breakdown,
            "technical_subjects":   technical_subjects,
            "aptitude_categories":  aptitude_categories,
        },

        # Module completion tracking
        "modules": {
            "status":     modules_status,
            "completed":  modules_completed,
            "total":      modules_total,
            "percentage": modules_pct,
        },

        # Profile completion
        "profile_completion": {
            "percentage":    profile_pct,
            "missing_fields": [k for k, v in profile_fields.items() if not v],
        },

        # Skills from resume
        "skills": {
            "detected": detected_skills,
            "missing":  missing_skills,
        },

        # Weak and strong areas
        "analysis": {
            "weak_areas":   weak_areas,
            "strong_areas": strong_areas,
        },

        # Latest AI recommendations
        "recommendations": recs_list,

        # Activity stats
        "stats": {
            "technical_tests_taken": tech_tests_count,
            "aptitude_tests_taken":  apt_tests_count,
            "resume_uploaded":       resume is not None,
            "predictions_run":       PlacementPrediction.query.filter_by(student_id=student_id).count(),
        },
        
        # Recent activities log
        "recent_activities": activities
    }), 200


# ─────────────────────────────────────────
# GET /api/dashboard/scores-only
# Lightweight endpoint — scores only
# Used by predict route to auto-fill inputs
# ─────────────────────────────────────────
@dashboard_bp.route("/scores-only", methods=["GET"])
def get_scores_only():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    resume  = ResumeAnalysis.query.filter_by(
        student_id=student_id
    ).order_by(ResumeAnalysis.created_at.desc()).first()

    tech_overall, tech_breakdown = get_overall_technical(student_id)
    apt_overall,  apt_breakdown  = get_overall_aptitude(student_id)

    return jsonify({
        "success": True,
        "scores": {
            "cgpa":                float(student.cgpa)       if student.cgpa else None,
            "internships":         student.internships        or 0,
            "projects_count":      student.projects_count     or 0,
            "certifications":      student.certifications      or 0,
            "resume_score":        resume.resume_score        if resume else None,
            "ats_score":           resume.ats_score           if resume else None,
            "skill_match_score":   resume.skill_match_score   if resume else None,
            "technical_score":     tech_overall               or None,
            "aptitude_score":      apt_overall                or None,
            "dsa_score":           tech_breakdown.get("DSA")  or None,
            "coding_score":        tech_breakdown.get("Python") or None,
            "communication_score": apt_breakdown.get("Verbal") or None,
        },
        "ready_for_prediction": all([
            student.cgpa,
            resume is not None,
            tech_overall > 0,
            apt_overall  > 0,
        ])
    }), 200


# ─────────────────────────────────────────
# GET /api/dashboard/history
# Returns score history for trend charts
# ─────────────────────────────────────────
@dashboard_bp.route("/history", methods=["GET"])
def get_history():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    # Technical test history
    tech_history = TechnicalTest.query.filter_by(
        student_id=student_id
    ).order_by(TechnicalTest.created_at.asc()).all()

    # Aptitude test history
    apt_history = AptitudeTest.query.filter_by(
        student_id=student_id
    ).order_by(AptitudeTest.created_at.asc()).all()

    # Prediction history
    pred_history = PlacementPrediction.query.filter_by(
        student_id=student_id
    ).order_by(PlacementPrediction.created_at.asc()).all()

    return jsonify({
        "success": True,
        "history": {
            "technical": [{
                "subject":  t.subject,
                "score":    t.score,
                "date":     t.created_at.isoformat()
            } for t in tech_history],

            "aptitude": [{
                "category": t.category,
                "score":    t.score,
                "date":     t.created_at.isoformat()
            } for t in apt_history],

            "predictions": [{
                "overall_score":         p.overall_score,
                "placement_probability": p.placement_probability,
                "readiness_label":       p.readiness_label,
                "date":                  p.created_at.isoformat()
            } for p in pred_history],
        }
    }), 200