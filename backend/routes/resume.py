import os
import json
import re
from flask               import Blueprint, request, jsonify, send_file
from werkzeug.utils      import secure_filename
from models              import db, ResumeAnalysis, ModuleProgress, Student
from routes.auth         import verify_token
from datetime            import datetime

resume_bp = Blueprint("resume", __name__)

# ── Config ──
UPLOAD_FOLDER   = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_EXTENSIONS = {"pdf", "docx"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(filepath):
    try:
        import fitz  # pymupdf
        doc  = fitz.open(filepath)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception:
        return ""

def extract_text_from_docx(filepath):
    try:
        from docx import Document
        doc  = Document(filepath)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception:
        return ""

KNOWN_SKILLS = {
    "Programming Languages": ["python", "java", "javascript", "c++", "c", "typescript", "rust", "go", "php", "ruby", "c#", "kotlin", "swift"],
    "Frameworks": ["react", "angular", "vue", "django", "flask", "fastapi", "express", "next.js", "nest.js", "bootstrap", "tailwind"],
    "Libraries": ["numpy", "pandas", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv", "matplotlib", "seaborn", "redux", "jquery"],
    "Databases": ["sql", "mysql", "postgresql", "sqlite", "mongodb", "redis", "firebase", "cassandra", "oracle"],
    "Cloud": ["aws", "azure", "gcp", "heroku", "netlify", "vercel"],
    "DevOps": ["docker", "kubernetes", "git", "github", "ci/cd", "jenkins", "linux", "nginx"],
    "AI Tools": ["llm", "openai", "gpt", "gemini", "langchain", "transformers", "hugging face", "vector database"],
    "Soft Skills": ["communication", "teamwork", "leadership", "problem solving", "critical thinking", "collaboration", "adaptability"]
}

FLAT_SKILLS = [s for sublist in KNOWN_SKILLS.values() for s in sublist]

IMPORTANT_SKILLS = ["python", "sql", "machine learning", "flask", "react", "git", "docker", "aws", "data analysis", "deep learning"]

def detect_skills_categorized(text):
    text_lower = text.lower()
    detected = {category: [] for category in KNOWN_SKILLS.keys()}
    flat_detected = []
    
    for category, skills_list in KNOWN_SKILLS.items():
        for skill in skills_list:
            # Word boundary check for single characters or short terms
            pattern = rf"\b{re.escape(skill)}\b" if len(skill) <= 3 else re.escape(skill)
            if re.search(pattern, text_lower):
                detected[category].append(skill.upper() if len(skill) <= 4 else skill.capitalize())
                flat_detected.append(skill)
                
    return detected, flat_detected

def find_missing_skills(detected_flat):
    return [s.capitalize() for s in IMPORTANT_SKILLS if s not in detected_flat]

def extract_sections(text):
    text_lower = text.lower()
    sections = {
        "summary": any(k in text_lower for k in ["summary", "objective", "profile", "about"]),
        "education": any(k in text_lower for k in ["education", "b.tech", "b.e", "bachelor", "university", "college", "cgpa", "gpa"]),
        "projects": any(k in text_lower for k in ["project", "projects", "built", "developed", "created"]),
        "experience": any(k in text_lower for k in ["experience", "employment", "work history", "job"]),
        "skills": any(k in text_lower for k in ["skills", "technical skills", "technologies"]),
        "certifications": any(k in text_lower for k in ["certification", "certified", "certificate", "coursera", "udemy"]),
        "achievements": any(k in text_lower for k in ["achievement", "award", "winner", "rank", "honor"]),
        "github": "github.com" in text_lower,
        "linkedin": "linkedin.com" in text_lower,
        "contact": any(k in text_lower for k in ["email", "phone", "@", "+91"])
    }
    return sections

def calculate_ats_scores(text, detected_flat, sections):
    # Overall ATS Score (max 100)
    score = 0
    score += min(len(detected_flat) * 2, 25) # Skills count
    score += min(sum(5 for k in ["python", "sql", "git", "react", "docker"] if k in detected_flat), 25) # Core tech presence
    score += sum(3 for s, present in sections.items() if present) # Section presence (max 30)
    score += 10 if len(text.split()) > 300 else 5 # Word count
    score += min(sum(1 for v in ["developed", "built", "implemented", "optimized"] if v in text.lower()) * 2, 10) # Action verbs
    overall_ats = min(score, 100)

    # Sub-scores
    formatting_score = 90 if sections["contact"] and sections["education"] else 60
    grammar_score = 95 if not any(w in text.lower() for w in ["teh", "recieve", "seperate"]) else 75
    readability_score = 80 if len(text.split()) < 600 else 65
    recruiter_score = min(overall_ats + 5, 100)
    ai_score = min(overall_ats + 2, 100)

    return {
        "overall_ats": overall_ats,
        "resume_score": min(int(overall_ats * 0.9 + 5), 100),
        "formatting_score": formatting_score,
        "grammar_score": grammar_score,
        "readability_score": readability_score,
        "recruiter_score": recruiter_score,
        "ai_score": ai_score
    }

def calculate_role_matches(detected_flat):
    roles = {
        "Software Engineer": ["python", "java", "sql", "git", "c++"],
        "Python Developer": ["python", "django", "flask", "sql", "fastapi"],
        "Data Analyst": ["python", "sql", "pandas", "numpy", "data analysis", "tableau"],
        "Data Scientist": ["python", "machine learning", "deep learning", "pandas", "numpy", "tensorflow", "pytorch"],
        "AI Engineer": ["python", "machine learning", "llm", "langchain", "transformers"],
        "ML Engineer": ["python", "machine learning", "tensorflow", "pytorch", "scikit-learn"],
        "Frontend Developer": ["javascript", "typescript", "react", "html", "css", "tailwind"],
        "Backend Developer": ["python", "sql", "django", "flask", "node.js", "postgres"],
        "Full Stack Developer": ["react", "node.js", "python", "sql", "javascript", "git"]
    }
    
    matches = {}
    for role, reqs in roles.items():
        matched = sum(1 for r in reqs if r in detected_flat)
        matches[role] = min(int((matched / len(reqs)) * 100), 100)
    return matches

def generate_feedback_suggestions(sections, detected_flat):
    strengths = []
    weaknesses = []
    
    if len(detected_flat) >= 8:
        strengths.append("Diverse technical skills section detected.")
    if sections["projects"]:
        strengths.append("Projects section present — good for freshers.")
    if sections["experience"]:
        strengths.append("Work history details found.")
        
    if len(detected_flat) < 5:
        weaknesses.append("Very low skills volume detected. Add more keywords.")
    if not sections["summary"]:
        weaknesses.append("Missing professional summary section.")
    if not sections["github"]:
        weaknesses.append("No active GitHub URL detected.")
        
    suggestions = [
        {"item": "Optimize Professional Summary for ATS keywords", "priority": "High", "difficulty": "Easy", "time": "20m"},
        {"item": "Structure project bullet points to highlight outcomes over tasks", "priority": "High", "difficulty": "Medium", "time": "45m"},
        {"item": "Ensure GitHub and LinkedIn URLs are clickable links", "priority": "Medium", "difficulty": "Easy", "time": "10m"}
    ]
    return strengths, weaknesses, suggestions

# ─────────────────────────────────────────
# POST /api/resume/upload
# ─────────────────────────────────────────
@resume_bp.route("/upload", methods=["POST"])
def upload_resume():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    if "resume" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded."}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Only PDF and DOCX files allowed."}), 400

    filename = secure_filename(f"student_{student_id}_{file.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    ext = filename.rsplit(".", 1)[1].lower()
    text = extract_text_from_pdf(filepath) if ext == "pdf" else extract_text_from_docx(filepath)

    if not text:
        return jsonify({"success": False, "message": "Text extraction failed."}), 422

    # Run analysis
    detected_cat, detected_flat = detect_skills_categorized(text)
    missing_skills = find_missing_skills(detected_flat)
    sections = extract_sections(text)
    
    scores = calculate_ats_scores(text, detected_flat, sections)
    role_matches = calculate_role_matches(detected_flat)
    strengths, weaknesses, suggestions = generate_feedback_suggestions(sections, detected_flat)

    # Save to database
    analysis = ResumeAnalysis(
        student_id=student_id,
        filename=file.filename,
        extracted_text=text[:5000],
        detected_skills=json.dumps(detected_flat),
        missing_skills=json.dumps(missing_skills),
        education_info=str(sections["education"]),
        projects_info=str(sections["projects"]),
        internship_info=str(sections["experience"]),
        certifications_info=str(sections["certifications"]),
        ats_score=scores["overall_ats"],
        resume_score=scores["resume_score"],
        skill_match_score=role_matches.get("Full Stack Developer", 60),
        strengths=json.dumps(strengths),
        weaknesses=json.dumps(weaknesses),
        suggestions=json.dumps(suggestions),
    )
    db.session.add(analysis)

    # Update progress
    progress = ModuleProgress.query.filter_by(student_id=student_id).first()
    if not progress:
        progress = ModuleProgress(student_id=student_id)
        db.session.add(progress)
    progress.resume_done = True
    progress.resume_score = scores["resume_score"]

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Resume uploaded and ATS analyzed.",
        "analysis_id": analysis.id,
        "scores": scores,
        "detected_categorized": detected_cat,
        "missing_skills": missing_skills,
        "role_matches": role_matches,
        "checklist": sections,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "word_count": len(text.split())
    }), 200

# ─────────────────────────────────────────
# GET /api/resume/latest
# ─────────────────────────────────────────
@resume_bp.route("/latest", methods=["GET"])
def get_latest_resume():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    analysis = ResumeAnalysis.query.filter_by(student_id=student_id).order_by(ResumeAnalysis.created_at.desc()).first()
    if not analysis:
        return jsonify({"success": False, "message": "No analysis found."}), 404

    # Re-calculate categorized values from stored data
    detected_flat = json.loads(analysis.detected_skills or "[]")
    text = analysis.extracted_text or ""
    sections = extract_sections(text)
    detected_cat, _ = detect_skills_categorized(text)
    scores = calculate_ats_scores(text, detected_flat, sections)
    role_matches = calculate_role_matches(detected_flat)
    strengths, weaknesses, suggestions = generate_feedback_suggestions(sections, detected_flat)

    return jsonify({
        "success": True,
        "filename": analysis.filename,
        "analyzed_at": analysis.created_at.isoformat(),
        "scores": scores,
        "detected_categorized": detected_cat,
        "missing_skills": json.loads(analysis.missing_skills or "[]"),
        "role_matches": role_matches,
        "checklist": sections,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "word_count": len(text.split())
    }), 200

# ─────────────────────────────────────────
# GET /api/resume/history
# ─────────────────────────────────────────
@resume_bp.route("/history", methods=["GET"])
def get_resume_history():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    history = ResumeAnalysis.query.filter_by(student_id=student_id).order_by(ResumeAnalysis.created_at.desc()).all()
    history_data = [{
        "id": h.id,
        "filename": h.filename,
        "ats_score": h.ats_score,
        "resume_score": h.resume_score,
        "date": h.created_at.isoformat()
    } for h in history]

    return jsonify({
        "success": True,
        "history": history_data
    }), 200

# ─────────────────────────────────────────
# POST /api/resume/improve
# ─────────────────────────────────────────
@resume_bp.route("/improve", methods=["POST"])
def improve_resume():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    data = request.get_json() or {}
    improve_type = data.get("type", "summary") # summary, projects, skills, experience, entire

    student = Student.query.get(student_id)
    skills = [s.name for s in student.skills] if student else []
    skills_str = ", ".join(skills) if skills else "Python, SQL, React"

    suggestions = {
        "summary": f"Highly analytical B.Tech Computer Science student with a {student.cgpa or 7.5} CGPA, proficient in {skills_str}. Proven track rate building AI-powered classification models and ATS resume parsers. Seeking an entry-level software engineering role to deploy scalable cloud services.",
        "projects": "Designed and deployed a containerized AI-powered Placement Readiness platform using React, Flask, and SQLite. Integrated Scikit-learn random forests to predict placement probability with 92% confidence, reducing preparation profiling latency by 40%.",
        "skills": f"Programming Languages: Python, SQL, JavaScript, C++\nFrameworks: React.js, Flask, FastAPI\nDevOps & Tools: Docker, Git, AWS, CI/CD",
        "experience": "Collaborated in an agile team to design and build cloud-native student monitoring modules. Authored python subprocess compiling microservices to run and submit candidate code submissions against hidden test cases.",
        "entire": "ATS Optimized Complete Draft:\n\nSUMMARY\nHighly analytical B.Tech CS student with a 7.5 CGPA...\n\nSKILLS\nPython, SQL, React.js, Flask, Docker, Git, AWS...\n\nPROJECTS\nAI Placement Predictor (React, Flask, SQLite)\n- Designed and deployed containerized ML platform..."
    }

    return jsonify({
        "success": True,
        "improvement": suggestions.get(improve_type, suggestions["summary"])
    }), 200

# ─────────────────────────────────────────
# GET /api/resume/report
# ─────────────────────────────────────────
@resume_bp.route("/report", methods=["GET"])
def get_resume_report_card():
    # Reuse latest endpoint to output the report JSON
    return get_latest_resume()

# ─────────────────────────────────────────
# GET /api/resume/download
# ─────────────────────────────────────────
@resume_bp.route("/download", methods=["GET"])
def download_resume_report():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401
    
    # We serve the printable report layout directly from reports Blueprint
    return jsonify({
        "success": True,
        "message": "Report generated. Please download via the reports blueprint route '/api/reports/resume'."
    }), 200

# ─────────────────────────────────────────
# GET /api/resume/file
# Serves the actual uploaded PDF/DOCX file
# ─────────────────────────────────────────
@resume_bp.route("/file", methods=["GET"])
def get_resume_file():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    analysis = ResumeAnalysis.query.filter_by(student_id=student_id).order_by(ResumeAnalysis.created_at.desc()).first()
    if not analysis:
        return jsonify({"success": False, "message": "No resume uploaded."}), 404

    saved_filename = secure_filename(f"student_{student_id}_{analysis.filename}")
    filepath = os.path.join(UPLOAD_FOLDER, saved_filename)
    if not os.path.exists(filepath):
        return jsonify({"success": False, "message": "Resume file not found on server."}), 404

    return send_file(filepath)