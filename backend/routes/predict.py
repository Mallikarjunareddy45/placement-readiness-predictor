from flask   import Blueprint, request, jsonify
from models  import db, PlacementPrediction, Recommendation, ModuleProgress, Student
from routes.auth import verify_token
import joblib, numpy as np, os, json

predict_bp = Blueprint("predict", __name__)

# ── Load model artifacts once at startup ──
ML_DIR         = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml"))
MODEL_PATH     = os.path.join(ML_DIR, "model.pkl")
SCALER_PATH    = os.path.join(ML_DIR, "scaler.pkl")
FEATURES_PATH  = os.path.join(ML_DIR, "feature_columns.pkl")

try:
    model           = joblib.load(MODEL_PATH)
    scaler          = joblib.load(SCALER_PATH)
    FEATURE_COLUMNS = joblib.load(FEATURES_PATH)
    print(f"[SUCCESS] ML model loaded. Features: {FEATURE_COLUMNS}")
except Exception as e:
    model = scaler = None
    FEATURE_COLUMNS = []
    print(f"[WARNING] ML model not loaded: {e}")


# ─────────────────────────────────────────
# Readiness label from probability
# ─────────────────────────────────────────
def get_readiness_label(prob):
    if prob >= 80:   return "Ready"
    if prob >= 65:   return "Almost Ready"
    if prob >= 50:   return "Needs Improvement"
    return "Not Ready"


def calculate_realistic_prediction(scores):
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
# Confidence label from probability
# ─────────────────────────────────────────
def get_confidence(prob):
    if prob >= 85 or prob <= 15: return "High"
    if prob >= 70 or prob <= 30: return "Medium"
    return "Low"


# ─────────────────────────────────────────
# Dynamic recommendation engine
# Uses actual feature values to generate
# personalized, prioritized suggestions
# ─────────────────────────────────────────
def generate_recommendations(profile, feature_importances):
    recs = []

    coding      = profile.get("coding_score", 50)
    dsa         = profile.get("dsa_score", 50)
    mock        = profile.get("mock_interview_score", 50)
    cgpa        = profile.get("cgpa", 7.0)
    comm        = profile.get("communication_score", 50)
    resume      = profile.get("resume_score", 50)
    aptitude    = profile.get("aptitude_score", 50)
    technical   = profile.get("technical_score", 50)
    internships = profile.get("internships", 0)
    projects    = profile.get("projects_count", 0)
    certs       = profile.get("certifications", 0)
    github      = profile.get("github_score", 0)
    ats         = profile.get("ats_score", 50)
    backlogs    = profile.get("backlogs", 0)
    skill_match = profile.get("skill_match_score", 50)

    # Priority based on feature importance × gap from threshold
    if dsa < 50:
        gap = 50 - dsa
        recs.append({"category": "DSA & Problem Solving",
            "suggestion": f"Your DSA score is {dsa}/100. Solve at least 3 LeetCode problems daily — focus on Arrays, Trees, and Dynamic Programming. Target 65+ to clear coding rounds.",
            "priority": "High", "gap": gap})

    if coding < 55:
        gap = 55 - coding
        recs.append({"category": "Coding Skills",
            "suggestion": f"Coding score {coding}/100 needs urgent work. Complete HackerRank Python and SQL tracks. Practice timed coding challenges daily.",
            "priority": "High", "gap": gap})

    if aptitude < 55:
        gap = 55 - aptitude
        recs.append({"category": "Aptitude",
            "suggestion": f"Aptitude score {aptitude}/100 is below the company filter threshold. Practice Quantitative, Logical, and Verbal sections on IndiaBix daily for 30 minutes.",
            "priority": "High", "gap": gap})

    if cgpa < 6.5:
        recs.append({"category": "Academics",
            "suggestion": f"CGPA {cgpa} is below the 6.5 cutoff used by most companies. Compensate with a strong projects portfolio, internships, and certifications.",
            "priority": "High", "gap": int((6.5 - cgpa) * 10)})

    if backlogs > 0:
        recs.append({"category": "Backlogs",
            "suggestion": f"You have {backlogs} active backlog(s). Clear them immediately — most companies have a zero-backlog policy at the time of joining.",
            "priority": "High", "gap": backlogs * 20})

    if technical < 55:
        gap = 55 - technical
        recs.append({"category": "Technical Knowledge",
            "suggestion": f"Technical score {technical}/100. Revise OS, DBMS, Computer Networks, and OOP concepts. These appear in every technical interview.",
            "priority": "High" if technical < 40 else "Medium", "gap": gap})

    if mock < 60:
        gap = 60 - mock
        recs.append({"category": "Mock Interviews",
            "suggestion": f"Mock interview score {mock}/100. Book 2 mock interviews on Pramp or Interviewing.io this week. Focus on thinking out loud and structured answers.",
            "priority": "High" if mock < 45 else "Medium", "gap": gap})

    if comm < 55:
        gap = 55 - comm
        recs.append({"category": "Communication",
            "suggestion": f"Communication score {comm}/100. Record yourself answering 'Tell me about yourself' and 'Describe your project'. Practice STAR method for behavioral questions.",
            "priority": "Medium", "gap": gap})

    if resume < 60:
        gap = 60 - resume
        recs.append({"category": "Resume",
            "suggestion": f"Resume score {resume}/100. Use a single-column ATS format. Add measurable impact: 'Improved model accuracy by 12%'. Remove irrelevant content.",
            "priority": "Medium", "gap": gap})

    if ats < 60:
        gap = 60 - ats
        recs.append({"category": "ATS Optimization",
            "suggestion": f"ATS score {ats}/100. Add keywords from job descriptions: 'REST API', 'Machine Learning', 'Python', 'SQL', 'Git'. Your resume may be filtered before human review.",
            "priority": "Medium", "gap": gap})

    if projects < 2:
        recs.append({"category": "Projects",
            "suggestion": f"Only {projects} project(s) detected. Build at least 2 full-stack projects with ML components. Deploy them and add GitHub links to your resume.",
            "priority": "Medium", "gap": (2 - projects) * 15})

    if internships == 0:
        recs.append({"category": "Internship",
            "suggestion": "No internship experience. Apply to virtual internships on Internshala or LinkedIn. A 4-week internship significantly differentiates your profile.",
            "priority": "Medium", "gap": 20})

    if github < 40:
        gap = 40 - github
        recs.append({"category": "GitHub Activity",
            "suggestion": f"GitHub score {github}/100. Make daily commits, contribute to open source, and maintain a clean README on all repositories. Recruiters check GitHub.",
            "priority": "Medium" if github < 25 else "Low", "gap": gap})

    if skill_match < 55:
        gap = 55 - skill_match
        recs.append({"category": "Market Skills",
            "suggestion": f"Skill match {skill_match}/100. Study the most-listed skills in job descriptions for your target role. Focus on Python, SQL, and cloud basics.",
            "priority": "Low", "gap": gap})

    if certs < 2:
        recs.append({"category": "Certifications",
            "suggestion": f"Only {certs} certification(s). Earn Google ML Crash Course, AWS Cloud Practitioner, or NPTEL certifications — all free and recognized by recruiters.",
            "priority": "Low", "gap": (2 - certs) * 10})

    # Sort by priority then by gap size
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recs.sort(key=lambda x: (priority_order[x["priority"]], -x.get("gap", 0)))

    # Remove gap field from output
    for r in recs:
        r.pop("gap", None)

    return recs


# ─────────────────────────────────────────
# Feature importance per student
# Explains WHY the prediction was made
# ─────────────────────────────────────────
def explain_prediction(profile, probability):
    feature_impact = {}

    # Score each feature's contribution to readiness
    checks = {
        "High Coding Score":       profile.get("coding_score", 0) >= 70,
        "Strong DSA Skills":       profile.get("dsa_score", 0) >= 60,
        "Good Aptitude":           profile.get("aptitude_score", 0) >= 65,
        "Strong Technical Skills": profile.get("technical_score", 0) >= 65,
        "Good Mock Interview":     profile.get("mock_interview_score", 0) >= 65,
        "Good Communication":      profile.get("communication_score", 0) >= 65,
        "CGPA Above Cutoff":       profile.get("cgpa", 0) >= 6.5,
        "Has Internship":          profile.get("internships", 0) >= 1,
        "Has Projects":            profile.get("projects_count", 0) >= 2,
        "Good Resume":             profile.get("resume_score", 0) >= 65,
        "Has Certifications":      profile.get("certifications", 0) >= 2,
        "Active on GitHub":        profile.get("github_score", 0) >= 50,
        "Good Skill Match":        profile.get("skill_match_score", 0) >= 60,
        "No Backlogs":             profile.get("backlogs", 0) == 0,
    }

    top_reasons  = [k for k, v in checks.items() if v][:5]
    weak_areas   = [k for k, v in checks.items() if not v][:5]

    return top_reasons, weak_areas


# ─────────────────────────────────────────
# POST /api/predict
# ─────────────────────────────────────────
@predict_bp.route("/predict", methods=["POST"])
def predict():
    # ── Auth ──
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    if model is None:
        return jsonify({"success": False, "message": "ML model not loaded."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    # ── Build feature vector using saved feature list ──
    complexity_map = {"Low": 1, "Medium": 2, "High": 3}

    profile = {
        "cgpa":                  float(data.get("cgpa", 7.0)),
        "coding_score":          int(data.get("coding_score", 50)),
        "dsa_score":             int(data.get("dsa_score", data.get("coding_score", 50))),
        "projects_count":        int(data.get("projects_count", 0)),
        "project_complexity":    complexity_map.get(data.get("project_complexity","Medium"), 2),
        "internships":           int(data.get("internships", 0)),
        "communication_score":   int(data.get("communication_score", 50)),
        "mock_interview_score":  int(data.get("mock_interview_score", 50)),
        "resume_score":          int(data.get("resume_score", 50)),
        "certifications":        int(data.get("certifications", 0)),
        "aptitude_score":        int(data.get("aptitude_score", 50)),
        "technical_score":       int(data.get("technical_score", 50)),
        "skill_match_score":     int(data.get("skill_match_score", 50)),
        "ats_score":             int(data.get("ats_score", 50)),
        "github_score":          int(data.get("github_score", 0)),
        "backlogs":              int(data.get("backlogs", 0)),
        "college_tier":          int(data.get("college_tier", 2)),
    }

    # Build feature array in exact same order as training
    feature_vector = np.array([[profile[col] for col in FEATURE_COLUMNS]])

    # ── Calculate dynamic weighted prediction ──
    weighted_inputs = {
        "resume_score":           profile.get("resume_score", 0),
        "ats_score":              profile.get("ats_score", 0),
        "technical_score":        profile.get("technical_score", 0),
        "aptitude_score":         profile.get("aptitude_score", 0),
        "coding_score":           profile.get("coding_score", 0),
        "mock_interview_score":   profile.get("mock_interview_score", 0),
        "projects_score":         min(profile.get("projects_count", 0) * 15, 100),
        "internships_score":      min(profile.get("internships", 0) * 50, 100),
        "certs_score":            min(profile.get("certifications", 0) * 15, 100),
        "cgpa_score":             min(round((profile.get("cgpa", 7.0) / 10.0) * 100), 100),
        "skill_match_score":      profile.get("skill_match_score", 0),
    }
    
    prob_pct    = calculate_realistic_prediction(weighted_inputs)
    label       = get_readiness_label(prob_pct)
    ready       = bool(prob_pct >= 65)

    # ── Explain prediction ──
    top_reasons, weak_areas = explain_prediction(profile, prob_pct)

    # ── Generate recommendations ──
    feature_importances = {}
    if hasattr(model, 'feature_importances_'):
        for col, imp in zip(FEATURE_COLUMNS, model.feature_importances_):
            feature_importances[col] = float(imp)

    recs = generate_recommendations(profile, feature_importances)

    # ── Save to database ──
    pred_record = PlacementPrediction(
        student_id            = student_id,
        resume_score          = profile.get("resume_score"),
        technical_score       = profile.get("technical_score"),
        aptitude_score        = profile.get("aptitude_score"),
        coding_score          = profile.get("coding_score"),
        ats_score             = profile.get("ats_score"),
        skill_match_score     = profile.get("skill_match_score"),
        cgpa                  = profile.get("cgpa"),
        internships           = profile.get("internships"),
        projects_count        = profile.get("projects_count"),
        certifications        = profile.get("certifications"),
        placement_probability = prob_pct,
        readiness_label       = label,
        overall_score         = int(prob_pct)
    )
    db.session.add(pred_record)
    db.session.flush()

    for rec in recs:
        db.session.add(Recommendation(
            student_id    = student_id,
            prediction_id = pred_record.id,
            category      = rec["category"],
            suggestion    = rec["suggestion"],
            priority      = rec["priority"]
        ))

    # Update module progress
    progress = ModuleProgress.query.filter_by(student_id=student_id).first()
    if not progress:
        progress = ModuleProgress(student_id=student_id)
        db.session.add(progress)

    db.session.commit()

    # ── Dynamic AI Confidence Score calculation ──
    student = Student.query.get(student_id)
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
    
    from models import ResumeAnalysis, TechnicalTest, AptitudeTest, MockInterview
    resume = ResumeAnalysis.query.filter_by(student_id=student_id).first()
    tech_tests_count = TechnicalTest.query.filter_by(student_id=student_id).count()
    apt_tests_count = AptitudeTest.query.filter_by(student_id=student_id).count()
    interview = MockInterview.query.filter_by(student_id=student_id).first()
    predictions_run = PlacementPrediction.query.filter_by(student_id=student_id).count()
    
    raw_conf = 0
    raw_conf += min(profile_pct * 0.20, 20)
    if resume is not None:
        raw_conf += 15
    if resume and resume.ats_score > 0:
        raw_conf += 15
    raw_conf += min(tech_tests_count * 5, 15)
    raw_conf += min(apt_tests_count * 5, 15)
    if progress and progress.coding_done:
        raw_conf += 10
    if interview is not None:
        raw_conf += 10
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

    # ── Return rich response ──
    return jsonify({
        "success":              True,
        "placement_probability": prob_pct,
        "readiness_label":      label,
        "confidence":           ai_confidence_label,
        "ai_confidence_score":  ai_confidence_score,
        "ai_confidence_label":  ai_confidence_label,
        "placement_ready":      ready,
        "message":              f"{label} — {prob_pct}% Placement Probability",
        "top_reasons":          top_reasons,
        "weak_areas":           weak_areas,
        "recommendations":      recs,
        "scores_summary": {
            "coding_score":         profile["coding_score"],
            "dsa_score":            profile["dsa_score"],
            "aptitude_score":       profile["aptitude_score"],
            "technical_score":      profile["technical_score"],
            "mock_interview_score": profile["mock_interview_score"],
            "communication_score":  profile["communication_score"],
            "resume_score":         profile["resume_score"],
            "cgpa":                 profile["cgpa"],
        }
    }), 200