#!/bin/bash
# ─────────────────────────────────────────────
#  MediShop — One-command Setup Script
# ─────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   MediShop Setup  •  Django + React  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Backend ──────────────────────────────────
echo "▶ Setting up Django backend..."
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt --quiet

# Update settings to use custom user model
echo "" >> medishop/settings.py
echo "AUTH_USER_MODEL = 'accounts.User'" >> medishop/settings.py

python manage.py makemigrations accounts
python manage.py migrate

# Create superuser (admin)
echo "▶ Creating demo admin user..."
python manage.py shell -c "
from accounts.models import User
if not User.objects.filter(email='admin@medishop.com').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@medishop.com',
        password='Admin@1234',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    print('  ✓ Admin created: admin@medishop.com / Admin@1234')
else:
    print('  ✓ Admin already exists')
"

echo ""
echo "✅ Backend ready!"
echo "   Run: cd backend && source venv/bin/activate && python manage.py runserver"
echo ""

# ── Frontend ─────────────────────────────────
cd ../frontend
echo "▶ Installing React dependencies..."
npm install --silent

echo ""
echo "✅ Frontend ready!"
echo "   Run: cd frontend && npm start"
echo ""

echo "══════════════════════════════════════════"
echo "  URLs:"
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:3000"
echo "  Admin    → http://localhost:8000/admin"
echo "  Login    → admin@medishop.com / Admin@1234"
echo "══════════════════════════════════════════"
