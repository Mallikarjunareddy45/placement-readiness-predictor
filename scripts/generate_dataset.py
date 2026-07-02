import numpy as np
import pandas as pd
import os

RANDOM_SEED  = 42
NUM_STUDENTS = 2000
OUTPUT_PATH  = os.path.join(os.path.dirname(__file__), "..", "ml", "students_dataset.csv")

np.random.seed(RANDOM_SEED)
print("⏳ Generating realistic student dataset...")

# ─────────────────────────────────────────
# TIER 1: Generate base profiles
# Students come from different backgrounds
# ─────────────────────────────────────────
n = NUM_STUDENTS

# CGPA — bimodal: most students cluster around 6-8
cgpa = np.clip(np.concatenate([
    np.random.normal(7.2, 1.0, int(n * 0.6)),   # average students
    np.random.normal(8.8, 0.6, int(n * 0.25)),  # strong students
    np.random.normal(5.8, 0.5, int(n * 0.15)),  # weak students
]), 5.0, 10.0).round(2)
np.random.shuffle(cgpa)
cgpa = cgpa[:n]

# Coding score — correlated with CGPA but not perfectly
coding_score = np.clip(
    cgpa * 6 + np.random.normal(10, 12, n), 20, 100
).astype(int)

# DSA score — separate from general coding, harder
dsa_score = np.clip(
    coding_score * 0.7 + np.random.normal(5, 15, n), 10, 100
).astype(int)

# Projects count
projects_count = np.clip(
    np.random.poisson(2.5, n), 0, 8
).astype(int)

# Project complexity — correlated with projects count
complexity_raw = projects_count * 0.3 + np.random.normal(0, 0.8, n)
project_complexity = np.where(
    complexity_raw < 0.5, "Low",
    np.where(complexity_raw < 1.5, "Medium", "High")
)

# Internships — most freshers have 0-1
internships = np.clip(
    np.random.choice([0, 1, 2, 3], n, p=[0.35, 0.40, 0.18, 0.07]),
    0, 3
).astype(int)

# Communication score — weakly correlated with mock interview
communication_score = np.clip(
    np.random.normal(62, 18, n), 25, 100
).astype(int)

# Mock interview — correlated with communication and coding
mock_interview_score = np.clip(
    0.4 * coding_score + 0.3 * communication_score + np.random.normal(5, 12, n),
    15, 100
).astype(int)

# Resume score — correlated with projects and certifications
certifications = np.clip(np.random.poisson(2, n), 0, 8).astype(int)

resume_score = np.clip(
    projects_count * 6 + certifications * 4 + internships * 8
    + np.random.normal(30, 12, n), 20, 100
).astype(int)

# Aptitude score — correlated with cgpa and logical ability
aptitude_score = np.clip(
    cgpa * 5 + np.random.normal(15, 12, n), 20, 100
).astype(int)

# Technical score — MCQ on CS subjects
technical_score = np.clip(
    0.5 * coding_score + 0.3 * aptitude_score + np.random.normal(5, 12, n),
    20, 100
).astype(int)

# Skill match score — how well skills match job requirements
skill_match_score = np.clip(
    0.4 * coding_score + 0.3 * technical_score + np.random.normal(5, 15, n),
    15, 100
).astype(int)

# ATS score — how resume passes automated screening
ats_score = np.clip(
    0.5 * resume_score + 0.3 * skill_match_score + np.random.normal(5, 10, n),
    15, 100
).astype(int)

# Backlogs — most students have 0, some have 1-2
backlogs = np.random.choice([0, 0, 0, 0, 1, 1, 2, 3], n)

# GitHub activity score (0-100)
github_score = np.clip(
    0.6 * coding_score + np.random.normal(0, 20, n), 0, 100
).astype(int)

# College tier (1=Top NIT/IIIT, 2=State Engineering, 3=Private)
college_tier = np.random.choice([1, 2, 3], n, p=[0.15, 0.40, 0.45])


# ─────────────────────────────────────────
# TIER 2: Realistic label generation
#
# Encodes actual campus placement hierarchy:
# Round 1 → CGPA filter
# Round 2 → Aptitude filter
# Round 3 → Coding/DSA filter
# Round 4 → Technical interview filter
# Round 5 → HR/Communication filter
#
# A student must clear MOST rounds to be Ready
# ─────────────────────────────────────────

# Round 1: CGPA cutoff (most companies: 6.5+)
# Tier 1 students get slight relaxation from strong brand
cgpa_cutoff = np.where(college_tier == 1, 6.0, 6.5)
clears_cgpa = (cgpa >= cgpa_cutoff).astype(int)

# Round 2: Aptitude (threshold: 50+)
clears_aptitude = (aptitude_score >= 50).astype(int)

# Round 3: Coding/DSA (threshold: 45+ for DSA, 50+ coding)
clears_coding = ((coding_score >= 50) & (dsa_score >= 40)).astype(int)

# Round 4: Technical interview (threshold: 55+)
clears_technical = (technical_score >= 55).astype(int)

# Round 5: HR/Communication (threshold: 50+)
clears_hr = (communication_score >= 50).astype(int)

# Bonus factors
has_internship  = (internships >= 1).astype(int)
has_projects    = (projects_count >= 2).astype(int)
good_resume     = (resume_score >= 60).astype(int)
no_backlogs     = (backlogs == 0).astype(int)

# Weighted score out of 10
rounds_cleared = (
    clears_cgpa * 2 +        # CGPA is mandatory
    clears_aptitude * 1.5 +  # Aptitude is important
    clears_coding * 2.5 +    # Coding is most important
    clears_technical * 2 +   # Technical matters
    clears_hr * 1 +          # HR is baseline
    has_internship * 0.5 +   # Bonus
    has_projects * 0.3 +     # Bonus
    good_resume * 0.2        # Bonus
)

# Base threshold: need to clear ~7 out of 10 points
base_threshold = 7.0

# Add noise to simulate real-world randomness
noise = np.random.normal(0, 0.5, n)
final_score = rounds_cleared + noise

# Placement ready if score crosses threshold
# Force ~60% ready, 40% not ready for realistic balance
threshold = np.percentile(final_score, 40)
placement_ready = (final_score >= threshold).astype(int)


# ─────────────────────────────────────────
# TIER 3: Build DataFrame
# ─────────────────────────────────────────
df = pd.DataFrame({
    "cgpa":                  cgpa,
    "coding_score":          coding_score,
    "dsa_score":             dsa_score,
    "projects_count":        projects_count,
    "project_complexity":    project_complexity,
    "internships":           internships,
    "communication_score":   communication_score,
    "mock_interview_score":  mock_interview_score,
    "resume_score":          resume_score,
    "certifications":        certifications,
    "aptitude_score":        aptitude_score,
    "technical_score":       technical_score,
    "skill_match_score":     skill_match_score,
    "ats_score":             ats_score,
    "github_score":          github_score,
    "backlogs":              backlogs,
    "college_tier":          college_tier,
    "placement_ready":       placement_ready
})

# Remove any rows that are statistically impossible
df = df[~((df["cgpa"] > 9.5) & (df["coding_score"] < 30))]
df = df[~((df["cgpa"] < 5.5) & (df["mock_interview_score"] > 90) & (df["placement_ready"] == 1))]
df = df.drop_duplicates()
df = df.reset_index(drop=True)

# ─────────────────────────────────────────
# TIER 4: Save
# ─────────────────────────────────────────
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df.to_csv(OUTPUT_PATH, index=False)

total     = len(df)
ready     = df["placement_ready"].sum()
not_ready = total - ready

print(f"✅ Dataset generated successfully!")
print(f"   📄 File          : {OUTPUT_PATH}")
print(f"   👥 Total students: {total}")
print(f"   ✅ Ready (1)     : {ready}  ({ready/total*100:.1f}%)")
print(f"   ❌ Not Ready (0) : {not_ready} ({not_ready/total*100:.1f}%)")
print(f"   📊 Features      : {len(df.columns)-1}")
print(f"\n📊 Feature correlations with label:")
numeric_cols = df.select_dtypes(include='number').columns.tolist()
numeric_cols.remove('placement_ready')
for col in numeric_cols:
    corr = df[col].corr(df['placement_ready'])
    bar  = '█' * int(abs(corr) * 30)
    print(f"   {col:<25} {corr:+.3f}  {bar}")
print(f"\n📊 Sample rows:")
print(df.head(3).to_string(index=False))