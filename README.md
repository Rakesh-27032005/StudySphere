# StudySphere – Stage 1

A starter full-stack StudySphere application:
- Django + Django REST Framework backend
- React + TypeScript + Vite frontend
- JWT authentication with student/admin roles
- SQLite for local development
- PWA manifest and installable Android browser experience

## Requirements
- Python 3.11 or newer
- Node.js 20 or newer
- Visual Studio Code

## 1. Start the Python backend (Windows PowerShell)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py makemigrations accounts
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: http://127.0.0.1:8000  
Django admin: http://127.0.0.1:8000/admin/

The superuser can access Django's admin site. For the StudySphere app administrator role, set `role` to `admin` for the account in Django admin. Do not expose the Django admin site publicly without additional hardening.

## 2. Start the website (new terminal)

```powershell
cd website
npm install
npm run dev
```

Website: http://localhost:5173

Register a student account from the website. Then sign in. JWT tokens are stored in browser localStorage in this development starter; for production, move to secure HttpOnly cookies and add CSRF protections.

## 3. Install on Android

For local testing, connect your Android phone and computer to the same Wi-Fi. Find your computer's local IPv4 address using `ipconfig`. Change the frontend API URL in `website/src/App.tsx` from `http://127.0.0.1:8000/api` to `http://YOUR-PC-IP:8000/api`. Add your PC IP to `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py`. Run Vite with its network host enabled (already configured). Open `http://YOUR-PC-IP:5173` on Android.

For real PWA installation, production must be served over HTTPS. Open the deployed site in Chrome on Android, use the browser menu, and choose **Install app** or **Add to Home screen**.

## 4. Create an app administrator

1. Sign in to Django admin at `/admin/`.
2. Open Users and select the intended account.
3. Change Role to `admin` and save.
4. Sign out and sign back into the frontend.

## Stage 1 scope
Implemented: registration, login, JWT authentication, current-user endpoint, student dashboard shell, admin role detection, responsive UI, theme toggle, PWA manifest.

Not yet implemented: friends, rooms, PDFs, chat, calls, offline document sync, full admin analytics. These are subsequent stages.

## Security before production
Set a strong `DJANGO_SECRET_KEY`, set `DJANGO_DEBUG=0`, configure HTTPS, allowed hosts, secure cookie settings, rate limits, email verification, password reset, refresh-token rotation, secure file validation/storage, backups, and automated tests. Use PostgreSQL for production. Never grant admin role from public registration.
