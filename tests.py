import unittest
import json
import requests
from main import app
client = TestClient(app)

url = "http://127.0.0.1:8000"

class AppTests(unittest.TestCase):

	def test_get_hello_endpoint(self):
		response = client.get("/hello")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {"message": "Hello world!"})
	
	def test_get__users_endpoint(self):
		response = client.get("/users?name=Bob&age=30")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {"user_name": "Bob", "user_age": "30"})

if __name__ == '__main__':
    unittest.main()