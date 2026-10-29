"""End-to-end API integration tests against a real (disposable) Postgres.

Covers the acceptance criteria from PROMPT_CLAUDE_CODE.md §11 Stage 2:
auth, draft/calculate/finalize, scenarios, reports, and company isolation.
"""

from __future__ import annotations

from httpx import AsyncClient


async def _register(client: AsyncClient, email: str, company_name: str) -> dict:
    response = await client.post(
        "/auth/register",
        json={"email": email, "password": "password123", "company_name": company_name},
    )
    assert response.status_code == 201
    return response.json()


async def test_register_login_me(client: AsyncClient) -> None:
    user = await _register(client, "alice@example.com", "Alice Co")
    assert user["email"] == "alice@example.com"

    me_response = await client.get("/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["id"] == user["id"]


async def test_duplicate_registration_rejected(client: AsyncClient) -> None:
    await _register(client, "bob@example.com", "Bob Co")
    response = await client.post(
        "/auth/register",
        json={"email": "bob@example.com", "password": "password123", "company_name": "Bob Co 2"},
    )
    assert response.status_code == 409


async def test_full_calculation_flow(client: AsyncClient) -> None:
    await _register(client, "flow@example.com", "Flow Co")

    create_response = await client.post("/calculations", json={"name": "Ammonia test"})
    assert create_response.status_code == 201
    calculation_id = create_response.json()["id"]

    patch_response = await client.patch(
        f"/calculations/{calculation_id}",
        json={
            "product_id": "ammonia",
            "route_id": "ammonia__smr",
            "raw_materials": [
                {"material_id": "natural_gas_feedstock", "quantity_t_per_unit": "0.6"}
            ],
            "electricity": {"consumption_mwh_per_unit": "0.2", "region_id": "oes_center"},
            "fuels": [{"fuel_id": "natural_gas", "quantity": "1", "use": "fuel"}],
            "transport": [
                {
                    "direction": "outbound_product",
                    "mode_id": "truck",
                    "distance_km": "500",
                    "mass_t_per_unit": "1",
                }
            ],
        },
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["is_valid"] is True

    calculate_response = await client.post(f"/calculations/{calculation_id}/calculate")
    assert calculate_response.status_code == 200
    result = calculate_response.json()
    assert result["pcf_full_kg_co2_per_unit"] == "3378.40"
    assert result["cbam_applicable"] is True

    scenario_response = await client.post(
        f"/calculations/{calculation_id}/scenarios",
        json={"name": "Optimize", "measure_ids": ["renewable_electricity"]},
    )
    assert scenario_response.status_code == 201
    scenario = scenario_response.json()
    assert float(scenario["scenario"]["pcf_full_kg_co2_per_unit"]) < float(
        scenario["baseline"]["pcf_full_kg_co2_per_unit"]
    )

    finalize_response = await client.post(f"/calculations/{calculation_id}/finalize")
    assert finalize_response.status_code == 200
    assert finalize_response.json()["status"] == "final"

    second_finalize = await client.post(f"/calculations/{calculation_id}/finalize")
    assert second_finalize.status_code == 409

    pdf_response = await client.get(
        f"/reports/{calculation_id}", params={"report_type": "pcf", "report_format": "pdf"}
    )
    assert pdf_response.status_code == 200
    assert pdf_response.content[:4] == b"%PDF"

    cbam_response = await client.get(
        f"/reports/{calculation_id}", params={"report_type": "cbam", "report_format": "json"}
    )
    assert cbam_response.status_code == 200


async def test_cbam_report_rejected_for_non_applicable_product(client: AsyncClient) -> None:
    await _register(client, "pvc@example.com", "PVC Co")
    calculation_id = (await client.post("/calculations", json={"name": "PVC"})).json()["id"]
    await client.patch(
        f"/calculations/{calculation_id}",
        json={
            "product_id": "pvc",
            "raw_materials": [{"material_id": "ethylene_feedstock", "quantity_t_per_unit": "0.45"}],
            "electricity": {"consumption_mwh_per_unit": "0.35", "region_id": "oes_ural"},
        },
    )
    await client.post(f"/calculations/{calculation_id}/calculate")

    response = await client.get(
        f"/reports/{calculation_id}", params={"report_type": "cbam", "report_format": "pdf"}
    )
    assert response.status_code == 409
    assert "CBAM" in response.json()["detail"]


async def test_company_isolation(client: AsyncClient) -> None:
    await _register(client, "owner@example.com", "Owner Co")
    calculation_id = (await client.post("/calculations", json={"name": "Private"})).json()["id"]
    await client.post("/auth/logout")

    await _register(client, "intruder@example.com", "Intruder Co")
    response = await client.get(f"/calculations/{calculation_id}")
    assert response.status_code == 404

    list_response = await client.get("/calculations")
    assert list_response.status_code == 200
    assert all(calc["id"] != calculation_id for calc in list_response.json())


async def test_reference_endpoints_public(client: AsyncClient) -> None:
    response = await client.get("/reference/products")
    assert response.status_code == 200
    assert any(product["id"] == "ammonia" for product in response.json())


async def test_unauthenticated_requests_rejected(client: AsyncClient) -> None:
    response = await client.get("/calculations")
    assert response.status_code == 401
