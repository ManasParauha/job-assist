# Job-assist

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org)
[![Bun](https://img.shields.io/badge/Bun-1.1-black?style=flat&logo=bun)](https://bun.sh)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Inference-orange?style=flat&logo=openai)](https://groq.com)

**Job-assist** is a premium full-stack job application tracker and AI-powered career assistant designed to solve the chaotic and fragmented process of applying for jobs. Job seekers often struggle to keep track of multiple applications, tailor their resumes for different roles, and gauge their alignment with job descriptions. Job-assist addresses these challenges by offering a centralized dashboard for job application CRUD, combined with advanced AI features—including match score assessments, resume tailoring suggestions, and customized cover letters—empowered by the Groq API. It transforms a stressful job search into a structured, data-driven, and highly optimized process.

*   **Live Deployment Link:** [https://job-assist-henna.vercel.app](https://job-assist-henna.vercel.app)
*   **GitHub Repository:** [https://github.com/ManasParauha/job-assist](https://github.com/ManasParauha/job-assist)

---

## 🛠️ Tech Stack

*   **Core Framework:** Next.js 16 (App Router)
*   **Runtime & Package Manager:** Bun
*   **Language:** TypeScript
*   **Styling (CSS):** Tailwind CSS v4 & PostCSS
*   **UI Components:** Shadcn UI & Base UI (React)
*   **Database:** PostgreSQL (using `pg` client wrapper)
*   **Database Migrations:** Custom SQL Migrations (`db/migrations`)
*   **Authentication & Security:** JWT tokens stored in secure, `httpOnly` cookies & `bcryptjs` password hashing
*   **Validation:** Zod schemas
*   **AI Integration:** Groq SDK (using the LLaMA-based model wrapper)
*   **PDF Text Extraction:** `pdf-parse` (v1.1.1)

---

## 🚀 Setup & Installation

### Prerequisites

*   [Bun](https://bun.sh/) installed locally on your system.
*   A running [PostgreSQL](https://www.postgresql.org/) database (local instance or hosted service like Supabase).
*   A [Groq API Key](https://console.groq.com/) for running AI operations.

### Steps to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ManasParauha/job-assist.git
    cd job-assist
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Configure Environment Variables:**
    Copy the sample configuration file and populate it with your credentials:
    ```bash
    cp .env.local.example .env
    ```
    Open `.env` and fill in the required fields:
    ```env
    DATABASE_URL="postgresql://postgres:your-password@db.supabase.co:5432/postgres?schema=public"
    JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-chars-long"
    GROQ_API_KEY="gsk_your_groq_api_key_here"
    ```

4.  **Run Database Migrations:**
    Initialize the database schema by running the migration script:
    ```bash
    bun db:migrate
    ```

5.  **Seed the Database:**
    Seed the database with an administrative user and sample schema:
    ```bash
    bun db:seed
    ```
    > [!NOTE]
    > The seed script creates a default Administrator account for testing.
    > *   **Email:** `admin@jobassist.com`
    > *   **Password:** `admin123`
    > *   **Role:** `admin`

6.  **Start the Development Server:**
    ```bash
    bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ✨ Features

*   **🔒 Authentication:** Custom JWT-based session management stored in secure `httpOnly` cookies. High-entropy hashing using `bcryptjs` for secure password validation on user login and registration.
*   **📋 Job Applications CRUD:** A centralized, drag-and-drop-style dashboard layout grouping applications by status (e.g., Wishlist, Applied, Interviewing, Offered, Rejected). Users can easily create, read, update details (salary, notes, dates, location), and delete entries.
*   **⚡ AI Match Score:** Evaluates the alignment percentage (0-100%) between the user's stored resume and the job description. Highlights key strengths, critical gaps, and actionable suggestions to improve chances.
*   **📝 AI Resume Suggestions:** Leverages the Groq API to provide deep recommendations, including a tailored summary statement, resume bullet point rewrites, and target keywords missing from the current resume.
*   **✉️ AI Cover Letter Generator:** Instantly generates a customized, professional cover letter tailored to the specific job details and the user's professional background. Includes a one-click clipboard copy feature.
*   **📊 Admin Dashboard:** Access-restricted dashboard page (exclusive to users with the `admin` role) showcasing read-only platform metrics, total registered user stats, cumulative applications count, and status breakdown.

---

## 🔒 Real-World Considerations

### Security Measures Implemented
*   **JWT in HttpOnly Cookies:** Authentication tokens are stored securely in `httpOnly` and `Secure` cookies. This prevents malicious scripts from accessing session tokens, mitigating Cross-Site Scripting (XSS) vulnerabilities.
*   **Input Validation & Sanitization:** Strict request payload validation is enforced using **Zod** schemas on both client and server boundaries to reject illegal inputs, SQL injections, or anomalous parameters.
*   **Rate Limiting on AI Routes:** Dedicated rate-limiting logic restricts the frequency of requests to `/api/ai/*` routes per user session. This prevents scraping and protects the backend against Denial of Service (DoS) attempts.
*   **Fine-Grained Authorization:** Every database operation verifies that the resource identifier (such as `user_id` or `application_id`) matches the authenticated session user. Additionally, role-based protection restricts the admin API endpoints strictly to users with the `admin` role.

### Cost & Scalability
*   **AI Rate Limiting:** Limits are applied per-user to control Groq API token usage and restrict operational costs.
*   **Database Caching:** AI-generated results (Match Scores, Resume Suggestions, and Cover Letters) are cached inside the PostgreSQL database. Subsequent page loads or inspections query the cached data rather than firing another Groq inference, maximizing performance and saving API cost.

### Data Privacy
*   **Resume Encryption & Privacy:** A user's plain-text resume is classified as sensitive personal data. It is associated directly with the owner's database row, and strict row-level restrictions ensure no other user (including admin roles) can read or modify the resume text.

### Future Improvements
*   **Automated Testing Suite:** Introduce unit tests with Jest and End-to-End (E2E) testing with Playwright to safeguard core authentication and CRUD behaviors.
*   **Resume Format Extension:** Extend the PDF resume upload feature to also support DOCX and plain-text file uploads.
*   **Status Alerts & Notifications:** Send automated transactional emails (via Resend or SendGrid) to notify users of status changes, deadline reminders, or interview updates.
