#!/usr/bin/env python3
"""
Backend API Test Suite for Jigyasa Fabrics
Tests Razorpay integration + Emergent Google auth + regression tests
"""
import requests
import json
import sys
import hmac
import hashlib

BASE_URL = "https://fabric-checkout-7.preview.emergentagent.com/api"
ADMIN_TOKEN = "jigyasa_admin_secret_2025"
ADMIN_PASSWORD = "admin123"
RAZORPAY_KEY_SECRET = "3oXg22y0lEodFhB7kn1DO9lT"
RAZORPAY_WEBHOOK_SECRET = "jigyasa_wh_secret_change_me_2025"

# Global variable to store a real product ID
REAL_PRODUCT_ID = None

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def get_real_product_id():
    """Fetch a real product ID from the API"""
    global REAL_PRODUCT_ID
    if REAL_PRODUCT_ID:
        return REAL_PRODUCT_ID
    
    try:
        r = requests.get(f"{BASE_URL}/products", timeout=10)
        if r.status_code == 200:
            products = r.json().get("products", [])
            if products:
                REAL_PRODUCT_ID = products[0]["id"]
                return REAL_PRODUCT_ID
    except Exception as e:
        print(f"Failed to fetch product ID: {e}")
    return None

# ============ RAZORPAY TESTS ============

def test_razorpay_create_order_valid():
    """Test 1: POST /api/razorpay/create-order with valid product -> 200 with real orderId"""
    print("=" * 80)
    print("TEST 1: POST /api/razorpay/create-order with valid product")
    print("=" * 80)
    try:
        product_id = get_real_product_id()
        if not product_id:
            print_test("POST /api/razorpay/create-order (valid)", False, "Could not fetch product ID")
            return False
        
        r = requests.post(f"{BASE_URL}/razorpay/create-order",
                         json={"items": [{"id": product_id, "qty": 2}]},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text[:500]}")
        
        data = r.json()
        order_id = data.get("orderId", "")
        
        passed = (r.status_code == 200 and 
                 data.get("ok") is True and
                 order_id.startswith("order_") and
                 "amount" in data and
                 data.get("currency") == "INR" and
                 data.get("keyId") == "rzp_test_TYHBwzuxlKP4Bz" and
                 "breakdown" in data)
        
        print_test("POST /api/razorpay/create-order (valid)", passed,
                   f"Expected 200 with real orderId starting with 'order_', got {r.status_code}, orderId={order_id}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/create-order (valid)", False, f"Exception: {e}")
        return False

def test_razorpay_create_order_empty_items():
    """Test 2: POST /api/razorpay/create-order with empty items -> 400"""
    print("=" * 80)
    print("TEST 2: POST /api/razorpay/create-order with empty items")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/razorpay/create-order",
                         json={"items": []},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "no items" in r.text.lower()
        print_test("POST /api/razorpay/create-order (empty items)", passed,
                   f"Expected 400 with 'No items', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/create-order (empty items)", False, f"Exception: {e}")
        return False

def test_razorpay_create_order_unknown_product():
    """Test 3: POST /api/razorpay/create-order with unknown product ID -> 400"""
    print("=" * 80)
    print("TEST 3: POST /api/razorpay/create-order with unknown product ID")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/razorpay/create-order",
                         json={"items": [{"id": "non-existent-product-id-12345", "qty": 1}]},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "not found" in r.text.lower()
        print_test("POST /api/razorpay/create-order (unknown product)", passed,
                   f"Expected 400 with 'not found', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/create-order (unknown product)", False, f"Exception: {e}")
        return False

def test_razorpay_create_order_tamper_proof():
    """Test 4: POST /api/razorpay/create-order with tampered price -> server uses DB price"""
    print("=" * 80)
    print("TEST 4: POST /api/razorpay/create-order tamper-proof check")
    print("=" * 80)
    try:
        product_id = get_real_product_id()
        if not product_id:
            print_test("POST /api/razorpay/create-order (tamper-proof)", False, "Could not fetch product ID")
            return False
        
        # First get the real product price
        r_product = requests.get(f"{BASE_URL}/products/{product_id}", timeout=10)
        if r_product.status_code != 200:
            print_test("POST /api/razorpay/create-order (tamper-proof)", False, "Could not fetch product details")
            return False
        
        real_price = r_product.json().get("product", {}).get("price", 0)
        print(f"Real DB price: {real_price}")
        
        # Send request with tampered price (1 rupee)
        r = requests.post(f"{BASE_URL}/razorpay/create-order",
                         json={"items": [{"id": product_id, "qty": 1, "price": 1}]},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text[:500]}")
        
        data = r.json()
        breakdown = data.get("breakdown", {})
        returned_subtotal = breakdown.get("subtotal", 0)
        
        # The server should use DB price (real_price), not the tampered price (1)
        passed = (r.status_code == 200 and 
                 returned_subtotal == real_price)
        
        print_test("POST /api/razorpay/create-order (tamper-proof)", passed,
                   f"Expected subtotal={real_price} (DB price), got {returned_subtotal}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/create-order (tamper-proof)", False, f"Exception: {e}")
        return False

def test_razorpay_verify_missing_fields():
    """Test 5: POST /api/razorpay/verify with missing fields -> 400"""
    print("=" * 80)
    print("TEST 5: POST /api/razorpay/verify with missing fields")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/razorpay/verify",
                         json={},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "incomplete" in r.text.lower()
        print_test("POST /api/razorpay/verify (missing fields)", passed,
                   f"Expected 400 with 'Incomplete payment response', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (missing fields)", False, f"Exception: {e}")
        return False

def test_razorpay_verify_fake_signature():
    """Test 6: POST /api/razorpay/verify with fake signature -> 400"""
    print("=" * 80)
    print("TEST 6: POST /api/razorpay/verify with fake signature")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/razorpay/verify",
                         json={
                             "razorpay_order_id": "order_test",
                             "razorpay_payment_id": "pay_test",
                             "razorpay_signature": "badsignature12345",
                             "address": {},
                             "breakdown": {"items": []}
                         },
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "invalid signature" in r.text.lower()
        print_test("POST /api/razorpay/verify (fake signature)", passed,
                   f"Expected 400 with 'Invalid signature', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (fake signature)", False, f"Exception: {e}")
        return False

def test_razorpay_verify_valid_hmac():
    """Test 7: POST /api/razorpay/verify with valid HMAC -> 200 with order created"""
    print("=" * 80)
    print("TEST 7: POST /api/razorpay/verify with valid HMAC")
    print("=" * 80)
    try:
        product_id = get_real_product_id()
        if not product_id:
            print_test("POST /api/razorpay/verify (valid HMAC)", False, "Could not fetch product ID")
            return False
        
        # Get product details for breakdown
        r_product = requests.get(f"{BASE_URL}/products/{product_id}", timeout=10)
        product = r_product.json().get("product", {})
        
        # Compute valid HMAC
        order_id = "order_test123"
        payment_id = "pay_test456"
        message = f"{order_id}|{payment_id}"
        signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        print(f"Computed signature: {signature}")
        
        r = requests.post(f"{BASE_URL}/razorpay/verify",
                         json={
                             "razorpay_order_id": order_id,
                             "razorpay_payment_id": payment_id,
                             "razorpay_signature": signature,
                             "address": {
                                 "name": "Ananya Verma",
                                 "phone": "9999999999",
                                 "pincode": "110001",
                                 "line1": "456 Connaught Place",
                                 "city": "Delhi",
                                 "state": "Delhi"
                             },
                             "breakdown": {
                                 "items": [{
                                     "id": product_id,
                                     "name": product.get("name"),
                                     "price": product.get("price"),
                                     "qty": 1
                                 }]
                             }
                         },
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text[:500]}")
        
        data = r.json()
        order = data.get("order", {})
        
        passed = (r.status_code == 200 and 
                 data.get("ok") is True and
                 "orderNumber" in order and
                 "awb" in order and
                 order.get("status") == "confirmed" and
                 order.get("payment", {}).get("method") == "RAZORPAY" and
                 order.get("payment", {}).get("status") == "paid")
        
        print_test("POST /api/razorpay/verify (valid HMAC)", passed,
                   f"Expected 200 with order created, got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (valid HMAC)", False, f"Exception: {e}")
        return False

def test_razorpay_verify_unknown_product():
    """Test 8: POST /api/razorpay/verify with valid HMAC but unknown product -> 400"""
    print("=" * 80)
    print("TEST 8: POST /api/razorpay/verify with unknown product in breakdown")
    print("=" * 80)
    try:
        # Compute valid HMAC
        order_id = "order_test_unknown"
        payment_id = "pay_test_unknown"
        message = f"{order_id}|{payment_id}"
        signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        r = requests.post(f"{BASE_URL}/razorpay/verify",
                         json={
                             "razorpay_order_id": order_id,
                             "razorpay_payment_id": payment_id,
                             "razorpay_signature": signature,
                             "address": {
                                 "name": "Test User",
                                 "phone": "9999999999",
                                 "pincode": "110001",
                                 "line1": "Test Address",
                                 "city": "Delhi",
                                 "state": "Delhi"
                             },
                             "breakdown": {
                                 "items": [{
                                     "id": "unknown-product-id-xyz",
                                     "name": "Unknown Product",
                                     "price": 1000,
                                     "qty": 1
                                 }]
                             }
                         },
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "product changed" in r.text.lower()
        print_test("POST /api/razorpay/verify (unknown product)", passed,
                   f"Expected 400 with 'Product changed', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (unknown product)", False, f"Exception: {e}")
        return False

def test_razorpay_webhook_no_signature():
    """Test 9: POST /api/razorpay/webhook with no signature header -> 400"""
    print("=" * 80)
    print("TEST 9: POST /api/razorpay/webhook with no signature header")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/razorpay/webhook",
                         json={"event": "payment.captured"},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "invalid signature" in r.text.lower()
        print_test("POST /api/razorpay/webhook (no signature)", passed,
                   f"Expected 400 with 'Invalid signature', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/webhook (no signature)", False, f"Exception: {e}")
        return False

def test_razorpay_webhook_wrong_signature():
    """Test 10: POST /api/razorpay/webhook with wrong signature -> 400"""
    print("=" * 80)
    print("TEST 10: POST /api/razorpay/webhook with wrong signature")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/razorpay/webhook",
                         json={"event": "payment.captured"},
                         headers={"x-razorpay-signature": "wrongsignature123"},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "invalid signature" in r.text.lower()
        print_test("POST /api/razorpay/webhook (wrong signature)", passed,
                   f"Expected 400 with 'Invalid signature', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/webhook (wrong signature)", False, f"Exception: {e}")
        return False

def test_razorpay_webhook_valid_signature():
    """Test 11: POST /api/razorpay/webhook with valid signature -> 200 and order updated"""
    print("=" * 80)
    print("TEST 11: POST /api/razorpay/webhook with valid signature")
    print("=" * 80)
    try:
        # Construct webhook payload
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test456",
                        "order_id": "order_test123"
                    }
                }
            }
        }
        
        # Convert to JSON bytes (exact bytes that will be signed)
        raw_body = json.dumps(webhook_payload).encode('utf-8')
        
        # Compute HMAC signature
        signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        
        print(f"Computed webhook signature: {signature}")
        print(f"Raw body length: {len(raw_body)} bytes")
        
        # Send request with raw body (not json=)
        r = requests.post(f"{BASE_URL}/razorpay/webhook",
                         data=raw_body,
                         headers={
                             "x-razorpay-signature": signature,
                             "x-razorpay-event-id": "evt_test_1",
                             "Content-Type": "application/json"
                         },
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        passed = r.status_code == 200 and data.get("received") is True
        
        if passed:
            # Verify order was updated in DB
            r_orders = requests.get(f"{BASE_URL}/admin/orders",
                                   headers={"x-admin-token": ADMIN_TOKEN},
                                   timeout=10)
            if r_orders.status_code == 200:
                orders = r_orders.json().get("orders", [])
                order = next((o for o in orders if o.get("razorpayOrderId") == "order_test123"), None)
                if order:
                    print(f"Found order: status={order.get('status')}, payment.status={order.get('payment', {}).get('status')}")
                    print(f"webhookEvents: {order.get('webhookEvents', [])}")
                    
                    passed = (order.get("status") == "confirmed" and
                             order.get("payment", {}).get("status") == "captured" and
                             "evt_test_1" in order.get("webhookEvents", []))
                else:
                    print("Order with razorpayOrderId=order_test123 not found in DB")
                    passed = False
        
        print_test("POST /api/razorpay/webhook (valid signature)", passed,
                   f"Expected 200 with order updated in DB")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/webhook (valid signature)", False, f"Exception: {e}")
        return False

def test_razorpay_webhook_idempotency():
    """Test 12: POST /api/razorpay/webhook replay same event -> idempotent"""
    print("=" * 80)
    print("TEST 12: POST /api/razorpay/webhook idempotency check")
    print("=" * 80)
    try:
        # Construct webhook payload (same as previous test)
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test456",
                        "order_id": "order_test123"
                    }
                }
            }
        }
        
        raw_body = json.dumps(webhook_payload).encode('utf-8')
        signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        
        # Send the same request again
        r = requests.post(f"{BASE_URL}/razorpay/webhook",
                         data=raw_body,
                         headers={
                             "x-razorpay-signature": signature,
                             "x-razorpay-event-id": "evt_test_1",
                             "Content-Type": "application/json"
                         },
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        passed = r.status_code == 200 and data.get("received") is True
        
        if passed:
            # Verify event ID appears only once in webhookEvents
            r_orders = requests.get(f"{BASE_URL}/admin/orders",
                                   headers={"x-admin-token": ADMIN_TOKEN},
                                   timeout=10)
            if r_orders.status_code == 200:
                orders = r_orders.json().get("orders", [])
                order = next((o for o in orders if o.get("razorpayOrderId") == "order_test123"), None)
                if order:
                    webhook_events = order.get("webhookEvents", [])
                    evt_count = webhook_events.count("evt_test_1")
                    print(f"webhookEvents: {webhook_events}")
                    print(f"evt_test_1 appears {evt_count} time(s)")
                    
                    passed = evt_count == 1
                else:
                    print("Order not found")
                    passed = False
        
        print_test("POST /api/razorpay/webhook (idempotency)", passed,
                   f"Expected evt_test_1 to appear exactly once in webhookEvents")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/webhook (idempotency)", False, f"Exception: {e}")
        return False

# ============ REGRESSION TESTS ============

def test_get_products():
    """Test 13: GET /api/products -> 200 with products array"""
    print("=" * 80)
    print("TEST 13: GET /api/products (regression)")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/products", timeout=10)
        print(f"Status: {r.status_code}")
        
        data = r.json()
        products = data.get("products", [])
        print(f"Products count: {len(products)}")
        
        passed = r.status_code == 200 and len(products) >= 10
        print_test("GET /api/products", passed,
                   f"Expected 200 with 10+ products, got {r.status_code} with {len(products)} products")
        return passed
    except Exception as e:
        print_test("GET /api/products", False, f"Exception: {e}")
        return False

def test_get_product_by_id():
    """Test 14: GET /api/products/:id -> 200 with product"""
    print("=" * 80)
    print("TEST 14: GET /api/products/:id (regression)")
    print("=" * 80)
    try:
        product_id = get_real_product_id()
        if not product_id:
            print_test("GET /api/products/:id", False, "Could not fetch product ID")
            return False
        
        r = requests.get(f"{BASE_URL}/products/{product_id}", timeout=10)
        print(f"Status: {r.status_code}")
        
        data = r.json()
        product = data.get("product", {})
        
        passed = r.status_code == 200 and product.get("id") == product_id
        print_test("GET /api/products/:id", passed,
                   f"Expected 200 with product, got {r.status_code}")
        return passed
    except Exception as e:
        print_test("GET /api/products/:id", False, f"Exception: {e}")
        return False

def test_pincode_check():
    """Test 15: POST /api/pincode-check with valid pincode -> 200"""
    print("=" * 80)
    print("TEST 15: POST /api/pincode-check (regression)")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/pincode-check",
                         json={"pincode": "110001"},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        passed = r.status_code == 200 and data.get("ok") is True
        print_test("POST /api/pincode-check", passed,
                   f"Expected 200 with {{ok: true}}, got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/pincode-check", False, f"Exception: {e}")
        return False

def test_create_order_cod():
    """Test 16: POST /api/orders (COD legacy) with valid body -> 200 with order"""
    print("=" * 80)
    print("TEST 16: POST /api/orders COD legacy (regression)")
    print("=" * 80)
    try:
        order_data = {
            "items": [
                {
                    "id": "test-product-1",
                    "name": "Test Saree",
                    "price": 1999,
                    "quantity": 1
                }
            ],
            "address": {
                "name": "Kavya Reddy",
                "phone": "9876543210",
                "pincode": "560001",
                "line1": "789 Brigade Road",
                "line2": "Near MG Road Metro",
                "city": "Bangalore",
                "state": "Karnataka",
                "userEmail": "kavya.reddy@example.com"
            },
            "payment": {
                "method": "COD"
            },
            "subtotal": 1999,
            "shipping": 50,
            "tax": 100,
            "total": 2149
        }
        
        r = requests.post(f"{BASE_URL}/orders", json=order_data, timeout=10)
        print(f"Status: {r.status_code}")
        
        data = r.json()
        order = data.get("order", {})
        print(f"Order Number: {order.get('orderNumber', 'N/A')}")
        print(f"AWB: {order.get('awb', 'N/A')}")
        
        passed = (r.status_code == 200 and 
                 data.get("ok") is True and
                 "orderNumber" in order and
                 "awb" in order)
        print_test("POST /api/orders (COD)", passed,
                   f"Expected 200 with order including orderNumber & AWB")
        return passed
    except Exception as e:
        print_test("POST /api/orders (COD)", False, f"Exception: {e}")
        return False

def test_admin_login():
    """Test 17: POST /api/admin/login with correct password -> 200 with token"""
    print("=" * 80)
    print("TEST 17: POST /api/admin/login (regression)")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/admin/login",
                         json={"password": ADMIN_PASSWORD},
                         timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        passed = (r.status_code == 200 and 
                 data.get("ok") is True and
                 "token" in data)
        print_test("POST /api/admin/login", passed,
                   f"Expected 200 with token")
        return passed
    except Exception as e:
        print_test("POST /api/admin/login", False, f"Exception: {e}")
        return False

def test_admin_stats():
    """Test 18: GET /api/admin/stats with token -> 200 with stats"""
    print("=" * 80)
    print("TEST 18: GET /api/admin/stats (regression)")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/admin/stats",
                        headers={"x-admin-token": ADMIN_TOKEN},
                        timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        has_stats = all(k in data for k in ["productCount", "orderCount", "revenue"])
        passed = r.status_code == 200 and has_stats
        print_test("GET /api/admin/stats", passed,
                   f"Expected 200 with stats")
        return passed
    except Exception as e:
        print_test("GET /api/admin/stats", False, f"Exception: {e}")
        return False

def test_admin_products():
    """Test 19: GET /api/admin/products with token -> 200 with products"""
    print("=" * 80)
    print("TEST 19: GET /api/admin/products (regression)")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/admin/products",
                        headers={"x-admin-token": ADMIN_TOKEN},
                        timeout=10)
        print(f"Status: {r.status_code}")
        
        data = r.json()
        products = data.get("products", [])
        print(f"Products count: {len(products)}")
        
        passed = r.status_code == 200 and isinstance(products, list)
        print_test("GET /api/admin/products", passed,
                   f"Expected 200 with products array")
        return passed
    except Exception as e:
        print_test("GET /api/admin/products", False, f"Exception: {e}")
        return False

def test_admin_orders():
    """Test 20: GET /api/admin/orders with token -> 200 with orders"""
    print("=" * 80)
    print("TEST 20: GET /api/admin/orders (regression)")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/admin/orders",
                        headers={"x-admin-token": ADMIN_TOKEN},
                        timeout=10)
        print(f"Status: {r.status_code}")
        
        data = r.json()
        orders = data.get("orders", [])
        print(f"Orders count: {len(orders)}")
        
        passed = r.status_code == 200 and isinstance(orders, list)
        print_test("GET /api/admin/orders", passed,
                   f"Expected 200 with orders array")
        return passed
    except Exception as e:
        print_test("GET /api/admin/orders", False, f"Exception: {e}")
        return False

def test_auth_session_missing_body():
    """Test 21: POST /api/auth/session with empty body -> 400"""
    print("=" * 80)
    print("TEST 21: POST /api/auth/session with empty body (regression)")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/auth/session", json={}, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        passed = r.status_code == 400 and "session_id required" in r.text.lower()
        print_test("POST /api/auth/session (empty body)", passed, 
                   f"Expected 400 with 'session_id required', got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/auth/session (empty body)", False, f"Exception: {e}")
        return False

def test_auth_me_no_cookie():
    """Test 22: GET /api/auth/me with NO cookie -> 200 with {user: null}"""
    print("=" * 80)
    print("TEST 22: GET /api/auth/me with NO cookie (regression)")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        passed = r.status_code == 200 and data.get("user") is None
        print_test("GET /api/auth/me (no cookie)", passed,
                   f"Expected 200 with {{user: null}}, got {r.status_code}")
        return passed
    except Exception as e:
        print_test("GET /api/auth/me (no cookie)", False, f"Exception: {e}")
        return False

def test_auth_logout():
    """Test 23: POST /api/auth/logout -> 200 with {ok: true}"""
    print("=" * 80)
    print("TEST 23: POST /api/auth/logout (regression)")
    print("=" * 80)
    try:
        r = requests.post(f"{BASE_URL}/auth/logout", timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
        
        data = r.json()
        passed = r.status_code == 200 and data.get("ok") is True
        print_test("POST /api/auth/logout", passed,
                   f"Expected 200 with {{ok: true}}, got {r.status_code}")
        return passed
    except Exception as e:
        print_test("POST /api/auth/logout", False, f"Exception: {e}")
        return False

def main():
    print("\n" + "=" * 80)
    print("JIGYASA FABRICS BACKEND API TEST SUITE")
    print("Testing Razorpay Integration + Regression Tests")
    print("=" * 80 + "\n")
    
    results = []
    
    # Razorpay tests (new)
    print("\n" + "=" * 80)
    print("RAZORPAY INTEGRATION TESTS")
    print("=" * 80 + "\n")
    
    results.append(("POST /api/razorpay/create-order (valid)", test_razorpay_create_order_valid()))
    results.append(("POST /api/razorpay/create-order (empty items)", test_razorpay_create_order_empty_items()))
    results.append(("POST /api/razorpay/create-order (unknown product)", test_razorpay_create_order_unknown_product()))
    results.append(("POST /api/razorpay/create-order (tamper-proof)", test_razorpay_create_order_tamper_proof()))
    results.append(("POST /api/razorpay/verify (missing fields)", test_razorpay_verify_missing_fields()))
    results.append(("POST /api/razorpay/verify (fake signature)", test_razorpay_verify_fake_signature()))
    results.append(("POST /api/razorpay/verify (valid HMAC)", test_razorpay_verify_valid_hmac()))
    results.append(("POST /api/razorpay/verify (unknown product)", test_razorpay_verify_unknown_product()))
    results.append(("POST /api/razorpay/webhook (no signature)", test_razorpay_webhook_no_signature()))
    results.append(("POST /api/razorpay/webhook (wrong signature)", test_razorpay_webhook_wrong_signature()))
    results.append(("POST /api/razorpay/webhook (valid signature)", test_razorpay_webhook_valid_signature()))
    results.append(("POST /api/razorpay/webhook (idempotency)", test_razorpay_webhook_idempotency()))
    
    # Regression tests
    print("\n" + "=" * 80)
    print("REGRESSION TESTS")
    print("=" * 80 + "\n")
    
    results.append(("GET /api/products", test_get_products()))
    results.append(("GET /api/products/:id", test_get_product_by_id()))
    results.append(("POST /api/pincode-check", test_pincode_check()))
    results.append(("POST /api/orders (COD)", test_create_order_cod()))
    results.append(("POST /api/admin/login", test_admin_login()))
    results.append(("GET /api/admin/stats", test_admin_stats()))
    results.append(("GET /api/admin/products", test_admin_products()))
    results.append(("GET /api/admin/orders", test_admin_orders()))
    results.append(("POST /api/auth/session (empty)", test_auth_session_missing_body()))
    results.append(("GET /api/auth/me (no cookie)", test_auth_me_no_cookie()))
    results.append(("POST /api/auth/logout", test_auth_logout()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed ({int(passed/total*100)}% success rate)\n")
    
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    print("\n" + "=" * 80)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
