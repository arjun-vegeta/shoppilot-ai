from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_search_products_mocked():
    mock_results = [
        {"id": "1", "title": "Test Product", "price": 100, "similarity": 0.9}
    ]

    with patch("app.api.v1.search.retrieval_service.search_products") as mock_search:
        mock_search.return_value = mock_results

        response = client.get("/api/v1/products?q=keyboard")

        assert response.status_code == 200
        assert response.json() == {"results": mock_results}
        mock_search.assert_called_once_with("keyboard", limit=5)
