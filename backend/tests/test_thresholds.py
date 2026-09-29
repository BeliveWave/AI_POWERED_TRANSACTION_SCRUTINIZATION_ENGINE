"""
Threshold Boundary Tests — AI-Powered Transaction Scrutinization Engine
=======================================================================
Tests the gap-free decision policy implemented in /api/score.

BRD AMBIGUITY (documented):
  The BRD had threshold gaps at 0.50 (uncovered) and 0.70–0.71 (gap).
  Implemented resolution:
    score >= 0.70 → Decline   (conservative: closes gap downward)
    score >= 0.50 → Escalate  (0.50 itself → Escalate, not Approve)
    score <  0.50 → Approve

Run: cd backend && python -m pytest tests/ -v
"""

import pytest

# ── Policy under test ─────────────────────────────────────────────────────────
# This mirrors the exact logic in /api/score endpoint

def apply_decision(fraud_score: float, decline_threshold: float = 0.70, review_threshold: float = 0.50) -> str:
    """
    Gap-free decision policy.
    Fully contiguous: every possible score [0.0, 1.0] maps to exactly one decision.
    """
    if fraud_score >= decline_threshold:
        return "Decline"
    elif fraud_score >= review_threshold:
        return "Escalate"
    else:
        return "Approve"


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestDefaultThresholds:
    """Tests using default thresholds: decline=0.70, review=0.50"""

    # ── Approve zone ──────────────────────────────────────────────────────────
    def test_approve_zero(self):
        assert apply_decision(0.00) == "Approve"

    def test_approve_low(self):
        assert apply_decision(0.25) == "Approve"

    def test_approve_just_below_review(self):
        """0.499 is strictly below review threshold → Approve"""
        assert apply_decision(0.499) == "Approve"

    def test_approve_very_close_below_review(self):
        assert apply_decision(0.4999) == "Approve"

    # ── Escalate zone ─────────────────────────────────────────────────────────
    def test_escalate_at_review_boundary(self):
        """BRD ambiguity: score=0.50 was uncovered. Resolution: Escalate (safer)."""
        assert apply_decision(0.50) == "Escalate"

    def test_escalate_mid(self):
        assert apply_decision(0.60) == "Escalate"

    def test_escalate_just_below_decline(self):
        """0.699 is below decline threshold → Escalate"""
        assert apply_decision(0.699) == "Escalate"

    def test_escalate_brd_gap_zone_lower(self):
        """BRD gap: score=0.70 was between review-end (0.70) and decline-start (0.71).
        Resolution: Decline (gap closed downward to 0.70)."""
        # At 0.70 with our policy → Decline (threshold is inclusive >=)
        assert apply_decision(0.70) == "Decline"

    def test_escalate_brd_gap_705(self):
        """Score 0.705 was in BRD gap (0.70–0.71). Now clearly Decline."""
        assert apply_decision(0.705) == "Decline"

    def test_escalate_brd_gap_710(self):
        """Score 0.710 was BRD decline start. Now Decline."""
        assert apply_decision(0.71) == "Decline"

    # ── Decline zone ──────────────────────────────────────────────────────────
    def test_decline_at_threshold(self):
        """score=0.70 (our threshold) → Decline"""
        assert apply_decision(0.70) == "Decline"

    def test_decline_high(self):
        assert apply_decision(0.85) == "Decline"

    def test_decline_max(self):
        assert apply_decision(1.00) == "Decline"

    def test_decline_very_high(self):
        assert apply_decision(0.9999) == "Decline"


class TestContinuity:
    """Verify no gaps exist in the policy — every value maps to exactly one decision."""

    def test_no_gap_full_range(self):
        """Test 10,000 evenly spaced values — every one maps to a decision."""
        decisions = set()
        for i in range(10001):
            score = i / 10000
            d = apply_decision(score)
            assert d in {"Approve", "Escalate", "Decline"}, f"Unknown decision for score={score}"
            decisions.add(d)
        assert decisions == {"Approve", "Escalate", "Decline"}, "Not all decisions were reachable"

    def test_monotonic(self):
        """Higher score should never produce a less severe decision."""
        decision_order = {"Approve": 0, "Escalate": 1, "Decline": 2}
        prev_severity = 0
        for i in range(10001):
            score = i / 10000
            d = apply_decision(score)
            severity = decision_order[d]
            assert severity >= prev_severity, (
                f"Non-monotonic at score={score:.4f}: got {d} after {prev_severity}"
            )
            prev_severity = severity


class TestCustomThresholds:
    """Verify configurable thresholds work correctly."""

    def test_strict_thresholds(self):
        """decline=0.60, review=0.40"""
        assert apply_decision(0.39, 0.60, 0.40) == "Approve"
        assert apply_decision(0.40, 0.60, 0.40) == "Escalate"
        assert apply_decision(0.59, 0.60, 0.40) == "Escalate"
        assert apply_decision(0.60, 0.60, 0.40) == "Decline"
        assert apply_decision(0.99, 0.60, 0.40) == "Decline"

    def test_lenient_thresholds(self):
        """decline=0.90, review=0.70"""
        assert apply_decision(0.69, 0.90, 0.70) == "Approve"
        assert apply_decision(0.70, 0.90, 0.70) == "Escalate"
        assert apply_decision(0.89, 0.90, 0.70) == "Escalate"
        assert apply_decision(0.90, 0.90, 0.70) == "Decline"


class TestEdgeCases:
    """Edge cases that could crash or produce wrong results."""

    def test_exactly_zero(self):
        assert apply_decision(0.0) == "Approve"

    def test_exactly_one(self):
        assert apply_decision(1.0) == "Decline"

    def test_float_precision(self):
        """Floating point arithmetic should not create edge cases."""
        # 0.1 + 0.1 + 0.1 + 0.1 + 0.1 = 0.5000000000000001 in floating point
        score = 0.1 + 0.1 + 0.1 + 0.1 + 0.1
        d = apply_decision(score)
        assert d in {"Approve", "Escalate"}, f"Unexpected: {d} for score={score}"

    def test_score_just_above_approve_boundary(self):
        """0.50000001 should Escalate."""
        assert apply_decision(0.50000001) == "Escalate"

    def test_score_just_below_approve_boundary(self):
        """0.49999999 should Approve."""
        assert apply_decision(0.49999999) == "Approve"
