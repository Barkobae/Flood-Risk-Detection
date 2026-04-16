import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix,
    ConfusionMatrixDisplay, accuracy_score
)
from sklearn.inspection import permutation_importance

# ── 0. Style ──────────────────────────────────────────────────────────────────
sns.set_theme(style="whitegrid", palette="muted", font_scale=1.1)
PALETTE = ["#4C72B0", "#DD8452"]

# ── 1. Load & preprocess ──────────────────────────────────────────────────────
df = pd.read_csv("/mnt/user-data/uploads/1775741069638_NoWaterBody.csv")

# NOTE: 'Flood Occurred' is all-1 (no variance), so we predict Historical Floods
TARGET = "Historical Floods"
DROP_COLS = ["Flood Occurred"]   # drop the leaky / zero-variance column

le_lc = LabelEncoder()
le_st = LabelEncoder()
df["Land Cover"]  = le_lc.fit_transform(df["Land Cover"])
df["Soil Type"]   = le_st.fit_transform(df["Soil Type"])

X = df.drop(columns=[TARGET] + DROP_COLS)
y = df[TARGET]

feature_names = X.columns.tolist()

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ── 2. Find optimal K ─────────────────────────────────────────────────────────
k_range = range(1, 31)
cv_scores = [
    cross_val_score(KNeighborsClassifier(n_neighbors=k), X_train, y_train, cv=5).mean()
    for k in k_range
]
best_k = k_range[np.argmax(cv_scores)]
print(f"Best K = {best_k}  |  CV Accuracy = {max(cv_scores):.4f}")

# ── 3. Train final model ──────────────────────────────────────────────────────
knn = KNeighborsClassifier(n_neighbors=best_k)
knn.fit(X_train, y_train)

y_pred = knn.predict(X_test)
test_acc = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy: {test_acc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["No Flood", "Flood"]))

# ── 4. Permutation feature importance ─────────────────────────────────────────
perm = permutation_importance(knn, X_test, y_test, n_repeats=15, random_state=42)
imp_df = (
    pd.DataFrame({"feature": feature_names, "importance": perm.importances_mean})
    .sort_values("importance", ascending=False)
    .reset_index(drop=True)
)

# ── 5. Figure (2 rows, 3 cols) ────────────────────────────────────────────────
fig = plt.figure(figsize=(20, 13))
fig.suptitle("KNN Flood Prediction Model", fontsize=18, fontweight="bold", y=1.01)
gs = gridspec.GridSpec(2, 3, figure=fig, hspace=0.42, wspace=0.38)

# ── 5a. K vs CV Accuracy ─────────────────────────────────────────────────────
ax1 = fig.add_subplot(gs[0, 0])
ax1.plot(list(k_range), cv_scores, marker="o", linewidth=2,
         color=PALETTE[0], markersize=5)
ax1.axvline(best_k, linestyle="--", color=PALETTE[1], linewidth=1.8,
            label=f"Best K = {best_k}")
ax1.set_title("K vs Cross-Validation Accuracy", fontsize=13, fontweight="bold")
ax1.set_xlabel("Number of Neighbours (K)")
ax1.set_ylabel("Mean CV Accuracy (5-fold)")
ax1.legend()

# ── 5b. Confusion Matrix ──────────────────────────────────────────────────────
ax2 = fig.add_subplot(gs[0, 1])
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["No Flood", "Flood"])
disp.plot(ax=ax2, colorbar=False, cmap="Blues")
ax2.set_title("Confusion Matrix", fontsize=13, fontweight="bold")

# ── 5c. Feature Importances ───────────────────────────────────────────────────
ax3 = fig.add_subplot(gs[0, 2])
colors = [PALETTE[0] if v >= 0 else "#d9534f" for v in imp_df["importance"]]
ax3.barh(imp_df["feature"][::-1], imp_df["importance"][::-1], color=colors[::-1])
ax3.set_title("Permutation Feature Importance", fontsize=13, fontweight="bold")
ax3.set_xlabel("Mean Accuracy Decrease")
ax3.axvline(0, color="grey", linewidth=0.8)

# ── 5d. Rainfall distribution by class ───────────────────────────────────────
ax4 = fig.add_subplot(gs[1, 0])
sns.kdeplot(data=df, x="Rainfall (mm)", hue=TARGET,
            palette=PALETTE, fill=True, alpha=0.45, ax=ax4)
ax4.set_title("Rainfall Distribution by Class", fontsize=13, fontweight="bold")
ax4.legend(title="Historical Flood", labels=["Yes", "No"])

# ── 5e. River Discharge vs Water Level ───────────────────────────────────────
ax5 = fig.add_subplot(gs[1, 1])
for label, color in zip([0, 1], PALETTE):
    mask = df[TARGET] == label
    ax5.scatter(df.loc[mask, "River Discharge (m³/s)"],
                df.loc[mask, "Water Level (m)"],
                alpha=0.35, s=12, color=color,
                label="Flood" if label else "No Flood")
ax5.set_title("River Discharge vs Water Level", fontsize=13, fontweight="bold")
ax5.set_xlabel("River Discharge (m³/s)")
ax5.set_ylabel("Water Level (m)")
ax5.legend(title="Historical Flood")

# ── 5f. Correlation Heatmap ───────────────────────────────────────────────────
ax6 = fig.add_subplot(gs[1, 2])
numeric_df = df[feature_names + [TARGET]].select_dtypes(include="number")
corr = numeric_df.corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, ax=ax6, cmap="coolwarm", center=0,
            annot=True, fmt=".2f", annot_kws={"size": 7},
            linewidths=0.4, cbar_kws={"shrink": 0.8})
ax6.set_title("Feature Correlation Heatmap", fontsize=13, fontweight="bold")
ax6.tick_params(axis="x", rotation=45, labelsize=8)
ax6.tick_params(axis="y", rotation=0, labelsize=8)

plt.savefig("/mnt/user-data/outputs/knn_flood_model.png",
            dpi=150, bbox_inches="tight")
print("\nPlot saved → knn_flood_model.png")
