"""Explicit unit conversions for the calculation engine.

Every conversion is a named function, not a generic "convert(x, from, to)"
dispatcher — this makes the few conversions the methodology actually needs
(see docs/methodology/formulas.md) easy to audit, and makes a caller that
tries to convert between incompatible quantities (mass vs. energy without a
net calorific value) fail loudly instead of silently producing a wrong
number.
"""

from decimal import Decimal


class UnitError(ValueError):
    """Raised when a conversion is requested with missing or invalid inputs."""


def tonnes_to_kg(value: Decimal) -> Decimal:
    return value * Decimal(1000)


def kg_to_tonnes(value: Decimal) -> Decimal:
    return value / Decimal(1000)


def mwh_to_kwh(value: Decimal) -> Decimal:
    return value * Decimal(1000)


def kwh_to_mwh(value: Decimal) -> Decimal:
    return value / Decimal(1000)


def mj_to_gj(value: Decimal) -> Decimal:
    return value / Decimal(1000)


def gj_to_mj(value: Decimal) -> Decimal:
    return value * Decimal(1000)


def thousand_m3_to_gj(volume_thousand_m3: Decimal, ncv_mj_per_thousand_m3: Decimal) -> Decimal:
    """Convert a gas volume to energy using its net calorific value.

    `ncv_mj_per_thousand_m3` must be supplied explicitly (from the fuel
    reference entry or a user override) — there is no implicit default
    NCV, because silently guessing one is exactly the kind of "quiet unit
    coercion" the methodology forbids.
    """
    if ncv_mj_per_thousand_m3 <= 0:
        raise UnitError(
            "NCV must be a positive number of MJ per thousand m3 to convert volume to energy"
        )
    energy_mj = volume_thousand_m3 * ncv_mj_per_thousand_m3
    return mj_to_gj(energy_mj)


def mass_to_gj(mass_t: Decimal, ncv_mj_per_kg: Decimal) -> Decimal:
    """Convert a fuel mass (tonnes) to energy using its net calorific value."""
    if ncv_mj_per_kg <= 0:
        raise UnitError("NCV must be a positive number of MJ per kg to convert mass to energy")
    mass_kg = tonnes_to_kg(mass_t)
    energy_mj = mass_kg * ncv_mj_per_kg
    return mj_to_gj(energy_mj)
