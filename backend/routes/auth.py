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
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        # Fallback to query string parameter token
        token = request.args.get("token", "")

    if not token:
        return None, "Missing or invalid token"

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
    is_correct = False
    try:
        is_correct = bcrypt.check_password_hash(student.password, password)
    except ValueError:
        # Fallback comparison for blank/plain legacy passwords
        is_correct = (student.password == password and password != "")

    if not is_correct:
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


# Global in-memory storage for OTP sessions
# Key: email (lower), Value: { "otp": str, "expires_at": datetime, "attempts": int, "name": str, "verified": bool }
OTP_STORAGE = {}

# ─────────────────────────────────────────
# POST /api/auth/social-login
# ─────────────────────────────────────────
@auth_bp.route("/social-login", methods=["POST"])
def social_login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()

    if not email:
        return jsonify({"success": False, "message": "Email is required for social login."}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        # Create student automatically on first login
        student = Student(name=name or email.split("@")[0], email=email, password="")
        db.session.add(student)
        db.session.commit()

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
    }), 200


# ─────────────────────────────────────────
# POST /api/auth/forgot-password
# ─────────────────────────────────────────
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    import random
    import smtplib
    from email.mime.text import MIMEText
    
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"success": False, "message": "Email is required."}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({"success": False, "message": "No account found with this email."}), 404

    # Generate 6 digit OTP
    otp = f"{random.randint(100000, 999999)}"
    
    # Store session details
    OTP_STORAGE[email] = {
        "otp": otp,
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=10),
        "attempts": 0,
        "name": student.name,
        "verified": False
    }

    # Send Email
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    body = f"""Hello {student.name}

Your Password Reset Code is

{otp}

This code expires in 10 minutes.

If you didn't request this, ignore this email.

Regards

Placement Readiness Predictor Team"""

    msg = MIMEText(body)
    msg["Subject"] = "Placement Readiness Predictor Password Reset"
    msg["From"] = smtp_user or "noreply@predictor.com"
    msg["To"] = email

    sent_real = False
    if smtp_user and smtp_pass:
        try:
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            sent_real = True
        except Exception as e:
            print(f"[OTP] SMTP transmission error: {e}")

    # Fallback log output for development/test run validations
    print(f"\n==========================================")
    print(f"  OTP CODE FOR {email.upper()}: {otp}")
    print(f"==========================================\n")

    return jsonify({
        "success": True,
        "message": "OTP verification code sent." if sent_real else "OTP code printed to server logs for dev testing."
    }), 200


# ─────────────────────────────────────────
# POST /api/auth/verify-otp
# ─────────────────────────────────────────
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()

    if not email or not otp:
        return jsonify({"success": False, "message": "Email and OTP are required."}), 400

    session = OTP_STORAGE.get(email)
    if not session:
        return jsonify({"success": False, "message": "No active reset request found for this email."}), 400

    if session["attempts"] >= 5:
        return jsonify({"success": False, "message": "Maximum verification attempts exceeded. Request a new OTP."}), 400

    session["attempts"] += 1

    if datetime.datetime.utcnow() > session["expires_at"]:
        return jsonify({"success": False, "message": "Verification code has expired."}), 400

    if session["otp"] != otp:
        return jsonify({"success": False, "message": "Incorrect verification code."}), 400

    session["verified"] = True
    return jsonify({
        "success": True,
        "message": "OTP verified successfully. You may now reset your password."
    }), 200


# ─────────────────────────────────────────
# POST /api/auth/reset-password
# ─────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and new password are required."}), 400

    session = OTP_STORAGE.get(email)
    if not session or not session.get("verified"):
        return jsonify({"success": False, "message": "Security check failed. Please verify email via OTP first."}), 403

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({"success": False, "message": "Student record not found."}), 404

    # Hash new password
    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    student.password = hashed_pw
    db.session.commit()

    # Clear OTP session
    OTP_STORAGE.pop(email, None)

    return jsonify({
        "success": True,
        "message": "Password updated successfully."
    }), 200