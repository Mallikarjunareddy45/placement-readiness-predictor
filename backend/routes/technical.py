import os, json, random
from flask   import Blueprint, request, jsonify
from models  import db, TechnicalTest, ModuleProgress, ResumeAnalysis
from routes.auth import verify_token

technical_bp = Blueprint("technical", __name__)

# ── Import all question banks ──
from question_bank.python_questions import PYTHON_QUESTIONS
from question_bank.sql_questions    import SQL_QUESTIONS
from question_bank.ml_questions     import ML_QUESTIONS
from question_bank.dsa_questions    import DSA_QUESTIONS
from question_bank.ai_questions     import AI_QUESTIONS
from question_bank.java_questions   import JAVA_QUESTIONS
from question_bank.cpp_questions    import CPP_QUESTIONS
from question_bank.js_questions     import JS_QUESTIONS
from question_bank.react_questions  import REACT_QUESTIONS
from question_bank.dbms_questions   import DBMS_QUESTIONS
from question_bank.os_questions     import OS_QUESTIONS
from question_bank.networks_questions import NETWORKS_QUESTIONS
from question_bank.datascience_questions import DATASCIENCE_QUESTIONS

QUESTION_BANKS = {
    "Python":       PYTHON_QUESTIONS,
    "SQL":          SQL_QUESTIONS,
    "ML":           ML_QUESTIONS,
    "DSA":          DSA_QUESTIONS,
    "AI":           AI_QUESTIONS,
    "Java":         JAVA_QUESTIONS,
    "C++":          CPP_QUESTIONS,
    "C":            CPP_QUESTIONS, # Alias to C++ questions
    "JavaScript":   JS_QUESTIONS,
    "React":        REACT_QUESTIONS,
    "DBMS":         DBMS_QUESTIONS,
    "OS":           OS_QUESTIONS,
    "Networks":     NETWORKS_QUESTIONS,
    "Data Science": DATASCIENCE_QUESTIONS,
}

QUESTIONS_PER_TEST = 20


# ─────────────────────────────────────────
# Helper: get resume skills for student
# ─────────────────────────────────────────
def get_resume_skills(student_id):
    analysis = ResumeAnalysis.query.filter_by(
        student_id=student_id
    ).order_by(ResumeAnalysis.created_at.desc()).first()

    if analysis and analysis.detected_skills:
        return json.loads(analysis.detected_skills)
    return []


# ─────────────────────────────────────────
# Helper: smart question selection
# Weights questions based on resume skills
# Students weak in a topic get more
# questions from that topic
# ─────────────────────────────────────────
def select_questions(bank, resume_skills, subject, n=20):
    subject_lower  = subject.lower()
    resume_lower   = [s.lower() for s in resume_skills]

    # Determine student's topic strengths from resume
    strong_topics  = []
    weak_topics    = []

    # Subject-specific skill mapping
    skill_topic_map = {
        "Python": {
            "strong": ["python", "django", "flask", "fastapi"],
            "topics": ["OOP", "Functions", "Data Types", "Advanced Python"]
        },
        "SQL": {
            "strong": ["sql", "mysql", "postgresql", "sqlite"],
            "topics": ["Joins", "Window Functions", "Optimization"]
        },
        "ML": {
            "strong": ["machine learning", "scikit-learn", "xgboost", "tensorflow", "pytorch"],
            "topics": ["Deep Learning", "Ensemble Methods", "Model Evaluation"]
        },
        "DSA": {
            "strong": ["data structures", "algorithms"],
            "topics": ["Graph Algorithms", "Dynamic Programming", "Advanced Data Structures"]
        },
        "AI": {
            "strong": ["ai", "nlp", "langchain", "transformers", "llm"],
            "topics": ["LLMs", "Transformers", "Agentic AI"]
        }
    }

    mapping = skill_topic_map.get(subject, {})
    strong_skills = mapping.get("strong", [])
    student_is_strong = any(s in resume_lower for s in strong_skills)

    # Categorize questions by difficulty
    easy   = [q for q in bank if q["difficulty"] == "Easy"]
    medium = [q for q in bank if q["difficulty"] == "Medium"]
    hard   = [q for q in bank if q["difficulty"] == "Hard"]

    # If student is strong in this subject → more hard questions
    # If student is weak → balanced mix to build confidence
    if student_is_strong:
        # Strong student: 20% Easy, 40% Medium, 40% Hard
        n_easy   = max(1, int(n * 0.20))
        n_medium = max(1, int(n * 0.40))
        n_hard   = n - n_easy - n_medium
    else:
        # Weak student: 35% Easy, 45% Medium, 20% Hard
        n_easy   = max(1, int(n * 0.35))
        n_medium = max(1, int(n * 0.45))
        n_hard   = n - n_easy - n_medium

    # Random sample from each difficulty
    selected = []
    selected += random.sample(easy,   min(n_easy,   len(easy)))
    selected += random.sample(medium, min(n_medium, len(medium)))
    selected += random.sample(hard,   min(n_hard,   len(hard)))

    # Fill remaining slots if bank is smaller than expected
    remaining = n - len(selected)
    if remaining > 0:
        used_ids = {q["id"] for q in selected}
        leftover = [q for q in bank if q["id"] not in used_ids]
        selected += random.sample(leftover, min(remaining, len(leftover)))

    # Shuffle final selection and shuffle options for each question
    random.shuffle(selected)

    # Return clean questions (without answer) for frontend
    questions_for_client = []
    for q in selected:
        opts = q["options"].copy()
        random.shuffle(opts)
        questions_for_client.append({
            "id":         q["id"],
            "question":   q["question"],
            "options":    opts,
            "difficulty": q["difficulty"],
            "topic":      q["topic"],
        })

    return questions_for_client, selected  # client version + full version with answers


# ─────────────────────────────────────────
# GET /api/technical/subjects
# Returns available subjects
# ─────────────────────────────────────────
@technical_bp.route("/subjects", methods=["GET"])
def get_subjects():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    resume_skills = get_resume_skills(student_id)
    subjects_info = []

    for subject, bank in QUESTION_BANKS.items():
        subjects_info.append({
            "subject":        subject,
            "total_questions": len(bank),
            "test_questions":  QUESTIONS_PER_TEST,
            "difficulties": {
                "Easy":   len([q for q in bank if q["difficulty"] == "Easy"]),
                "Medium": len([q for q in bank if q["difficulty"] == "Medium"]),
                "Hard":   len([q for q in bank if q["difficulty"] == "Hard"]),
            }
        })

    return jsonify({
        "success":       True,
        "subjects":      subjects_info,
        "resume_skills": resume_skills,
        "message":       "Questions will be personalized based on your resume skills."
    }), 200


# ─────────────────────────────────────────
# GET /api/technical/start/<subject>
# Returns 20 random personalized questions
# ─────────────────────────────────────────
@technical_bp.route("/start/<subject>", methods=["GET"])
def start_test(subject):
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    if subject not in QUESTION_BANKS:
        return jsonify({
            "success": False,
            "message": f"Subject '{subject}' not found. Available: {list(QUESTION_BANKS.keys())}"
        }), 400

    resume_skills = get_resume_skills(student_id)
    bank          = QUESTION_BANKS[subject]

    questions_for_client, _ = select_questions(
        bank, resume_skills, subject, QUESTIONS_PER_TEST
    )

    return jsonify({
        "success":       True,
        "subject":       subject,
        "total":         len(questions_for_client),
        "time_limit":    QUESTIONS_PER_TEST * 60,  # 60 seconds per question
        "questions":     questions_for_client,
        "message":       f"Questions personalized based on your resume. Good luck!"
    }), 200


# ─────────────────────────────────────────
# POST /api/technical/submit
# Receives answers, scores them, saves result
# ─────────────────────────────────────────
@technical_bp.route("/submit", methods=["POST"])
def submit_test():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    subject     = data.get("subject")
    answers     = data.get("answers", {})   # {question_id: selected_option}
    time_taken  = data.get("time_taken_secs", 0)

    if not subject or subject not in QUESTION_BANKS:
        return jsonify({"success": False, "message": "Valid subject required."}), 400

    if not answers:
        return jsonify({"success": False, "message": "No answers submitted."}), 400

    # ── Grade answers ──
    bank        = QUESTION_BANKS[subject]
    answer_key  = {q["id"]: q["answer"] for q in bank}

    correct     = 0
    total       = len(answers)
    results     = []
    topic_stats = {}

    for qid, selected in answers.items():
        correct_answer = answer_key.get(qid, "")
        is_correct     = selected == correct_answer

        if is_correct:
            correct += 1

        # Find question details
        q_detail = next((q for q in bank if q["id"] == qid), None)
        if q_detail:
            topic = q_detail.get("topic", "General")
            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            topic_stats[topic]["total"]  += 1
            topic_stats[topic]["correct"] += (1 if is_correct else 0)

            results.append({
                "question_id":     qid,
                "question":        q_detail["question"],
                "your_answer":     selected,
                "correct_answer":  correct_answer,
                "is_correct":      is_correct,
                "difficulty":      q_detail["difficulty"],
                "topic":           topic
            })

    # ── Calculate score ──
    score = round((correct / total) * 100) if total > 0 else 0

    # ── Identify weak topics ──
    weak_topics   = []
    strong_topics = []
    for topic, stats in topic_stats.items():
        accuracy = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        if accuracy < 0.5:
            weak_topics.append(topic)
        elif accuracy >= 0.75:
            strong_topics.append(topic)

    # ── Performance label ──
    if score >= 80:
        performance = "Excellent"
    elif score >= 65:
        performance = "Good"
    elif score >= 50:
        performance = "Average"
    else:
        performance = "Needs Improvement"

    # ── Save to database ──
    test_record = TechnicalTest(
        student_id      = student_id,
        subject         = subject,
        total_questions = total,
        correct_answers = correct,
        score           = score,
        time_taken_secs = time_taken,
        answers_log     = json.dumps(results)
    )
    db.session.add(test_record)

    # ── Update module progress ──
    progress = ModuleProgress.query.filter_by(student_id=student_id).first()
    if not progress:
        progress = ModuleProgress(student_id=student_id)
        db.session.add(progress)

    # Keep best score
    current_best = progress.technical_score or 0
    if score > current_best:
        progress.technical_score = score
    progress.technical_done = True

    db.session.commit()

    return jsonify({
        "success":       True,
        "subject":       subject,
        "score":         score,
        "correct":       correct,
        "total":         total,
        "performance":   performance,
        "weak_topics":   weak_topics,
        "strong_topics": strong_topics,
        "time_taken":    time_taken,
        "results":       results,
        "message":       f"{performance}! You scored {score}% in {subject}."
    }), 200


# ─────────────────────────────────────────
# GET /api/technical/history
# Returns all past test results
# ─────────────────────────────────────────
@technical_bp.route("/history", methods=["GET"])
def get_history():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    tests = TechnicalTest.query.filter_by(
        student_id=student_id
    ).order_by(TechnicalTest.created_at.desc()).all()

    history = []
    for t in tests:
        history.append({
            "id":             t.id,
            "subject":        t.subject,
            "score":          t.score,
            "correct":        t.correct_answers,
            "total":          t.total_questions,
            "time_taken":     t.time_taken_secs,
            "taken_at":       t.created_at.isoformat()
        })

    return jsonify({
        "success": True,
        "history": history,
        "total_tests": len(history)
    }), 200