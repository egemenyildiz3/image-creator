# 📸 Image Creator

A full-stack web app for managing and processing photo requests.  
Users can submit images with details, and admins can review, approve, and email processed results.

---

## 🚀 Features

- **Public submission form**  
  Users submit name, email, and photo.

- **Admin dashboard**  
  - Secure login with JWT  
  - View, search, and filter submissions  
  - Preview submitted photos  
  - Send email responses with attachments  
  - Track status (`new`, `emailed`)  

- **Email system**  
  Configured via SMTP (MailKit), supports Gmail app passwords.  

- **Database**  
  SQLite + EF Core with migrations.

- **Environment variables**  
  Critical configs (DB, SMTP, JWT) in `.env` files, not in source.

---

## 🛠 Tech

**Frontend**  
React + Vite, plain CSS

**Backend**  
.NET 9 Minimal API, EF Core, MailKit SMTP, JWT

**Database**  
SQLite (`app.db`)

---

## ⚙️ Setup

### 1) Backend (API)
```sh
cd Api

# Install dependencies
dotnet restore

# Run migrations
dotnet ef database update

# Start API
dotnet run --no-launch-profile --urls http://127.0.0.1:5005
```

### 2) Frontend
```sh
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at:  
Frontend → http://localhost:5173  
Backend → http://127.0.0.1:5005
