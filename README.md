# UniversityCourseRegistrationSystem

A modern web-based prototype for course registration, built with **Node.js**, **Express**, **MongoDB**, and **EJS**. This system addresses key problems such as scheduling conflicts, real-time seat availability, prerequisite tracking, and more.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [GitHub Repository](#github-repository)
8. [License](#license)

---

## Features

### 1. **Admin Features**
- **Login**: Admins authenticate with a username & password.
- **Course Management**: Add, update, or delete courses; set prerequisites; manage scheduling (days, times).
- **Student Management**: View & override student registrations; remove or mark courses as completed for any student.
- **Seat Management**: Adjust capacity for each course; see real-time seat availability.
- **Reports**: 
  - Students registered for a specific course
  - Courses with available seats
  - Students missing prerequisites

### 2. **Student Features**
- **Login**: Students log in with their roll number & password (no sign-up).
- **View & Register Courses**: Filter courses by department, level, or time of day; see real-time seat counts.
- **Weekly Schedule**: An interactive table that updates automatically when registering or dropping a course.
- **Prerequisite Checks**: Prevents registration if prerequisites aren’t completed (configurable logic).
- **Mark Course as Completed**: Admin or student can mark courses as completed, removing them from “in-progress” schedule.

### 3. **Real-Time Updates**
- **Seat Availability**: A polling mechanism updates seat counts every 10 seconds without refreshing the page.
- **Interactive Schedule**: Registering or dropping a course re-renders the weekly schedule on the fly.

---

## Tech Stack

- **Node.js** & **Express**: Backend server and routing.
- **MongoDB** & **Mongoose**: Database for courses, students, admin data.
- **EJS**: Templating engine for dynamic views.
- **HTML5**, **CSS3**, **JavaScript**: Front-end structure and styling.
- **Bootstrap / Tailwind** (optional or custom CSS) for styling & responsiveness.
- **Session / Cookie** (express-session) for login sessions (if using session-based auth).

---

## Project Structure

```
├── config
│   └── db.js                # MongoDB connection setup
├── middleware
│   └── login.js             # Login & access control middleware
├── models
│   ├── admin.js
│   ├── course.js
│   └── student.js
├── public
│   ├── css
│   │   └── studentDashboard.css  # Main stylesheet
│   └── js
│       └── script.js            # Main client-side JS
├── routes
│   ├── admin.js
│   └── student.js
├── views
│   ├── admin
│   │   └── admindashboard.ejs
│   ├── student
│   │   └── studentDashboard.ejs
│   └── partials (optional)
├── .env                # Environment variables
├── server.js           # Entry point for Express
├── package.json
└── README.md           # Project documentation
```

---

## Installation & Setup

1. **Clone** the repository:
   ```bash
   git clone https://github.com/<YourUsername>/<YourRepoName>.git
   ```
2. **Install** dependencies:
   ```bash
   cd <YourRepoName>
   npm install
   ```
3. **Configure** environment:
   - Create a `.env` file in the root directory.
   - Add `MONGO_URI`, `PORT`, and any other variables:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
     PORT=5000
     ```
4. **Run** the server:
   ```bash
   npm start
   ```
   or
   ```bash
   npm run dev
   ```
   if you use **nodemon**.

5. **Open** in your browser:
   ```
   http://localhost:5000
   ```
   (or whichever port you configured).

---

## Configuration

- **MongoDB**: Hosted or local. Update your `.env` with the correct URI.
- **Session**: If you use session-based auth, set `SESSION_SECRET` in `.env`.
- **Admin Credentials**: Insert an admin record in the database or seed data.
- **Student Records**: Insert sample students with roll numbers, courses, etc.

---

## Usage

1. **Admin Login**:
   - Go to `/auth/login` and select “admin” or enter admin credentials.  
   - Manage courses, seats, prerequisites, and student registrations in the Admin Dashboard (`/admin/admindashboard`).

2. **Student Login**:
   - Go to `/auth/login` and use your roll number & password.
   - Filter courses, register, see your weekly schedule in the Student Dashboard (`/student/studentDashboard`).

3. **Filtering**:
   - Department & Course Level are text fields with optional datalists for suggestions.
   - Time of day is a select with “morning” or “afternoon.”
   - Click **Apply Filters** to show/hide matching courses.

4. **Weekly Schedule**:
   - Register or drop a course → The schedule table updates automatically.
   - Completed courses do not appear in “in-progress” schedule.

5. **Reports** (Admin):
   - Access various endpoints or UI forms to see which students are missing prerequisites, or courses with seats, etc.

---


## GitHub Repository

**Repository Name**: `UniversityCourseRegistrationSystem`

**Repository Link**: [GitHub Repo](https://github.com/ShaheeraMalik/UniversityCourseRegistrationSystem.git)

---

## License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---
