🌍 1. Course Overview

--Two primary learning flows:

Residents (merged household + apartment users)
Waste Workers (collection + on-ground staff)

--Both end with:

Quizzes (per module(3 Qs) + final test(7Qs))
Certificates
Dashboard tracking

--Video Specs

Duration: 2–5 mins
Type: animated + demo-based
Host: YouTube (primary) + Supabase (custom videos)
Access: Authenticated via Supabase

---


🧑‍💼 2. Resident Course Flow

| Module | Title                           | Videos                                                           | Duration      | Description                           |
| :----- | :------------------------------ | :--------------------------------------------------------------- | :------------ | :------------------------------------ |
| **R1** | Why & What (Segregation Basics) | R1-V1: Why segregation matters<br>R1-V2: The 3-bin system        | 2–3 mins each | Animated intro & demo                 |
| **R2** | Public Bins & Reporting         | R2-V1: Overflowing bins issue<br>R2-V2: App-based reporting flow | 2–3 mins each | Teaches reporting waste issues        |
| **R3** | Community & Incentives          | R3-V1: Clean community benefits<br>R3-V2: Rewards & recognition  | 2–4 mins each | Highlights participation & incentives |


---


🧰 3. Waste Worker Course Flow
| Module | Title               | Videos                                                              | Duration      | Description                                |
| :----- | :------------------ | :------------------------------------------------------------------ | :------------ | :----------------------------------------- |
| **W1** | Safety & PPE        | W1-V1: Protective gear<br>W1-V2: Hazard handling                    | 2–3 mins each | Worker safety & hazard management          |
| **W2** | Collection Workflow | W2-V1: 3-bin collection on route<br>W2-V2: Reporting missed pickups | 2–4 mins each | Field segregation & reporting              |
| **W3** | Career & Incentives | W3-V1: Green jobs<br>W3-V2: Performance tracking                    | 2–3 mins each | Recognition, skill-building, career growth |


---



🎨 4. UI Design System

Colors
| Name          | Hex       | Use                 |
| ------------- | --------- | ------------------- |
| Green Primary | `#16803B` | Buttons, highlights |
| Green Light   | `#34C47C` | Gradients           |
| White         | `#FFFFFF` | Background          |
| Gray Light    | `#F3F5F7` | Panels              |
| Text Gray     | `#4B5563` | Body text           |
| Blue          | `#0B7BCC` | Social aspects      |
| Gold          | `#F1C40F` | Economic highlights |
| Red           | `#E85A4F` | Warnings            |

Fonts

Headings: Poppins / Montserrat
Body: Inter
Accent (optional): Rubik / Rajdhani


---


🪪 5. Certificate Workflow

-User completes all module quizzes → average score ≥50%.
-Supabase function generates PDF using user name, completion date.
-Store file in certificates/{userId}.pdf in Supabase Storage.
-Email user with download link (automated).
-Certificate visible on dashboard (card state = Completed).

---


📊 6. Analytics (Recharts)

Admin Dashboard graphs:
-% residents completed modules
-Avg quiz score per module
-Top reported waste issues
-Bin overflow heatmap (Mapbox integration)

---


🔔 7. Notifications (Sonner)

Examples:

"🎥 Videos Completed! Take your quiz now."
"🎉 Congratulations! You earned your certificate."
"🗑️ Report uploaded successfully."

---

🧭 8. Dashboard Design
Resident Dashboard Cards
| Card             | Action            |
| ---------------- | ----------------- |
| Module Card      | Continue watching |
| Quiz Card        | Take quiz         |
| Certificate Card | Download PDF      |
| Progress Bar     | Show completion % |


Waste Worker Dashboard Cards
| Card            | Action               |
| --------------- | -------------------- |
| Safety Module   | Review               |
| Workflow Module | Continue             |
| Career Module   | Certificate download |


All cards animated using Framer Motion fade/slide.


---



<div class="prompt-block" style="color:#16803B;">
  <button onclick="navigator.clipboard.writeText(document.getElementById('prompt').innerText)">Copy Prompt</button>
  <pre><code id="prompt">
### 💡 Prompt to Recreate the Full Waste Management Learning Module

```bash
Stack:
React.js (TypeScript, Vite) + Tailwind CSS + ShadCN + Radix UI + Framer Motion  
Supabase (Auth, Realtime, Storage) + Mapbox + Recharts + Sonner + react-i18next

Requirements:
1. Two user roles: Residents & Waste Workers.  
2. Each role has 3 modules (2 short videos per module).  
3. Each module has a quiz (3 questions). Final quiz (5–7 questions).  
4. YouTube embedded videos + Supabase-hosted videos.  
5. Dashboard cards (Module progress, Quiz, Certificate).  
6. Minimum 50% pass to earn certificate (auto-generated PDF).  
7. Track progress in Supabase, store certificates in Storage.  
8. Trigger Sonner toast notifications.  
9. Multi-language support (English + Hindi).  
10. Color palette: Green (#16803B), White, Blue (#0B7BCC), Gold (#F1C40F), Gray (#F3F5F7).  
11. Fonts: Poppins (headings), Inter (body).  
12. Include React components for VideoCard, QuizCard, Dashboard.  
13. Use Recharts for completion analytics & Mapbox for bin tracking map.  
14. Animations with Framer Motion for card entry and progress transitions.

Output structure:  
- Folder structure for frontend  
- Component examples (cards, video player, quiz)  
- Supabase schema  
- Certificate generation workflow  
- Dashboard UI design

Make it clean, interactive, and friendly for municipal corporations.
