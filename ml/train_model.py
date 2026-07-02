import os, joblib, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

from sklearn.model_selection  import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing    import MinMaxScaler, LabelEncoder
from sklearn.pipeline         import Pipeline
from sklearn.metrics          import (accuracy_score, precision_score, recall_score,
                                      f1_score, roc_auc_score, confusion_matrix,
                                      classification_report, roc_curve,
                                      precision_recall_curve)
from sklearn.ensemble         import (RandomForestClassifier, ExtraTreesClassifier,
                                      GradientBoostingClassifier)
from sklearn.linear_model     import LogisticRegression
from sklearn.feature_selection import SelectFromModel
from xgboost                  import XGBClassifier
from imblearn.over_sampling   import SMOTE

try:
    import lightgbm as lgb
    HAS_LGBM = True
except:
    HAS_LGBM = False
    print("⚠️  LightGBM not installed. Skipping.")

HAS_CATBOOST = False  # Disabled — use XGBoost instead
print("ℹ️  CatBoost disabled. Using XGBoost as primary model.")

# ─────────────────────────────────────────
# Paths
# ─────────────────────────────────────────
BASE_DIR      = os.path.dirname(__file__)
DATASET_PATH  = os.path.join(BASE_DIR, "students_dataset.csv")
MODEL_PATH    = os.path.join(BASE_DIR, "model.pkl")
SCALER_PATH   = os.path.join(BASE_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "feature_columns.pkl")

print("=" * 65)
print("   Placement Readiness Predictor — Professional ML Pipeline")
print("=" * 65)


# ─────────────────────────────────────────
# Step 1: Load & validate dataset
# ─────────────────────────────────────────
print("\n📂 Loading dataset...")
df = pd.read_csv(DATASET_PATH)
print(f"✅ Loaded {len(df)} rows, {len(df.columns)} columns")

print(f"\n📊 Class distribution:")
vc = df['placement_ready'].value_counts()
print(f"   Ready (1)     : {vc.get(1,0)} ({vc.get(1,0)/len(df)*100:.1f}%)")
print(f"   Not Ready (0) : {vc.get(0,0)} ({vc.get(0,0)/len(df)*100:.1f}%)")


# ─────────────────────────────────────────
# Step 2: Preprocessing
# ─────────────────────────────────────────
print("\n⚙️  Preprocessing...")

# Encode project_complexity
complexity_map = {"Low": 1, "Medium": 2, "High": 3}
df["project_complexity"] = df["project_complexity"].map(complexity_map).fillna(2)

# Define features
FEATURE_COLUMNS = [
    "cgpa", "coding_score", "dsa_score", "projects_count",
    "project_complexity", "internships", "communication_score",
    "mock_interview_score", "resume_score", "certifications",
    "aptitude_score", "technical_score", "skill_match_score",
    "ats_score", "github_score", "backlogs", "college_tier"
]

# Only use columns that exist in the dataset
FEATURE_COLUMNS = [c for c in FEATURE_COLUMNS if c in df.columns]
print(f"   Using {len(FEATURE_COLUMNS)} features: {FEATURE_COLUMNS}")

X = df[FEATURE_COLUMNS].copy()
y = df["placement_ready"].copy()

# Handle missing values
X = X.fillna(X.median())

# Clip outliers at 1st and 99th percentile
for col in X.select_dtypes(include='number').columns:
    lo = X[col].quantile(0.01)
    hi = X[col].quantile(0.99)
    X[col] = X[col].clip(lo, hi)

print("✅ Preprocessing complete")


# ─────────────────────────────────────────
# Step 3: Stratified train/test split
# ─────────────────────────────────────────
print("\n✂️  Splitting data (stratified 80/20)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"   Train: {len(X_train)} | Test: {len(X_test)}")


# ─────────────────────────────────────────
# Step 4: Handle class imbalance with SMOTE
# Only apply to training data
# ─────────────────────────────────────────
print("\n⚖️  Handling class imbalance with SMOTE...")
try:
    smote = SMOTE(random_state=42, k_neighbors=min(5, vc.min()-1))
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
    print(f"   Before SMOTE: {dict(pd.Series(y_train).value_counts())}")
    print(f"   After SMOTE : {dict(pd.Series(y_train_bal).value_counts())}")
except Exception as e:
    print(f"   SMOTE skipped: {e}. Using original distribution.")
    X_train_bal, y_train_bal = X_train, y_train


# ─────────────────────────────────────────
# Step 5: Feature scaling
# ─────────────────────────────────────────
print("\n📏 Scaling features...")
scaler      = MinMaxScaler()
X_train_sc  = scaler.fit_transform(X_train_bal)
X_test_sc   = scaler.transform(X_test)
print("✅ MinMaxScaler fitted")


# ─────────────────────────────────────────
# Step 6: Train multiple models
# ─────────────────────────────────────────
print("\n🤖 Training models...")

models = {
    "XGBoost": XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.08,
        subsample=0.8, colsample_bytree=0.8,
        min_child_weight=3, reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, eval_metric="logloss", verbosity=0
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_split=5,
        min_samples_leaf=2, random_state=42, n_jobs=-1
    ),
    "Extra Trees": ExtraTreesClassifier(
        n_estimators=300, max_depth=8, min_samples_split=5,
        random_state=42, n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=200, max_depth=4, learning_rate=0.1,
        subsample=0.8, random_state=42
    ),
    "Logistic Regression": LogisticRegression(
        C=1.0, max_iter=1000, random_state=42
    ),
}

if HAS_LGBM:
    models["LightGBM"] = lgb.LGBMClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.08,
        subsample=0.8, random_state=42, verbose=-1
    )
if HAS_CATBOOST:
    models["CatBoost"] = CatBoostClassifier(
        iterations=300, depth=5, learning_rate=0.08,
        random_seed=42, verbose=0
    )

# Cross-validation setup
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

results = {}
print(f"\n{'Model':<22} {'Acc':>6} {'Prec':>6} {'Rec':>6} {'F1':>6} {'AUC':>6} {'CV-F1':>8}")
print("-" * 65)

for name, clf in models.items():
    clf.fit(X_train_sc, y_train_bal)
    y_pred  = clf.predict(X_test_sc)
    y_proba = clf.predict_proba(X_test_sc)[:, 1]

    acc   = accuracy_score(y_test,  y_pred)
    prec  = precision_score(y_test, y_pred, zero_division=0)
    rec   = recall_score(y_test,    y_pred, zero_division=0)
    f1    = f1_score(y_test,        y_pred, zero_division=0)
    auc   = roc_auc_score(y_test,   y_proba)
    cv_f1 = cross_val_score(clf, X_train_sc, y_train_bal,
                             cv=cv, scoring='f1').mean()

    results[name] = {
        "model": clf, "accuracy": acc, "precision": prec,
        "recall": rec, "f1": f1, "auc": auc, "cv_f1": cv_f1,
        "composite": (f1 * 0.35 + auc * 0.35 + cv_f1 * 0.30)
    }
    print(f"{name:<22} {acc:>6.3f} {prec:>6.3f} {rec:>6.3f} {f1:>6.3f} {auc:>6.3f} {cv_f1:>8.3f}")


# ─────────────────────────────────────────
# Step 7: Select best model
# Composite score = F1(35%) + AUC(35%) + CV_F1(30%)
# ─────────────────────────────────────────
best_name = max(results, key=lambda k: results[k]["composite"])
best      = results[best_name]
best_model = best["model"]

print(f"\n🏆 Best Model: {best_name}")
print(f"   Composite Score: {best['composite']:.4f}")
print(f"   Accuracy  : {best['accuracy']*100:.2f}%")
print(f"   Precision : {best['precision']*100:.2f}%")
print(f"   Recall    : {best['recall']*100:.2f}%")
print(f"   F1 Score  : {best['f1']*100:.2f}%")
print(f"   ROC-AUC   : {best['auc']*100:.2f}%")
print(f"   CV F1     : {best['cv_f1']*100:.2f}%")


# ─────────────────────────────────────────
# Step 8: Full classification report
# ─────────────────────────────────────────
y_pred_best = best_model.predict(X_test_sc)
print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred_best,
      target_names=["Not Ready", "Ready"]))


# ─────────────────────────────────────────
# Step 9: Feature importance
# ─────────────────────────────────────────
print("\n📊 Feature Importance:")
if hasattr(best_model, 'feature_importances_'):
    importances = best_model.feature_importances_
    feat_df = pd.DataFrame({
        "Feature":    FEATURE_COLUMNS,
        "Importance": importances
    }).sort_values("Importance", ascending=False)

    for _, row in feat_df.iterrows():
        bar = '█' * int(row['Importance'] * 60)
        print(f"   {row['Feature']:<25} {bar} {row['Importance']:.4f}")
else:
    feat_df = pd.DataFrame({"Feature": FEATURE_COLUMNS, "Importance": [0]*len(FEATURE_COLUMNS)})

# Save feature importance plot
plt.figure(figsize=(10, 6))
feat_top = feat_df.head(12)
sns.barplot(x="Importance", y="Feature", data=feat_top, palette="Blues_r")
plt.title(f"Feature Importance — {best_name}")
plt.tight_layout()
plt.savefig(os.path.join(BASE_DIR, "feature_importance.png"))
plt.close()
print(f"\n✅ Feature importance plot saved")


# ─────────────────────────────────────────
# Step 10: Confusion matrix
# ─────────────────────────────────────────
cm = confusion_matrix(y_test, y_pred_best)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=["Not Ready", "Ready"],
            yticklabels=["Not Ready", "Ready"])
plt.title(f"Confusion Matrix — {best_name}")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig(os.path.join(BASE_DIR, "confusion_matrix.png"))
plt.close()
print("✅ Confusion matrix saved")


# ─────────────────────────────────────────
# Step 11: ROC Curve
# ─────────────────────────────────────────
y_proba_best = best_model.predict_proba(X_test_sc)[:, 1]
fpr, tpr, _ = roc_curve(y_test, y_proba_best)
plt.figure(figsize=(7, 5))
plt.plot(fpr, tpr, color='royalblue', lw=2,
         label=f'ROC Curve (AUC = {best["auc"]:.3f})')
plt.plot([0, 1], [0, 1], 'k--', lw=1)
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title(f'ROC Curve — {best_name}')
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(BASE_DIR, "roc_curve.png"))
plt.close()
print("✅ ROC curve saved")


# ─────────────────────────────────────────
# Step 12: Save model, scaler, feature list
# ─────────────────────────────────────────
print("\n💾 Saving model artifacts...")
joblib.dump(best_model,      MODEL_PATH)
joblib.dump(scaler,          SCALER_PATH)
joblib.dump(FEATURE_COLUMNS, FEATURES_PATH)
print(f"✅ model.pkl        → {MODEL_PATH}")
print(f"✅ scaler.pkl       → {SCALER_PATH}")
print(f"✅ feature_columns.pkl → {FEATURES_PATH}")

print(f"\n🎉 ML Pipeline complete! Best model: {best_name}")
print(f"   Ready for Step 5 — Flask API upgrade.")