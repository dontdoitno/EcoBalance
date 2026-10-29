from decimal import Decimal

import pytest

from ecobalance_core import units


def test_tonnes_kg_roundtrip() -> None:
    assert units.tonnes_to_kg(Decimal("1.5")) == Decimal("1500")
    assert units.kg_to_tonnes(Decimal("1500")) == Decimal("1.5")


def test_mwh_kwh_roundtrip() -> None:
    assert units.mwh_to_kwh(Decimal("2")) == Decimal("2000")
    assert units.kwh_to_mwh(Decimal("2000")) == Decimal("2")


def test_thousand_m3_to_gj() -> None:
    # 1 thousand m3 at NCV 34000 MJ/thousand m3 -> 34 GJ
    assert units.thousand_m3_to_gj(Decimal("1"), Decimal("34000")) == Decimal("34")


def test_mass_to_gj() -> None:
    # 1 t at NCV 44 MJ/kg -> 44000 MJ -> 44 GJ
    assert units.mass_to_gj(Decimal("1"), Decimal("44")) == Decimal("44")


def test_thousand_m3_to_gj_rejects_nonpositive_ncv() -> None:
    with pytest.raises(units.UnitError):
        units.thousand_m3_to_gj(Decimal("1"), Decimal("0"))


def test_mass_to_gj_rejects_nonpositive_ncv() -> None:
    with pytest.raises(units.UnitError):
        units.mass_to_gj(Decimal("1"), Decimal("-5"))
