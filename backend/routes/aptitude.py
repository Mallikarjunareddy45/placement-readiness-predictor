import json
import random
from flask   import Blueprint, request, jsonify
from models  import db, AptitudeTest, ModuleProgress
from routes.auth import verify_token

aptitude_bp = Blueprint("aptitude", __name__)

# ── Import question banks ──
from question_bank.quantitative_questions import QUANTITATIVE_QUESTIONS
from question_bank.logical_questions      import LOGICAL_QUESTIONS
from question_bank.verbal_questions       import VERBAL_QUESTIONS
from question_bank.reasoning_questions    import REASONING_QUESTIONS

APTITUDE_BANKS = {
    "Quantitative": QUANTITATIVE_QUESTIONS,
    "Logical":      LOGICAL_QUESTIONS,
    "Verbal":       VERBAL_QUESTIONS,
    "Reasoning":    REASONING_QUESTIONS,
}

QUESTIONS_PER_TEST = 20


# ─────────────────────────────────────────
# Helper: pure random selection
# Shuffles options for each question too
# ─────────────────────────────────────────
def select_random_questions(bank, n=20):
    selected = random.sample(bank, min(n, len(bank)))
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
    return questions_for_client, selected


# ─────────────────────────────────────────
# GET /api/aptitude/categories
# Returns all 3 categories with info
# ─────────────────────────────────────────
@aptitude_bp.route("/categories", methods=["GET"])
def get_categories():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    categories = []
    for category, bank in APTITUDE_BANKS.items():
        categories.append({
            "category":        category,
            "total_questions": len(bank),
            "test_questions":  QUESTIONS_PER_TEST,
            "time_limit":      QUESTIONS_PER_TEST * 90,  # 90 seconds per question
            "difficulties": {
                "Easy":   len([q for q in bank if q["difficulty"] == "Easy"]),
                "Medium": len([q for q in bank if q["difficulty"] == "Medium"]),
                "Hard":   len([q for q in bank if q["difficulty"] == "Hard"]),
            },
            "topics": list(set(q["topic"] for q in bank))
        })

    return jsonify({
        "success":    True,
        "categories": categories,
        "message":    "Choose a category to start your aptitude test."
    }), 200


# ─────────────────────────────────────────
# GET /api/aptitude/start/<category>
# Returns 20 pure random questions
# ─────────────────────────────────────────
@aptitude_bp.route("/start/<category>", methods=["GET"])
def start_test(category):
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    if category not in APTITUDE_BANKS:
        return jsonify({
            "success": False,
            "message": f"Category '{category}' not found. Available: {list(APTITUDE_BANKS.keys())}"
        }), 400

    bank = APTITUDE_BANKS[category]
    questions_for_client, _ = select_random_questions(bank, QUESTIONS_PER_TEST)

    return jsonify({
        "success":    True,
        "category":   category,
        "total":      len(questions_for_client),
        "time_limit": QUESTIONS_PER_TEST * 90,
        "questions":  questions_for_client,
        "message":    f"20 random {category} questions. All the best!"
    }), 200


# ─────────────────────────────────────────
# POST /api/aptitude/submit
# Grades answers and saves result
# ─────────────────────────────────────────
@aptitude_bp.route("/submit", methods=["POST"])
def submit_test():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data received."}), 400

    category    = data.get("category")
    answers     = data.get("answers", {})   # {question_id: selected_option}
    time_taken  = data.get("time_taken_secs", 0)

    if not category or category not in APTITUDE_BANKS:
        return jsonify({"success": False, "message": "Valid category required."}), 400
    if not answers:
        return jsonify({"success": False, "message": "No answers submitted."}), 400

    # ── Build answer key ──
    bank        = APTITUDE_BANKS[category]
    answer_key  = {q["id"]: q["answer"] for q in bank}

    correct    = 0
    total      = len(answers)
    results    = []
    topic_stats = {}

    for qid, selected in answers.items():
        correct_answer = answer_key.get(qid, "")
        is_correct     = selected == correct_answer
        if is_correct:
            correct += 1

        q_detail = next((q for q in bank if q["id"] == qid), None)
        if q_detail:
            topic = q_detail.get("topic", "General")
            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            topic_stats[topic]["total"]   += 1
            topic_stats[topic]["correct"] += (1 if is_correct else 0)

            results.append({
                "question_id":    qid,
                "question":       q_detail["question"],
                "your_answer":    selected,
                "correct_answer": correct_answer,
                "is_correct":     is_correct,
                "difficulty":     q_detail["difficulty"],
                "topic":          topic
            })

    # ── Score ──
    score = round((correct / total) * 100) if total > 0 else 0

    # ── Weak and strong topics ──
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

    # ── Category-specific feedback ──
    feedback_map = {
        "Quantitative": {
            "Needs Improvement": "Practice basic arithmetic, percentages, and ratio problems daily on IndiaBix.",
            "Average":           "Focus on time-speed-distance and profit-loss problems. Aim for 65+.",
            "Good":              "Work on advanced topics like permutation, compound interest, and data interpretation.",
            "Excellent":         "Outstanding! You're well-prepared for quantitative rounds."
        },
        "Logical": {
            "Needs Improvement": "Practice syllogisms, blood relations, and coding-decoding daily.",
            "Average":           "Focus on seating arrangements, directions, and number series.",
            "Good":              "Work on complex puzzles, clocks, and calendar problems.",
            "Excellent":         "Excellent logical reasoning! You'll ace placement aptitude rounds."
        },
        "Verbal": {
            "Needs Improvement": "Read English newspapers daily. Practice grammar and vocabulary on GRE word lists.",
            "Average":           "Focus on error detection, synonyms/antonyms, and idioms.",
            "Good":              "Work on reading comprehension and advanced grammar constructs.",
            "Excellent":         "Strong verbal skills! This gives you an edge in HR rounds."
        }
    }
    feedback = feedback_map.get(category, {}).get(performance, "Keep practicing!")

    # ── Save to database ──
    test_record = AptitudeTest(
        student_id      = student_id,
        category        = category,
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

    current_best = progress.aptitude_score or 0
    if score > current_best:
        progress.aptitude_score = score
    progress.aptitude_done = True

    db.session.commit()

    return jsonify({
        "success":       True,
        "category":      category,
        "score":         score,
        "correct":       correct,
        "total":         total,
        "performance":   performance,
        "feedback":      feedback,
        "weak_topics":   weak_topics,
        "strong_topics": strong_topics,
        "time_taken":    time_taken,
        "results":       results,
        "message":       f"{performance}! You scored {score}% in {category} Aptitude."
    }), 200


# ─────────────────────────────────────────
# GET /api/aptitude/history
# Returns all past aptitude test results
# ─────────────────────────────────────────
@aptitude_bp.route("/history", methods=["GET"])
def get_history():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    tests = AptitudeTest.query.filter_by(
        student_id=student_id
    ).order_by(AptitudeTest.created_at.desc()).all()

    history = []
    for t in tests:
        history.append({
            "id":         t.id,
            "category":   t.category,
            "score":      t.score,
            "correct":    t.correct_answers,
            "total":      t.total_questions,
            "time_taken": t.time_taken_secs,
            "taken_at":   t.created_at.isoformat()
        })

    # ── Summary by category ──
    summary = {}
    for t in tests:
        if t.category not in summary:
            summary[t.category] = {"attempts": 0, "best_score": 0, "avg_score": 0, "scores": []}
        summary[t.category]["attempts"]   += 1
        summary[t.category]["scores"].append(t.score)
        summary[t.category]["best_score"]  = max(summary[t.category]["best_score"], t.score)

    for cat in summary:
        scores = summary[cat]["scores"]
        summary[cat]["avg_score"] = round(sum(scores) / len(scores))
        del summary[cat]["scores"]

    return jsonify({
        "success":     True,
        "history":     history,
        "summary":     summary,
        "total_tests": len(history)
    }), 200


# ─────────────────────────────────────────
# GET /api/aptitude/progress
# Returns overall aptitude progress
# ─────────────────────────────────────────
@aptitude_bp.route("/progress", methods=["GET"])
def get_progress():
    student_id, error = verify_token(request)
    if error:
        return jsonify({"success": False, "message": error}), 401

    overall = {}
    for category in APTITUDE_BANKS.keys():
        tests = AptitudeTest.query.filter_by(
            student_id=student_id,
            category=category
        ).order_by(AptitudeTest.created_at.desc()).all()

        if tests:
            scores = [t.score for t in tests]
            overall[category] = {
                "attempted":   True,
                "best_score":  max(scores),
                "avg_score":   round(sum(scores) / len(scores)),
                "attempts":    len(tests),
                "last_score":  tests[0].score,
            }
        else:
            overall[category] = {
                "attempted":  False,
                "best_score": 0,
                "avg_score":  0,
                "attempts":   0,
                "last_score": 0,
            }

    all_best = [v["best_score"] for v in overall.values() if v["attempted"]]
    overall_aptitude_score = round(sum(all_best) / len(all_best)) if all_best else 0

    return jsonify({
        "success":               True,
        "categories":            overall,
        "overall_aptitude_score": overall_aptitude_score,
        "all_attempted":         all(v["attempted"] for v in overall.values())
    }), 200