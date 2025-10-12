# ♻️ Waste Warrior: Lovable Scrap Management System 

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

## 👥 Made By 

This project is proudly developed by the **Waste Warrior Team**.
