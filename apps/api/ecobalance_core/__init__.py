"""EcoBalance calculation core.

Framework-free package: no FastAPI/DB dependencies. Implements the LCA/CBAM
methodology described in docs/methodology/ — units, inputs, formulas,
scopes, allocation, hotspots, scenarios. Deterministic and typed; all
emission-factor data here is illustrative (`is_demo=True`), not verified
against a real regulatory source.
"""

from ecobalance_core.engine import calculate
from ecobalance_core.models import CalculationInput, CalculationResult

__all__ = ["calculate", "CalculationInput", "CalculationResult"]
