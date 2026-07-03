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
            "photo_url":       prof.photo_url or "https://api.dicebear.com/7.x/bottts/svg?seed=" + student.name,
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


import os
import uuid
from werkzeug.utils import secure_filename
from flask import send_from_directory

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "profile_photos")

# Helper to check allowed extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}

def allowed_file(filename, mime_type):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS and mime_type in ALLOWED_MIME_TYPES

# ─────────────────────────────────────────
# GET /api/profile/uploads/profile_photos/<filename>
# Serves profile photo static files securely
# ─────────────────────────────────────────
@profile_bp.route("/uploads/profile_photos/<filename>", methods=["GET"])
def serve_profile_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ─────────────────────────────────────────
# POST /api/profile/upload-photo
# Uploads a profile picture and saves path in DB
# ─────────────────────────────────────────
@profile_bp.route("/upload-photo", methods=["POST"])
def upload_photo():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    if "photo" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded."}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected."}), 400

    # Validate size (max 5 MB)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0) # reset pointer

    if size > 5 * 1024 * 1024:
        return jsonify({"success": False, "message": "Image size exceeds 5 MB limit."}), 400

    # Validate MIME type and extension
    mime_type = file.content_type
    if not allowed_file(file.filename, mime_type):
        return jsonify({"success": False, "message": "Invalid file type. Only PNG, JPG, JPEG, and WEBP images are allowed."}), 400

    # Make target directory
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    # Save with a secure unique filename keyed by student id to prevent duplication/injections
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "png"
    filename = f"photo_{student_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Save relative URL path to profile table
    prof = Profile.query.filter_by(student_id=student_id).first()
    if not prof:
        prof = Profile(student_id=student_id)
        db.session.add(prof)

    # Delete older image from disk if it exists
    if prof.photo_url and prof.photo_url.startswith("/api/profile/uploads/profile_photos/"):
        old_filename = prof.photo_url.split("/")[-1]
        old_filepath = os.path.join(UPLOAD_FOLDER, old_filename)
        if os.path.exists(old_filepath):
            try:
                os.remove(old_filepath)
            except Exception:
                pass

    prof.photo_url = f"/api/profile/uploads/profile_photos/{filename}"
    db.session.commit()

    return jsonify({
        "success": True,
        "photo_url": prof.photo_url,
        "message": "Profile picture updated successfully."
    }), 200


# ─────────────────────────────────────────
# GET /api/profile/photo
# Returns the student's profile photo
# ─────────────────────────────────────────
@profile_bp.route("/photo", methods=["GET"])
def get_photo():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    student = Student.query.get(student_id)
    prof = Profile.query.filter_by(student_id=student_id).first()
    default_avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={student.name if student else 'default'}"
    
    return jsonify({
        "success": True,
        "photo_url": prof.photo_url if (prof and prof.photo_url) else default_avatar
    }), 200


# ─────────────────────────────────────────
# DELETE /api/profile/photo
# Deletes the profile photo and restores default avatar
# ─────────────────────────────────────────
@profile_bp.route("/photo", methods=["DELETE"])
def delete_photo():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    prof = Profile.query.filter_by(student_id=student_id).first()
    if prof and prof.photo_url:
        # Delete image from disk if it's stored locally
        if prof.photo_url.startswith("/api/profile/uploads/profile_photos/"):
            filename = prof.photo_url.split("/")[-1]
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass
        prof.photo_url = None
        db.session.commit()

    return jsonify({
        "success": True,
        "message": "Profile photo removed successfully."
    }), 200