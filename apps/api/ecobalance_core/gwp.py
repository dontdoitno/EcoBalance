"""Global Warming Potential (100-year) factors for converting CH4 and N2O
to CO2-equivalent.

Values are the commonly cited IPCC AR5/AR6 100-year GWPs (fossil CH4),
used here as illustrative constants — see docs/methodology/formulas.md
for the disclaimer that applies to every emission factor in this package.
The user selects AR5 or AR6 per calculation (`CalculationInput.gwp_set`).
"""

from decimal import Decimal
from typing import Literal

GWPSet = Literal["AR5", "AR6"]

GWP_CH4: dict[GWPSet, Decimal] = {
    "AR5": Decimal("28"),
    "AR6": Decimal("27"),
}

GWP_N2O: dict[GWPSet, Decimal] = {
    "AR5": Decimal("265"),
    "AR6": Decimal("273"),
}
