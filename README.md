# 📸 Image Creator

A full-stack web app where users can submit a **name, email, and a photo**, and admins can review submissions, send back processed images, and manage requests via an admin dashboard.

## ✨ Features
- User form with name, email, and file upload
- Prevents duplicate submissions by email
- Admin dashboard with authentication
- View submissions with thumbnails
- Compose and send email replies (with attachments) directly from the dashboard
- Status tracking (new, emailed, etc.)
- Clean dark-mode UI built with React + Tailwind

---

## 🛠️ Tech Stack
**Frontend**
- React (Vite)
- TailwindCSS

**Backend**
- .NET 9 Web API
- Entity Framework Core (SQLite database)
- MailKit (SMTP email sending)
- JWT authentication

**Database**
- SQLite (`app.db` by default)

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/image-creator.git
cd image-creator
