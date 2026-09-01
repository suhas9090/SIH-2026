"""
Requirement Normalization Layer (Spec §5)

Converts synonymous tender language into a canonical TenderRequirement structure.
Different tenders express the same requirement differently — this layer makes
them machine-comparable without losing information.

Example:
  "Annual turnover should not be less than Rs. 5 Crores."
  "The bidder shall possess an average yearly turnover of at least INR 5 crore."
  → both map to:
  {
    "parameter": "average_annual_turnover",
    "operator": ">=",
    "value": 50000000,
    "currency": "INR",
    "period": "last_3_financial_years"
  }

Architecture:
  1. Deterministic regex rules for known patterns (fast, no LLM needed)
  2. LLM fallback only for genuinely ambiguous expressions
"""

import re
from typing import Dict, Any, Optional, List
from loguru import logger


# ---------------------------------------------------------------------------
# Currency normalization — maps all Indian currency expressions to paise
# ---------------------------------------------------------------------------
_CURRENCY_MULTIPLIERS = {
    "crore": 10_000_000,
    "cr":    10_000_000,
    "lakh":  100_000,
    "lac":   100_000,
    "lacs":  100_000,
    "lakhs": 100_000,
    "thousand": 1_000,
}

_CURRENCY_SYMBOLS = {
    "rs.": "INR",
    "rs": "INR",
    "inr": "INR",
    "₹": "INR",
}

# ---------------------------------------------------------------------------
# Operator normalization
# ---------------------------------------------------------------------------
_OPERATOR_PHRASES: List[tuple] = [
    # Pattern                                           → operator
    (r"should\s+not\s+be\s+less\s+than",               ">="),
    (r"shall\s+not\s+be\s+less\s+than",                ">="),
    (r"not\s+less\s+than",                             ">="),
    (r"at\s+least",                                    ">="),
    (r"minimum\s+of",                                  ">="),
    (r"minimum",                                       ">="),
    (r"greater\s+than\s+or\s+equal\s+to",              ">="),
    (r"atleast",                                       ">="),
    (r"should\s+not\s+exceed",                         "<="),
    (r"shall\s+not\s+exceed",                          "<="),
    (r"not\s+more\s+than",                             "<="),
    (r"maximum\s+of",                                  "<="),
    (r"maximum",                                       "<="),
    (r"less\s+than\s+or\s+equal\s+to",                 "<="),
    (r"equal\s+to",                                    "="),
    (r"must\s+be",                                     "="),
    (r"should\s+be",                                   "="),
]

# ---------------------------------------------------------------------------
# Period normalization
# ---------------------------------------------------------------------------
_PERIOD_PATTERNS: List[tuple] = [
    (r"preceding\s+(?:three|3)\s+financial\s+years?",     "last_3_financial_years"),
    (r"last\s+(?:three|3)\s+financial\s+years?",          "last_3_financial_years"),
    (r"previous\s+(?:three|3)\s+financial\s+years?",      "last_3_financial_years"),
    (r"preceding\s+(?:two|2)\s+financial\s+years?",       "last_2_financial_years"),
    (r"last\s+(?:two|2)\s+financial\s+years?",            "last_2_financial_years"),
    (r"preceding\s+(?:five|5)\s+financial\s+years?",      "last_5_financial_years"),
    (r"last\s+(?:five|5)\s+financial\s+years?",           "last_5_financial_years"),
    (r"(?:current|this)\s+financial\s+year",              "current_financial_year"),
    (r"(?:three|3)\s+years?",                             "3_years"),
    (r"(?:five|5)\s+years?",                              "5_years"),
    (r"(?:two|2)\s+years?",                               "2_years"),
    (r"(?:one|1)\s+year",                                 "1_year"),
]

# ---------------------------------------------------------------------------
# Parameter type mapping from common requirement keywords
# ---------------------------------------------------------------------------
_PARAMETER_KEYWORDS: Dict[str, str] = {
    "turnover":             "average_annual_turnover",
    "revenue":              "average_annual_turnover",
    "annual sales":         "average_annual_turnover",
    "experience":           "years_of_experience",
    "employees":            "employee_count",
    "net worth":            "net_worth",
    "paid up capital":      "paid_up_capital",
    "working capital":      "working_capital",
}


class NormalizedRequirement:
    """Canonical representation of a single tender requirement."""

    def __init__(self):
        self.parameter: Optional[str] = None
        self.operator: Optional[str] = None
        self.value: Optional[float] = None
        self.currency: Optional[str] = None
        self.unit: Optional[str] = None
        self.period: Optional[str] = None
        self.text_value: Optional[str] = None
        self.raw_text: str = ""
        self.normalized: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parameter": self.parameter,
            "operator": self.operator,
            "value": self.value,
            "currency": self.currency,
            "unit": self.unit,
            "period": self.period,
            "textValue": self.text_value,
            "rawText": self.raw_text,
            "normalized": self.normalized,
        }


class RequirementNormalizer:
    """
    Deterministic-first requirement normalizer.

    For most procurement requirements, regex rules are sufficient and faster.
    LLM is only invoked as a fallback for genuinely ambiguous expressions.
    """

    def normalize(self, requirement: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a single requirement dict.
        Input: raw requirement (may contain description, textValue, minimumValue, etc.)
        Output: same dict with normalized fields added/corrected.
        """
        raw_text = requirement.get("description", "") or requirement.get("title", "")
        result = self._normalize_text(raw_text)

        normalized = dict(requirement)

        # Apply normalized values only if deterministic extraction succeeded
        if result.normalized:
            if result.operator and not normalized.get("operator"):
                normalized["operator"] = result.operator
            if result.value is not None and not normalized.get("minimumValue"):
                normalized["minimumValue"] = result.value
            if result.currency and not normalized.get("currency"):
                normalized["currency"] = result.currency
            if result.period and not normalized.get("period"):
                normalized["period"] = result.period
            if result.parameter and not normalized.get("parameter"):
                normalized["parameter"] = result.parameter

        normalized["_normalizationApplied"] = result.normalized
        return normalized

    def normalize_batch(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize a list of requirements."""
        return [self.normalize(r) for r in requirements]

    # ------------------------------------------------------------------
    # Internal deterministic logic
    # ------------------------------------------------------------------

    def _normalize_text(self, text: str) -> NormalizedRequirement:
        result = NormalizedRequirement()
        result.raw_text = text

        if not text:
            return result

        lower = text.lower()

        # 1. Extract operator
        result.operator = self._extract_operator(lower)

        # 2. Extract numeric value + currency
        value, currency = self._extract_value_currency(lower)
        result.value = value
        result.currency = currency

        # 3. Extract period
        result.period = self._extract_period(lower)

        # 4. Identify parameter type
        result.parameter = self._extract_parameter(lower)

        # Mark as normalized if we found at least operator + value
        if result.operator and result.value is not None:
            result.normalized = True
        elif result.operator or result.period:
            result.normalized = True  # Partial normalization still useful

        return result

    def _extract_operator(self, text: str) -> Optional[str]:
        for pattern, operator in _OPERATOR_PHRASES:
            if re.search(pattern, text, re.IGNORECASE):
                return operator
        return None

    def _extract_value_currency(self, text: str) -> tuple:
        """
        Extract numeric value and currency from text.
        Returns (value_in_base_units, currency_code).
        Base unit for INR = Rupees (not paise).
        """
        # Pattern: number followed by optional multiplier
        # e.g. "5 crore", "10.5 lakh", "Rs. 50 lakh"
        pattern = r"""
            (?:rs\.?\s*|inr\s*|₹\s*)?          # optional currency prefix
            (\d+(?:\.\d+)?)                      # numeric value
            \s*
            (crore|cr|lakh|lac|lacs|lakhs|thousand)?  # optional multiplier
        """
        matches = re.findall(pattern, text, re.IGNORECASE | re.VERBOSE)

        best_value = None
        currency = "INR"

        for num_str, multiplier in matches:
            try:
                num = float(num_str)
                if multiplier:
                    mult_key = multiplier.lower().strip()
                    num = num * _CURRENCY_MULTIPLIERS.get(mult_key, 1)
                if best_value is None or num > best_value:
                    best_value = num
            except ValueError:
                continue

        # Detect currency symbol
        for symbol, code in _CURRENCY_SYMBOLS.items():
            if symbol in text:
                currency = code
                break

        return best_value, currency if best_value else None

    def _extract_period(self, text: str) -> Optional[str]:
        for pattern, period in _PERIOD_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return period
        return None

    def _extract_parameter(self, text: str) -> Optional[str]:
        for keyword, param in _PARAMETER_KEYWORDS.items():
            if keyword in text:
                return param
        return None
