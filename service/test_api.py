import unittest
import requests
from config import *
from helpers import url

AUTH_COOKIES = {"sid": SID}

class TestHealth(unittest.TestCase):

    def test_auth_health(self):
        r = requests.get(url("/api/auth/health"), timeout=5)
        self.assertEqual(r.status_code, 200)

    def test_user_health(self):
        r = requests.get(url("/api/user/health"), timeout=5)
        self.assertEqual(r.status_code, 200)

    def test_cases_health(self):
        r = requests.get(url("/api/cases/health"), timeout=5)
        self.assertEqual(r.status_code, 200)

    def test_payment_health(self):
        r = requests.get(url("/api/payment/health"), timeout=5)
        self.assertEqual(r.status_code, 200)

class TestUser(unittest.TestCase):

    def test_me_authenticated(self):
        r = requests.get(url("/api/user/v1/users/me"), cookies=AUTH_COOKIES, timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("id", data)
        self.assertIn("email", data)
        self.assertIn("nickname", data)
        self.assertIn("role", data)
        self.assertIn("status", data)

    def test_me_unauthenticated(self):
        r = requests.get(url("/api/user/v1/users/me"), timeout=5)
        self.assertIn(r.status_code, [401, 403])

    def test_public_profile_existing(self):
        r = requests.get(url(f"/api/user/v1/users/public/{TEST_NICKNAME}"), timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["id"], TEST_USER_ID)
        self.assertEqual(data["nickname"], TEST_NICKNAME)
        # публичный профиль не должен содержать email
        self.assertNotIn("email", data)

    def test_public_profile_nonexistent(self):
        r = requests.get(url("/api/user/v1/users/public/this_user_definitely_does_not_exist_xyz"), timeout=5)
        self.assertEqual(r.status_code, 404)

    def test_update_me_invalid_body(self):
        r = requests.patch(url("/api/user/v1/users/me"), json={}, cookies=AUTH_COOKIES, timeout=5)
        self.assertEqual(r.status_code, 422)

class TestCasesPublic(unittest.TestCase):

    def test_list_cases_returns_list(self):
        r = requests.get(url("/api/cases/cases/"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_list_items_returns_list(self):
        r = requests.get(url("/api/cases/items/"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_list_rarities_returns_list(self):
        r = requests.get(url("/api/cases/rarities/"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_list_tags_returns_list(self):
        r = requests.get(url("/api/cases/tags/"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_list_weapon_types_returns_list(self):
        r = requests.get(url("/api/cases/weapon-types/"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_list_weapons_returns_list(self):
        r = requests.get(url("/api/cases/weapons/"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_recent_wins_returns_list(self):
        r = requests.get(url("/api/cases/recent_wins"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_recent_wins_limit_respected(self):
        r = requests.get(url("/api/cases/recent_wins?limit=3"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertLessEqual(len(r.json()), 3)

    def test_case_by_nonexistent_name_404(self):
        r = requests.get(url("/api/cases/cases/by-name/nonexistent_case_xyz"), timeout=5)
        self.assertEqual(r.status_code, 404)

    def test_case_by_nonexistent_system_name_404(self):
        r = requests.get(url("/api/cases/cases/by-system-name/nonexistent_xyz"), timeout=5)
        self.assertEqual(r.status_code, 404)

    def test_item_nonexistent_uuid_404(self):
        r = requests.get(url("/api/cases/items/00000000-0000-0000-0000-000000000000"), timeout=5)
        self.assertEqual(r.status_code, 404)

    def test_list_cases_accessible_without_auth(self):
        """Публичные данные не требуют авторизации"""
        r = requests.get(url("/api/cases/cases/"), timeout=5)
        self.assertNotIn(r.status_code, [401, 403])

class TestCasesAuth(unittest.TestCase):

    def test_my_inventory_authenticated(self):
        r = requests.get(url("/api/cases/inventory/"), cookies=AUTH_COOKIES, timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("items", data)
        self.assertIsInstance(data["items"], list)

    def test_my_inventory_unauthenticated(self):
        r = requests.get(url("/api/cases/inventory/"), timeout=5)
        self.assertIn(r.status_code, [401, 403, 422])

    def test_my_wins_authenticated(self):
        r = requests.get(url("/api/cases/wins/my"), cookies=AUTH_COOKIES, timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_my_wins_unauthenticated(self):
        r = requests.get(url("/api/cases/wins/my"), timeout=5)
        self.assertIn(r.status_code, [401, 403])

    def test_my_wins_stats_authenticated(self):
        r = requests.get(url("/api/cases/wins/my/stats"), cookies=AUTH_COOKIES, timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("total_opened", data)
        self.assertIn("recent_wins", data)

    def test_open_case_unauthenticated(self):
        cases = requests.get(url("/api/cases/cases/"), timeout=5).json()
        if not cases:
            self.skipTest("Нет доступных кейсов")
        case_id = cases[0]["id"]
        r = requests.post(url(f"/api/cases/cases/open/{case_id}"), timeout=5)
        self.assertIn(r.status_code, [401, 403])

class TestCasesUserHistory(unittest.TestCase):

    def test_user_wins_by_id(self):
        r = requests.get(url(f"/api/cases/wins/user/{TEST_USER_ID}"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_user_wins_stats_by_id(self):
        r = requests.get(url(f"/api/cases/wins/user/{TEST_USER_ID}/stats"), timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("total_opened", data)

    def test_user_inventory_by_id(self):
        r = requests.get(url(f"/api/cases/inventory/user/{TEST_USER_ID}"), timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("items", data)

class TestPayment(unittest.TestCase):

    def test_get_balance_by_user_id(self):
        r = requests.get(url(f"/api/payment/balance/{TEST_USER_ID}"), timeout=5)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("wallet", data)

    def test_get_balance_invalid_user(self):
        r = requests.get(url("/api/payment/balance/not-a-valid-uuid"), timeout=5)
        self.assertIn(r.status_code, [400, 404, 422])

    def test_get_transactions_by_user_id(self):
        r = requests.get(url(f"/api/payment/transaction/{TEST_USER_ID}"), timeout=5)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

if __name__ == "__main__":
    import sys

    verbosity = 2 if "-v" in sys.argv else 1
    args = [a for a in sys.argv[1:] if not a.startswith("-")]

    loader = unittest.TestLoader()
    if args:
        suite = unittest.TestSuite()
        for name in args:
            try:
                suite.addTests(loader.loadTestsFromName(name, module=__import__("__main__")))
            except AttributeError:
                print(f"Не найден тест-класс: {name}")
                sys.exit(1)
    else:
        suite = loader.loadTestsFromModule(__import__("__main__"))

    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
