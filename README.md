# ♻️ Waste Warrior: Wastes Management System 

Welcome to the official repository for **Waste Warrior**, a complete digital scrap management platform designed for the **Smart India Hackathon (SIH)**. This project connects residents, workers, and administrators in an eco-friendly ecosystem to promote efficient waste management and recycling. 

--- 

## 🧩 Project Overview 

Waste Warrior is a unified web platform designed to manage waste collection, track recycling, distribute rewards, and rank participants on a leaderboard. The core idea is to encourage recycling and waste segregation by rewarding users (residents and workers) through an engaging, points-based leaderboard system. 

--- 

## ⚙️ Core Modules & Features 

Our platform is built with distinct modules for each user role: 

1.  **🏠 Resident Dashboard:** * Request scrap pickups. 
    * Track collection status in real-time. 
    * View earned points and leaderboard rank. 
    * Upload proofs of recycling (images). 
    * Multi-language support (English, Hindi, Gujarati, Tamil). 

2.  **👷 Worker Dashboard:** * Accept or decline pickup requests. 
    * Update progress on collections. 
    * View performance and leaderboard ranking. 
    * Earn points for completing pickups. 

3.  **🧑‍💼 Admin Dashboard:** * Manage user points (add/deduct). 
    * Oversee the monthly leaderboard reset. 
    * Assign "Green Champion" badges to top performers. 
    * View audit logs and system reports. 

4.  **🏆 Leaderboard Module:** * Displays Top 3 performers with Gold, Silver, and Bronze effects. 
    * Features real-time data updates using Supabase. 
    * Includes a motivational banner and confetti animations for achievements. 

--- 

## 🧠 Tech Stack 

This project is built with a modern and powerful tech stack: 

* **Frontend:** React.js, TypeScript, Vite 
* **UI Library:** ShadCN, Tailwind CSS, Radix UI 
* **Animations:** Framer Motion 
* **Backend & Database:** Supabase (Auth, Realtime Database, Storage) 
* **Map Integration:** Mapbox 
* **Translations:** react-i18next 
* **Charts & Analytics:** Recharts 
* **Notifications:** Sonner (Toast) 
* **Routing:** React Router DOM 

--- 

## 🚀 Getting Started Locally 

If you want to run this project on your local machine, follow these simple steps. 

**Prerequisites:** * Node.js and npm installed on your system. 

**Installation:** 1.  **Clone the repository:** ```sh 
    git clone [https://github.com/manavmerja/Waste-Warrior.git](https://github.com/manavmerja/Waste-Warrior.git) 
    ``` 

2.  **Navigate to the project directory:** ```sh 
    cd Waste-Warrior 
    ``` 

3.  **Install the necessary dependencies:** ```sh 
    npm install 
    ``` 

4.  **Start the development server:** ```sh 
    npm run dev 
    ``` 
    The application will now be running locally, usually at `http://localhost:5173`. 

--- 

---

## 🛡️ Our Branch Protection Workflow

To keep our project stable and organized, the **`main`** branch is **protected**. This means no one can push code directly to it. All changes must be reviewed and approved by at least one other team member.

### Why do we do this?

Think of the `main` branch as the master blueprint of our project. It should **always** be working. By requiring reviews (Pull Requests), we can catch bugs early, improve code quality, and make sure everyone understands the changes being made.

### Your Step-by-Step Workflow

When you want to add a new feature or fix a bug, follow these steps every time:

1.  **Get the Latest Code:** Before you start, make sure your local `main` branch is up-to-date.
    ```sh
    git pull origin main
    ```

2.  **Create a New Branch:** Create a new branch for your specific task. Name it something descriptive.
    ```sh
    # Example for a new feature
    git checkout -b feature/resident-dashboard

    # Example for a bug fix
    git checkout -b fix/login-button-color
    ```

3.  **Write Your Code:** Make all your code changes on this new branch.

4.  **Commit and Push Your Branch:** Save your work and push your new branch (not `main`!) to GitHub.
    ```sh
    git add .
    git commit -m "Add feature: Created the basic layout for the resident dashboard"
    git push origin feature/resident-dashboard
    ```

5.  **Create a Pull Request (PR):** Go to the GitHub repository. You will see a prompt to create a **Pull Request** from your new branch. Fill out the details and create the PR.

6.  **Ask for a Review:** Ask a teammate to review your code. They can leave comments or request changes.

7.  **Merge the PR:** Once your PR is **approved by at least TWO teammate**, you can merge it into the `main` branch. Your changes are now part of the main project!

---


---

## 💾 How Our Database Works (Supabase & .env)

Our project uses a single, shared Supabase database. To connect to it, you need secret keys, which are managed in a special `.env` file.

### What is the `.env` file?

The `.env` file is a private file where we store our secret keys (like the database URL and password). When you run `npm run dev`, our code automatically reads the keys from this file and uses them to connect to the Supabase database.

### Your Setup Steps:

Good news! The `.env` file has **already been placed in the project's root directory**. The only step you need to take after cloning the project is to install the dependencies by running `npm install`. The project will then be ready to connect to our shared database automatically.

> **⚠️ Important Warning:** We are all using the **same live database**. Any data you add, delete, or change (like creating a test user) will be instantly visible to everyone on the team. Please be careful and communicate with the team before making major data changes.

---


## 🔄 Keeping Your Code Up-to-Date 

If a teammate has pushed new changes to GitHub, you will need to pull those changes to your local machine to stay in sync. 

1.  **Navigate into your project directory in the terminal:** ```sh 
    cd Waste-Warrior 
    ``` 

2.  **Pull the latest changes from GitHub:** ```sh 
    git pull origin main 
    ``` 
    This command fetches all the new code and merges it into your local project. 

--- 



##  Tailwind CSS v4 Setup 

This project uses Tailwind CSS v4. To set it up in a new Vite + React project, follow these steps: 

1.  **Install Tailwind CSS v4 and the Vite plugin by running the following command:** 
    ```sh 
    npm install tailwindcss @tailwindcss/vite 
    ``` 

2.  **Add the Tailwind CSS plugin to your `vite.config.js` file:** ```javascript 
    import { defineConfig } from 'vite' 
    import react from '@vitejs/plugin-react' 
    import tailwindcss from '@tailwindcss/vite' 

    export default defineConfig({ 
      plugins: [ 
        react(), 
        tailwindcss(), 
      ], 
    }) 
    ``` 

3.  **In your main CSS file (usually `src/index.css`), remove all existing code and add the following line:** ```css 
    @import "tailwindcss"; 
    ``` 

--- 


---

## 💬 A Final Note for the Team

If you have any doubts or don't understand something, **always ask questions before making a mistake.** Clear communication is the key to our success. We're all here to help each other.

---

## 👥 Made By 

This project is proudly developed by the **Waste Warrior Team**.
