import json
from flask   import Blueprint, request, jsonify
from models  import db, Student, ModuleProgress, Profile, Skill, Project, Certificate
from routes.auth import verify_token

profile_bp = Blueprint("profile", __name__)

# ─────────────────────────────────────────
# GET /api/profile/me
# Returns current student profile with all lists
# ─────────────────────────────────────────
@profile_bp.route("/me", methods=["GET"])
def get_profile():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"success": False, "message": "Student not found."}), 404

    # Ensure profile record exists
    prof = Profile.query.filter_by(student_id=student_id).first()
    if not prof:
        prof = Profile(student_id=student_id, cgpa=student.cgpa, college=student.college, department=student.branch)
        db.session.add(prof)
        db.session.commit()

    # Pull skills, projects, certificates
    skills = [{"name": s.name, "proficiency": s.proficiency} for s in Skill.query.filter_by(student_id=student_id).all()]
    projects = [{
        "title": p.title,
        "description": p.description,
        "technologies": p.technologies,
        "github_url": p.github_url,
        "live_url": p.live_url
    } for p in Project.query.filter_by(student_id=student_id).all()]
    certs = [{
        "name": c.name,
        "issuer": c.issuer,
        "issue_date": c.issue_date,
        "url": c.url
    } for c in Certificate.query.filter_by(student_id=student_id).all()]

    # Calculate profile completion percentage
    fields = {
        "name":            bool(student.name),
        "email":           bool(student.email),
        "cgpa":            prof.cgpa is not None,
        "branch":          bool(prof.department),
        "college":         bool(prof.college),
        "graduation_year": student.graduation_year is not None,
        "phone":           bool(prof.phone),
        "languages":       bool(prof.languages),
        "portfolio":       bool(prof.portfolio),
        "skills":          len(skills) > 0,
        "projects":        len(projects) > 0,
        "certificates":    len(certs) > 0
    }
    filled         = sum(fields.values())
    total          = len(fields)
    completion_pct = round((filled / total) * 100)

    return jsonify({
        "success": True,
        "profile": {
            "id":              student.id,
            "name":            student.name,
            "email":           student.email,
            "cgpa":            prof.cgpa or student.cgpa,
            "branch":          prof.department or student.branch,
            "college":         prof.college or student.college,
            "graduation_year": student.graduation_year,
            "internships":     student.internships,
            "projects_count":  student.projects_count,
            "certifications":  student.certifications,
            "github_url":      student.github_url,
            "linkedin_url":    student.linkedin_url,
            "phone":           prof.phone,
            "languages":       prof.languages,
            "portfolio":       prof.portfolio,
            "photo_url":       prof.photo_url or "https://api.dicebear.com/7.x/bottts/svg?seed=" + student.name,
            "skills":          skills,
            "projects_list":   projects,
            "certs_list":      certs
        },
        "completion": {
            "percentage":   completion_pct,
            "filled_fields": filled,
            "total_fields":  total,
            "missing_fields": [k for k, v in fields.items() if not v]
        }
    }), 200

# ─────────────────────────────────────────
# PUT /api/profile/update
# Updates student profile fields
# ─────────────────────────────────────────
@profile_bp.route("/update", methods=["PUT"])
def update_profile():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"success": False, "message": "Student not found."}), 404

    prof = Profile.query.filter_by(student_id=student_id).first()
    if not prof:
        prof = Profile(student_id=student_id)
        db.session.add(prof)

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    # ── Update core student fields ──
    if "name" in data:
        student.name = str(data["name"]).strip()
    if "graduation_year" in data and data["graduation_year"]:
        student.graduation_year = int(data["graduation_year"])
    if "internships" in data:
        student.internships = int(data["internships"])
    if "projects_count" in data:
        student.projects_count = int(data["projects_count"])
    if "certifications" in data:
        student.certifications = int(data["certifications"])
    if "github_url" in data:
        student.github_url = str(data["github_url"]).strip()
    if "linkedin_url" in data:
        student.linkedin_url = str(data["linkedin_url"]).strip()

    # ── Update Profile record fields ──
    if "cgpa" in data and data["cgpa"] is not None:
        cgpa = float(data["cgpa"])
        student.cgpa = cgpa
        prof.cgpa = cgpa
    if "branch" in data:
        student.branch = str(data["branch"]).strip()
        prof.department = student.branch
    if "college" in data:
        student.college = str(data["college"]).strip()
        prof.college = student.college
    if "phone" in data:
        prof.phone = str(data["phone"]).strip()
    if "languages" in data:
        prof.languages = str(data["languages"]).strip()
    if "portfolio" in data:
        prof.portfolio = str(data["portfolio"]).strip()
    if "photo_url" in data:
        prof.photo_url = str(data["photo_url"]).strip()

    # ── Update Skills List ──
    if "skills" in data:
        # Clear existing skills and insert new ones
        Skill.query.filter_by(student_id=student_id).delete()
        for s in data["skills"]:
            if s.get("name"):
                db.session.add(Skill(
                    student_id=student_id,
                    name=s["name"].strip(),
                    proficiency=s.get("proficiency", "Intermediate")
                ))

    # ── Update Projects List ──
    if "projects_list" in data:
        Project.query.filter_by(student_id=student_id).delete()
        for p in data["projects_list"]:
            if p.get("title"):
                db.session.add(Project(
                    student_id=student_id,
                    title=p["title"].strip(),
                    description=p.get("description", "").strip(),
                    technologies=p.get("technologies", "").strip(),
                    github_url=p.get("github_url", "").strip(),
                    live_url=p.get("live_url", "").strip()
                ))

    # ── Update Certificates List ──
    if "certs_list" in data:
        Certificate.query.filter_by(student_id=student_id).delete()
        for c in data["certs_list"]:
            if c.get("name"):
                db.session.add(Certificate(
                    student_id=student_id,
                    name=c["name"].strip(),
                    issuer=c.get("issuer", "").strip(),
                    issue_date=c.get("issue_date", "").strip(),
                    url=c.get("url", "").strip()
                ))

    # ── Update module progress ──
    progress = ModuleProgress.query.filter_by(student_id=student_id).first()
    if not progress:
        progress = ModuleProgress(student_id=student_id)
        db.session.add(progress)

    core_filled = all([
        student.cgpa is not None,
        student.branch,
        student.college,
        student.graduation_year is not None,
    ])
    progress.profile_done = core_filled

    db.session.commit()

    # Re-fetch lists for return
    skills = [{"name": s.name, "proficiency": s.proficiency} for s in Skill.query.filter_by(student_id=student_id).all()]
    projects = [{
        "title": p.title,
        "description": p.description,
        "technologies": p.technologies,
        "github_url": p.github_url,
        "live_url": p.live_url
    } for p in Project.query.filter_by(student_id=student_id).all()]
    certs = [{
        "name": c.name,
        "issuer": c.issuer,
        "issue_date": c.issue_date,
        "url": c.url
    } for c in Certificate.query.filter_by(student_id=student_id).all()]

    fields = {
        "name":            bool(student.name),
        "email":           bool(student.email),
        "cgpa":            prof.cgpa is not None,
        "branch":          bool(prof.department),
        "college":         bool(prof.college),
        "graduation_year": student.graduation_year is not None,
        "phone":           bool(prof.phone),
        "languages":       bool(prof.languages),
        "portfolio":       bool(prof.portfolio),
        "skills":          len(skills) > 0,
        "projects":        len(projects) > 0,
        "certificates":    len(certs) > 0
    }
    filled         = sum(fields.values())
    completion_pct = round((filled / len(fields)) * 100)

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "profile": {
            "id":              student.id,
            "name":            student.name,
            "email":           student.email,
            "cgpa":            prof.cgpa,
            "branch":          prof.department,
            "college":         prof.college,
            "graduation_year": student.graduation_year,
            "internships":     student.internships,
            "projects_count":  student.projects_count,
            "certifications":  student.certifications,
            "github_url":      student.github_url,
            "linkedin_url":    student.linkedin_url,
            "phone":           prof.phone,
            "languages":       prof.languages,
            "portfolio":       prof.portfolio,
            "photo_url":       prof.photo_url,
            "skills":          skills,
            "projects_list":   projects,
            "certs_list":      certs
        },
        "completion": {
            "percentage":    completion_pct,
            "profile_done":  core_filled,
            "missing_fields": [k for k, v in fields.items() if not v]
        }
    }), 200