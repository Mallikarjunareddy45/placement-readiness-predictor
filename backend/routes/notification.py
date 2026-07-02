from flask import Blueprint, request, jsonify
from models import db, Notification
from routes.auth import verify_token
from datetime import datetime

notification_bp = Blueprint("notification", __name__)

# ─────────────────────────────────────────
# GET /api/notifications
# ─────────────────────────────────────────
@notification_bp.route("/", methods=["GET"])
def get_notifications():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    notifications = Notification.query.filter_by(student_id=student_id).order_by(Notification.created_at.desc()).all()
    
    # If empty, pre-populate with welcome notification and reminders
    if not notifications:
        n1 = Notification(
            student_id=student_id,
            message="Welcome to your Placement Readiness Predictor Platform! Complete your profile to get started.",
            notification_type="System",
            is_read=False
        )
        n2 = Notification(
            student_id=student_id,
            message="Reminder: Upload your Resume to calculate your ATS Score and unlock suggestions.",
            notification_type="Reminder",
            is_read=False
        )
        n3 = Notification(
            student_id=student_id,
            message="Reminder: Take a Technical Test (Python or SQL) to start assessing your readiness.",
            notification_type="Reminder",
            is_read=False
        )
        db.session.add(n1)
        db.session.add(n2)
        db.session.add(n3)
        db.session.commit()
        notifications = [n1, n2, n3]

    data = []
    for n in notifications:
        data.append({
            "id": n.id,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        })
        
    return jsonify({"success": True, "notifications": data}), 200

# ─────────────────────────────────────────
# PUT /api/notifications/read/<id>
# ─────────────────────────────────────────
@notification_bp.route("/read/<int:nid>", methods=["PUT"])
def mark_read(nid):
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    n = Notification.query.filter_by(id=nid, student_id=student_id).first()
    if not n:
        return jsonify({"success": False, "message": "Notification not found."}), 404

    n.is_read = True
    db.session.commit()
    return jsonify({"success": True, "message": "Notification marked as read."}), 200

# ─────────────────────────────────────────
# POST /api/notifications/add
# ─────────────────────────────────────────
@notification_bp.route("/add", methods=["POST"])
def add_notification():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"success": False, "message": "Message is required."}), 400

    message = data["message"]
    ntype = data.get("notification_type", "System")

    n = Notification(
        student_id=student_id,
        message=message,
        notification_type=ntype,
        is_read=False
    )
    db.session.add(n)
    db.session.commit()
    return jsonify({"success": True, "message": "Notification added successfully."}), 201

# ─────────────────────────────────────────
# DELETE /api/notifications/clear
# ─────────────────────────────────────────
@notification_bp.route("/clear", methods=["DELETE"])
def clear_notifications():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    # Delete all read notifications
    Notification.query.filter_by(student_id=student_id, is_read=True).delete()
    db.session.commit()
    return jsonify({"success": True, "message": "Read notifications cleared."}), 200
