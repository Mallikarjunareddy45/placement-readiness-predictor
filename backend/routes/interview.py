import os
import json
import random
from flask import Blueprint, request, jsonify
from models import db, MockInterview, Student, ResumeAnalysis
from routes.auth import verify_token

interview_bp = Blueprint("interview", __name__)

# ─────────────────────────────────────────
# Question Pool with Grading Keywords
# ─────────────────────────────────────────
QUESTION_POOL = {
    "HR": [
        {
            "question": "Tell me about yourself and your background.",
            "keywords": ["experience", "background", "education", "passion", "project", "skills", "career"]
        },
        {
            "question": "Why do you want to join our organization, and what makes you a good fit?",
            "keywords": ["growth", "values", "culture", "opportunity", "skills", "contribute", "align"]
        },
        {
            "question": "What are your greatest professional strengths and weaknesses?",
            "keywords": ["learn", "dedicated", "improve", "focus", "challenges", "communicate", "adapt"]
        },
        {
            "question": "Where do you see yourself in the next five years?",
            "keywords": ["leadership", "growth", "skills", "mentor", "contribute", "role", "career"]
        },
        {
            "question": "How do you prioritize your work when dealing with multiple tasks or deadlines?",
            "keywords": ["prioritize", "schedule", "organize", "deadline", "manage", "focus", "planning"]
        }
    ],
    "Behavioral": [
        {
            "question": "Tell me about a time you had to resolve a conflict within a project team.",
            "keywords": ["resolved", "communication", "listened", "collaborate", "compromise", "constructive"]
        },
        {
            "question": "Describe a situation where you had to work under intense pressure or a tight deadline.",
            "keywords": ["pressure", "deadline", "organized", "focused", "prioritized", "calm", "delivered"]
        },
        {
            "question": "Tell me about a project or task that failed. How did you handle it and what did you learn?",
            "keywords": ["failure", "learned", "improved", "strategy", "analyzed", "mistake", "reflection"]
        },
        {
            "question": "Describe a time when you had to convince a team or manager to adopt your idea.",
            "keywords": ["persuaded", "data", "logic", "listen", "proposal", "agreement", "collaborated"]
        },
        {
            "question": "Tell me about a time you took the initiative to solve a problem without being asked.",
            "keywords": ["initiative", "proactive", "solved", "identified", "improved", "outcome", "action"]
        }
    ],
    "Technical": [
        {
            "question": "Explain the difference between a process and a thread in an operating system.",
            "keywords": ["process", "thread", "memory", "overhead", "lightweight", "share", "concurrency", "address space"]
        },
        {
            "question": "What is Object-Oriented Programming (OOP) and what are its four main pillars?",
            "keywords": ["inheritance", "polymorphism", "encapsulation", "abstraction", "class", "object", "pillars"]
        },
        {
            "question": "Explain what a database index is, how it works, and its trade-offs.",
            "keywords": ["index", "lookup", "speed", "retrieval", "b-tree", "write overhead", "search", "table"]
        },
        {
            "question": "What is the difference between REST APIs and GraphQL?",
            "keywords": ["endpoint", "query", "over-fetching", "under-fetching", "schema", "request", "http"]
        },
        {
            "question": "What is the difference between a stack and a queue data structure?",
            "keywords": ["stack", "queue", "lifo", "fifo", "push", "pop", "enqueue", "dequeue"]
        }
    ],
    "Project": [
        {
            "question": "Walk me through your most complex project, its architecture, and the tech stack you selected.",
            "keywords": ["architecture", "stack", "frontend", "backend", "database", "api", "flow", "components"]
        },
        {
            "question": "What was the most challenging technical bug or bottleneck in your project, and how did you debug it?",
            "keywords": ["bug", "bottleneck", "optimized", "debugged", "resolved", "logs", "performance", "fixed"]
        },
        {
            "question": "How did you manage database design, state management, or security in your project?",
            "keywords": ["schema", "state", "redux", "encryption", "auth", "query", "storage", "context"]
        },
        {
            "question": "If you had to rewrite this project from scratch, what architectural changes would you make and why?",
            "keywords": ["microservices", "scalable", "refactor", "framework", "performance", "caching", "deploy"]
        }
    ]
}

# Skill specific technical questions
SKILL_QUESTIONS = {
    "python": {
        "question": "Python: What are decorators, and what is their practical use case?",
        "keywords": ["decorator", "wrapper", "function", "modify", "logging", "@", "extend"]
    },
    "sql": {
        "question": "SQL: Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN.",
        "keywords": ["join", "match", "left", "null", "records", "table", "keys"]
    },
    "machine learning": {
        "question": "Machine Learning: Explain the bias-variance tradeoff and how to resolve overfitting.",
        "keywords": ["bias", "variance", "overfitting", "underfitting", "tradeoff", "regularization"]
    },
    "react": {
        "question": "React: What is the virtual DOM, and how does React optimize component rendering?",
        "keywords": ["virtual dom", "diffing", "reconcile", "render", "state", "props", "re-render"]
    },
    "docker": {
        "question": "DevOps: Explain what Docker containerization is and how it differs from Virtual Machines.",
        "keywords": ["container", "hypervisor", "os sharing", "lightweight", "images", "dockerfile"]
    },
    "aws": {
        "question": "Cloud: What is the difference between EC2, S3, and RDS on AWS?",
        "keywords": ["compute", "storage", "database", "ec2", "s3", "rds", "server"]
    }
}

# ─────────────────────────────────────────
# POST /api/interview/start
# ─────────────────────────────────────────
@interview_bp.route("/start", methods=["POST"])
def start_interview():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    interview_type = data.get("interview_type", "HR")  # HR, Technical, Behavioral, Project, Resume-based
    
    questions = []

    # Handle Resume-based questions dynamically
    if interview_type == "Resume-based":
        # Pull latest resume analysis
        resume = ResumeAnalysis.query.filter_by(student_id=student_id).order_by(ResumeAnalysis.created_at.desc()).first()
        detected = []
        if resume and resume.detected_skills:
            detected = json.loads(resume.detected_skills)
        
        # Match questions based on skills
        matched_skills = [s for s in detected if s in SKILL_QUESTIONS]
        
        # Pull skill questions
        for skill in matched_skills[:3]:
            questions.append(SKILL_QUESTIONS[skill])
            
        # Fill remaining with general technical questions
        needed = 5 - len(questions)
        if needed > 0:
            tech_pool = QUESTION_POOL["Technical"]
            selected_tech = random.sample(tech_pool, min(needed, len(tech_pool)))
            questions.extend(selected_tech)
    else:
        # Standard pools
        pool = QUESTION_POOL.get(interview_type, QUESTION_POOL["HR"])
        questions = random.sample(pool, min(5, len(pool)))

    # Return questions with clean structure for client
    questions_data = []
    for idx, q in enumerate(questions):
        questions_data.append({
            "index": idx,
            "question": q["question"],
            "keywords": q["keywords"]  # sent to grade
        })

    # Mock Interview Session ID
    interview_id = random.randint(100000, 999999)

    return jsonify({
        "success": True,
        "interview_id": interview_id,
        "interview_type": interview_type,
        "questions": questions_data
    }), 200

# ─────────────────────────────────────────
# POST /api/interview/submit
# ─────────────────────────────────────────
@interview_bp.route("/submit", methods=["POST"])
def submit_interview():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    interview_type = data.get("interview_type")
    answers = data.get("answers", {})  # { question_index: { question: "", answer: "", keywords: [] } }
    duration_secs = int(data.get("duration_secs", 0))
    eye_contact = int(data.get("eye_contact_score", 80))
    confidence = int(data.get("confidence_score", 80))

    if not interview_type or not answers:
        return jsonify({"success": False, "message": "Valid interview details and answers required."}), 400

    # ── Evaluate Answers ──
    total_questions = len(answers)
    total_tech_accuracy = 0
    total_fluency = 0
    total_grammar = 0
    total_words = 0
    
    filler_words = ["um", "uh", "like", "actually", "basically", "you know", "literally", "stuff", "sort of"]
    
    results = []

    for idx, ans_obj in answers.items():
        question = ans_obj.get("question", "")
        answer = ans_obj.get("answer", "").strip()
        keywords = ans_obj.get("keywords", [])
        
        answer_lower = answer.lower()
        word_list = answer_lower.split()
        word_count = len(word_list)
        total_words += word_count

        # 1. Technical Accuracy / Keyword match
        matched_kws = [kw for kw in keywords if kw.lower() in answer_lower]
        tech_acc = round((len(matched_kws) / len(keywords)) * 100) if keywords else 80
        total_tech_accuracy += tech_acc

        # 2. Fluency (filler word penalty)
        fillers_found = sum(1 for w in word_list if w in filler_words)
        # density check
        if word_count > 0:
            density = fillers_found / word_count
            fluency = max(0, round((1.0 - (density * 5.0)) * 100)) # sharp penalty for high density
        else:
            fluency = 0
        total_fluency += fluency

        # 3. Grammar (Rule based scoring)
        # Penalize lack of capitalization, excessive repeat words, or extremely short answers
        grammar = 100
        if word_count > 0:
            if not answer[0].isupper():
                grammar -= 10
            # repeating words check
            repeats = word_count - len(set(word_list))
            grammar -= min(repeats * 2, 30)
            if word_count < 10:
                grammar -= 20
        else:
            grammar = 0
        grammar = max(0, grammar)
        total_grammar += grammar

        results.append({
            "question": question,
            "answer": answer,
            "tech_accuracy": tech_acc,
            "fluency": fluency,
            "grammar": grammar,
            "word_count": word_count,
            "matched_keywords": matched_kws,
            "missing_keywords": [k for k in keywords if k not in matched_kws]
        })

    # Averaging metrics
    avg_accuracy = round(total_tech_accuracy / total_questions) if total_questions > 0 else 0
    avg_fluency = round(total_fluency / total_questions) if total_questions > 0 else 0
    avg_grammar = round(total_grammar / total_questions) if total_questions > 0 else 0

    # 4. Speaking Speed (WPM)
    duration_mins = duration_secs / 60.0
    wpm = round(total_words / duration_mins) if duration_mins > 0 else 0
    
    # Target WPM is 110-150. Deduct if outside
    wpm_score = 100
    if wpm < 100:
        wpm_score = max(30, 100 - (100 - wpm))
    elif wpm > 160:
        wpm_score = max(30, 100 - (wpm - 160))

    # Communication score (average of fluency, grammar, and wpm score)
    comm_score = round((avg_fluency + avg_grammar + wpm_score) / 3)

    # 5. Composite Overall Score
    overall_score = round(
        (avg_accuracy * 0.35) + 
        (comm_score * 0.25) + 
        (confidence * 0.20) + 
        (eye_contact * 0.20)
    )

    # ── Feedback Generation ──
    feedback_points = []
    if overall_score >= 80:
        feedback_points.append("Excellent communication skills and strong technical knowledge.")
        feedback_points.append("Great posture and steady eye contact maintained throughout.")
    elif overall_score >= 65:
        feedback_points.append("Solid performance. Good structural explanations, but can reduce filler word usage.")
        feedback_points.append("Keep practicing core keyword expressions to sound more authoritative.")
    else:
        feedback_points.append("Needs work on technical accuracy. Focus on key definitions and concepts.")
        feedback_points.append("Practice speaking at a steady pace (110-140 WPM). Reduce pauses and filler words.")

    if eye_contact < 70:
        feedback_points.append("Maintain better camera eye contact — avoid looking away or down frequently.")
    if confidence < 70:
        feedback_points.append("Work on your confidence. Answer with more structure using the STAR method.")

    # Save to database
    interview = MockInterview(
        student_id=student_id,
        interview_type=interview_type,
        duration_secs=duration_secs,
        answers_log=json.dumps(results),
        confidence_score=confidence,
        eye_contact_score=eye_contact,
        speaking_speed=wpm,
        communication_score=comm_score,
        grammar_score=avg_grammar,
        fluency_score=avg_fluency,
        technical_accuracy=avg_accuracy,
        overall_score=overall_score,
        overall_feedback="\n".join(feedback_points)
    )
    db.session.add(interview)
    db.session.commit()

    return jsonify({
        "success": True,
        "interview_id": interview.id,
        "scores": {
            "overall": overall_score,
            "accuracy": avg_accuracy,
            "communication": comm_score,
            "fluency": avg_fluency,
            "grammar": avg_grammar,
            "speaking_speed_wpm": wpm,
            "wpm_score": wpm_score,
            "eye_contact": eye_contact,
            "confidence": confidence
        },
        "feedback": feedback_points,
        "results": results
    }), 200

# ─────────────────────────────────────────
# GET /api/interview/history
# ─────────────────────────────────────────
@interview_bp.route("/history", methods=["GET"])
def get_history():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    interviews = MockInterview.query.filter_by(student_id=student_id).order_by(MockInterview.created_at.desc()).all()
    history = []
    for i in interviews:
        history.append({
            "id": i.id,
            "interview_type": i.interview_type,
            "overall_score": i.overall_score,
            "accuracy": i.technical_accuracy,
            "communication": i.communication_score,
            "duration_secs": i.duration_secs,
            "taken_at": i.created_at.isoformat()
        })
    return jsonify({"success": True, "history": history}), 200

# ─────────────────────────────────────────
# GET /api/interview/report/<id>
# ─────────────────────────────────────────
@interview_bp.route("/report/<int:interview_id>", methods=["GET"])
def get_report(interview_id):
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    interview = MockInterview.query.filter_by(id=interview_id, student_id=student_id).first()
    if not interview:
        return jsonify({"success": False, "message": "Interview report not found."}), 404

    return jsonify({
        "success": True,
        "interview": {
            "id": interview.id,
            "interview_type": interview.interview_type,
            "duration_secs": interview.duration_secs,
            "confidence_score": interview.confidence_score,
            "eye_contact_score": interview.eye_contact_score,
            "speaking_speed": interview.speaking_speed,
            "communication_score": interview.communication_score,
            "grammar_score": interview.grammar_score,
            "fluency_score": interview.fluency_score,
            "technical_accuracy": interview.technical_accuracy,
            "overall_score": interview.overall_score,
            "overall_feedback": interview.overall_feedback,
            "answers_log": json.loads(interview.answers_log or "[]"),
            "created_at": interview.created_at.isoformat()
        }
    }), 200
