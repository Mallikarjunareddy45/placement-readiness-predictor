from flask          import Blueprint, request, jsonify
from flask_bcrypt   import Bcrypt
from models         import db, Student
import jwt
import datetime
import os

auth_bp = Blueprint("auth", __name__)
bcrypt  = Bcrypt()


# ─────────────────────────────────────────
# Helper: generate a JWT token
# ─────────────────────────────────────────
def generate_token(student_id):
    payload = {
        "student_id": student_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(
        payload,
        os.getenv("JWT_SECRET_KEY", "dev-jwt-secret"),
        algorithm="HS256"
    )
    return token


# ─────────────────────────────────────────
# Helper: decode and verify a JWT token
# Used by predict.py to protect the route
# ─────────────────────────────────────────
def verify_token(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, "Missing or invalid token"

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET_KEY", "dev-jwt-secret"),
            algorithms=["HS256"]
        )
        return payload["student_id"], None
    except jwt.ExpiredSignatureError:
        return None, "Token has expired. Please log in again."
    except jwt.InvalidTokenError:
        return None, "Invalid token. Please log in again."


# ─────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # ── Validate required fields ──
    required = ["name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({
                "success": False,
                "message": f"'{field}' is required."
            }), 400

    name     = data["name"].strip()
    email    = data["email"].strip().lower()
    password = data["password"]

    # ── Check password length ──
    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters."
        }), 400

    # ── Check if email already exists ──
    existing = Student.query.filter_by(email=email).first()
    if existing:
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    # ── Hash password and save student ──
    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    new_student = Student(name=name, email=email, password=hashed_pw)

    db.session.add(new_student)
    db.session.commit()

    # ── Generate token and respond ──
    token = generate_token(new_student.id)

    return jsonify({
        "success": True,
        "message": "Account created successfully.",
        "token":   token,
        "student": {
            "id":    new_student.id,
            "name":  new_student.name,
            "email": new_student.email
        }
    }), 201


# ─────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # ── Validate required fields ──
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    # ── Find student by email ──
    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({
            "success": False,
            "message": "No account found with this email."
        }), 404

    # ── Verify password ──
    if not bcrypt.check_password_hash(student.password, password):
        return jsonify({
            "success": False,
            "message": "Incorrect password."
        }), 401

    # ── Generate token and respond ──
    token = generate_token(student.id)

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token":   token,
        "student": {
            "id":    student.id,
            "name":  student.name,
            "email": student.email
        }
    })