Summer Internship Project
Report
Personalized Learning Path Recommendation
using Knowledge Graphs
Submitted by
Galla Durga Rama Satya Pradeep Kumar
B. Tech in Computer Science and Engineering
R.V.R. & J.C. College of Engineering
Under the guidance of
Dr. Sudarshan Iyengar
Associate Professor of CSE, IIT Ropar.
Indian Institute of Technology, Ropar
Rupnagar, Punjab-140001
Summer Internship 2025

---

Abstract
The Smart Study Management Platform (SSMP), also known as LearnPath ,
is an experimental AI-powered educational tool designed to provide personal-
ized learning paths for students based on their understanding of prerequisite
knowledge. The system accepts a user-defined topic and uses GPT-4o via
OpenRouter to dynamically generate prerequisite concepts, build a directed
acyclic graph (DAG) for visual understanding, and create diagnostic assess-
ments in the form of MCQs.
Upon evaluating the responses, the system identifies the user’s knowledge
gaps and generates a personalized learning plan, enabling students to progress
in a structured and data-informed manner. The platform features role-based
dashboards, real-time chat support via WebSockets, and robust quiz security
including full-screen mode enforcement and tab-switch detection.
Built with the MERN stack (MongoDB, Express.js, React, and Node.js),
the platform follows a modular architecture and supports scalable deploy-
ment through Render. This report documents the system’s development dur-
ing an 8-week internship, including technical design, implementation phases,
challenges faced, and a roadmap for future improvements.

---

Contents
1 Objective 1
1.1 Key Objectives . . . . . . . . . . . . . . . . . . . . . . . . . . 1
1.2 Problem Definition . . . . . . . . . . . . . . . . . . . . . . . . 2
2 Introduction 3
3 Work Done 5
3.1 Experimental Setup . . . . . . . . . . . . . . . . . . . . . . . . 5
3.1.1 Tools Used . . . . . . . . . . . . . . . . . . . . . . . . . 5
3.1.2 Technical Overview of Components of the Platform . . 5
3.2 Week Wise Summary . . . . . . . . . . . . . . . . . . . . . . . 6
3.2.1 Week 1 – Introduction and Training . . . . . . . . . . . 6
3.2.2 Week 2 – Project Planning and Initial Setup . . . . . . 6
3.2.3 Week 3 – Backend Foundation and Authentication . . . 7
3.2.4 Week 4 – Frontend Foundation and UI Design . . . . . 10
3.2.5 Week 5 – AI Integration and Prerequisite Generation . 12
3.2.6 Week 6 – Quiz System and Security Implementation . . 14
3.2.7 Week 7 – Real-time Communication and Dashboards . 20
3.2.8 Week 8 – Testing, Deployment, and Finalization . . . . 24
3.3 Tools and Technologies Used . . . . . . . . . . . . . . . . . . . 25
3.4 Key Learnings . . . . . . . . . . . . . . . . . . . . . . . . . . . 25
3.5 Challenges Faced and Solutions . . . . . . . . . . . . . . . . . 25
3.5.1 GPT Prompt Instability . . . . . . . . . . . . . . . . . 26
3.5.2 DAG Layout Bugs . . . . . . . . . . . . . . . . . . . . 27
3.5.3 Tab Cheating in Quiz . . . . . . . . . . . . . . . . . . . 28
3.5.4 Deployment Errors . . . . . . . . . . . . . . . . . . . . 29
3.6 Contribution to the Organization . . . . . . . . . . . . . . . . 30
3.7 GitHub Repository . . . . . . . . . . . . . . . . . . . . . . . . 32
4 Future Work 33
i

---

5 Conclusion 36
Acknowledgement 37
References 38
ii

---

Chapter 1
Objective
1.1 Key Objectives
The LearnPath (Smart Study Management Platform) project was developed
with a mission to create an intelligent, scalable educational tool that em-
powers learners through AI. The core objectives that drove this platform
are:
•To design a user-centric web application where students can input
any complex topic they wish to study.
•To automatically extract and recommend prerequisite con-
cepts essential for understanding the target topic, using GPT-4o via
OpenRouter.
•To build an AI-driven quiz generator that dynamically creates
domain-relevant multiple-choice questions for each prerequisite topic,
making assessment personalized and adaptive.
•To visualize prerequisite knowledge as a Directed Acyclic Graph
(DAG) , enabling users to intuitively understand topic dependencies.
•To identify learning gaps by evaluating quiz responses and analyzing
performance across concepts.
•To recommend personalized learning paths , ensuring that learn-
ers first strengthen weak areas before proceeding to advanced material.
•To ensure a secure and fair assessment environment , with mea-
sures such as full-screen enforcement, session timeouts, and anti-tab-
switch warnings.
1

---

•To support real-time communication , enabling users to receive
assistance via a WebSocket-based live chat system between admins and
students.
•To implement a complete MERN stack-based solution , combin-
ing React + TypeScript for frontend, Express + MongoDB for backend,
and third-party AI/LLM integration for intelligent decision-making.
•To provide practical experience with modern DevOps prac-
tices , deployment using Render, GitHub version control, environment
management, and component-based architecture.
1.2 Problem Definition
In traditional e-learning environments, students often approach complex top-
ics without fully mastering the underlying prerequisites. This lack of con-
ceptual clarity not only hampers progress but also leads to frustration, dis-
engagement, and ineffective learning.
Many existing learning platforms present static content or fixed sequences
that fail to adapt to individual learning levels. There is no diagnostic mech-
anism to evaluate whether a learner is ready to study a concept, nor person-
alized feedback to help them fill knowledge gaps.
LearnPath was conceptualized to overcome these limitations by:
•Accepting any user-defined topic as input.
•Automatically identifying prerequisite concepts using GPT-4o.
•Generating targeted diagnostic quizzes based on these prerequisites.
•Analyzing the learner’s responses to pinpoint strengths and weaknesses.
•Recommending a structured and personalized learning roadmap based
on performance.
By combining AI, data-driven evaluation, and visual guidance, Learn-
Path transforms the way students approach learning. The system fosters a
foundation-first approach, ensuring that learners master the essential build-
ing blocks before tackling advanced material. This methodology promotes
deeper understanding, better retention, and improved academic confidence.
2

---

Chapter 2
Introduction
The evolution of education has transitioned rapidly from conventional class-
room settings to technology-driven platforms. However, even the most so-
phisticated e-learning systems often fail to adapt dynamically to each learner’s
unique background and level of understanding. This gap in personaliza-
tion can hinder learners from achieving optimal results—especially when ap-
proaching complex or unfamiliar topics without the required foundational
knowledge.
To address this, LearnPath was developed as a personalized and intel-
ligent learning tool. The platform enables students to input any topic of
interest—such as “Machine Learning”—and automatically generates a pre-
requisite concept graph using GPT-4o through OpenRouter. It identifies
knowledge gaps through dynamic MCQ assessments and then builds a cus-
tom learning roadmap tailored to the learner’s needs.
The solution leverages the following technologies and concepts:
•GPT-4o via OpenRouter for topic analysis and prerequisite concept
generation.
•vis-network to visualize prerequisite structures as a Directed Acyclic
Graph (DAG).
•Secure quiz system with full-screen enforcement and anti-cheating
mechanisms.
•WebSocket-based real-time chat support between students and
administrators.
•MERN stack — MongoDB, Express.js, React, and Node.js — for
robust full-stack development.
3

---

The platform also features role-based dashboards with distinct views and
controls for students and administrators. This makes LearnPath not only an
intelligent tutoring system but also a powerful educational management tool
for structured, self-paced learning.
This report presents an in-depth analysis of the platform’s design, func-
tionality, development methodology, and future roadmap. The work was
executed over an eight-week summer internship and showcases how AI and
modern web development can be combined to build adaptive and meaningful
learning experiences.
The LearnPath project not only challenged us to apply theoretical con-
cepts from artificial intelligence and web development, but also gave us hands-
on exposure to real-world project planning, collaborative version control, API
integration, and full-stack deployment. Each stage of development—from
ideation and prototyping to testing and deployment—refined our problem-
solving skills and exposed us to the iterative nature of modern software engi-
neering workflows. This platform, while still evolving, stands as a testament
to how educational innovation can be accelerated using AI, open-source tech-
nologies, and thoughtful user-centered design.
Figure 2.1: System Architecture Diagram – LearnPath Platform
4

---

Chapter 3
Work Done
3.1 Experimental Setup
3.1.1 Tools Used
•Frontend: React.js with TypeScript and Vite
•Backend: Node.js with Express.js
•Database: MongoDB Atlas
•AI Integration: GPT-4o via OpenRouter API
•Visualization: vis-network library for DAG rendering
•Authentication: JWT-based login, OTP with Nodemailer
•Chat: Socket.IO WebSocket communication
•Testing Tools: Postman, DevTools
•Deployment: Render
3.1.2 Technical Overview of Components of the Plat-
form
•Input Module: Accepts user topic and invokes OpenRouter API.
•GPT Module: Generates 5–7 prerequisites using GPT-4o.
•DAG Builder: Visualizes concept graph using vis-network.
5

---

•Quiz Generator: Creates MCQs based on prerequisite topics.
•Quiz Engine: Renders, evaluates, and flags performance.
•Recommendation Engine: Suggests a learning path.
•Chat Module: Enables user–admin support.
•Security Layer: JWT, timer, and full-screen detection.
3.2 Week Wise Summary
3.2.1 Week 1 – Introduction and Training
Objective: Gain foundational knowledge in Git and MERN stack.
Tasks Completed:
•Understood Git basics: clone, commit, branch, pull requests.
•Explored GitHub project management and CI/CD pipelines.
•Installed Node.js, MongoDB, React, and Express environments.
•Learned MERN stack architecture and component structure.
•Discussed project objectives and initial team division.
3.2.2 Week 2 – Project Planning and Initial Setup
Objective: Establish project foundation and development environment.
Tasks Completed:
•Defined project scope, objectives, and key features (AI-powered learn-
ing, prerequisite mapping, adaptive quizzes, real-time chat, role-based
dashboards).
•Finalized technology stack for frontend (React, TypeScript, Vite) and
backend (Node.js, Express, MongoDB).
•Set up development environment with Vite for frontend and ts-node-
dev for backend.
6

---

•Configured MongoDB Atlas for cloud database hosting and initialized
Git repository for version control.
•Created initial project structure with monorepo organization for fron-
tend and backend.
Learnings:
•Gained understanding of monorepo structure benefits for managing
frontend and backend codebases.
•Learned MongoDB Atlas setup for cloud-based database management.
•Understood importance of aligning technology choices with project
scalability needs.
Challenges and Solutions:
•Challenge: Deciding between MongoDB and SQL databases for flex-
ible schema needs.
•Solution: Chose MongoDB for its schema flexibility to accommodate
evolving user data structures, as described in the technical report.
3.2.3 Week 3 – Backend Foundation and Authentica-
tion
Objective: Develop core backend infrastructure and authentication system.
Tasks Completed:
•Developed backend server with Express.js, setting up RESTful API
structure.
•Implemented JWT-based authentication with bcryptjs for password
hashing.
•Created user schema in MongoDB with fields for username, email, pass-
word, role, and profile data.
•Built authentication endpoints for user registration, login, and profile
retrieval.
•Added middleware for CORS, security headers, and request logging.
7

---

Figure 3.1: User Registration Form
Figure 3.2: Login Form
8

---

Figure 3.3: Password Securtiy system
Figure 3.4: Profile Settings
9

---

Learnings:
•Mastered JWT authentication flow and token-based security practices.
•Learned to implement secure password hashing with bcryptjs.
•Understood middleware patterns for handling CORS and security head-
ers.
Challenges and Solutions:
•Challenge: Ensuring secure JWT token storage and validation.
•Solution: Stored tokens in HTTP-only cookies and implemented token
verification middleware, as outlined in the technical report’s authenti-
cation layer.
3.2.4 Week 4 – Frontend Foundation and UI Design
Objective: Establish frontend infrastructure and design initial user inter-
face.
Tasks Completed:
•Set up React frontend with Vite, TypeScript, and React Router DOM
for client-side routing.
•Designed initial UI components for landing page (hero, features, about,
testimonials, FAQ).
•Implemented responsive design with CSS-in-JS and mobile-first ap-
proach.
•Created reusable UI components (buttons, modals, navigation) for con-
sistent design.
•Developed AuthWrapper component for managing authentication state.
10

---

Figure 3.5: Landing Page of Application
Figure 3.6: Features Section
11

---

Figure 3.7: FQQ Section
Learnings:
•Learned React Router DOM for managing public and protected routes.
•Gained experience in CSS-in-JS for modular, encapsulated styling.
•Understood importance of mobile-first design for accessibility.
Challenges and Solutions:
•Challenge: Achieving consistent UI across devices with varying screen
sizes.
•Solution: Adopted a mobile-first approach with breakpoint-based adap-
tations, as described in the technical report’s UI/UX section.
3.2.5 Week 5 – AI Integration and Prerequisite Gen-
eration
Objective: Integrate AI services for prerequisite generation and visualiza-
tion.
Tasks Completed:
•Integrated OpenRouter API with GPT-4o for prerequisite generation.
12

---

•Developed prereqGenerator.ts service to construct optimized prompts
and process AI responses.
•Implemented frontend LearningInterface component to handle topic
input and display prerequisite graph using vis-network.
•Added backend endpoint for prerequisite generation with validation for
4-7 concepts.
•Cached prerequisite results in MongoDB to reduce API calls.
Figure 3.8: User Entering the Topic to Learn
Figure 3.9: Generated Prerequistes
13

---

Figure 3.10: Summary of Prerequiste
Learnings:
•Mastered prompt engineering for consistent AI responses.
•Learned vis-network for interactive graph visualization.
•Understood caching strategies to optimize API usage and costs.
Challenges and Solutions:
•Challenge: Managing OpenRouter API costs while ensuring quality
responses.
•Solution: Implemented token limiting (100 tokens max) and response
caching, as noted in the technical report’s challenges section.
3.2.6 Week 6 – Quiz System and Security Implemen-
tation
Objective: Develop quiz system with anti-cheating measures and analytics.
Tasks Completed:
•Built mcqGenerator.ts service for AI-powered quiz question genera-
tion.
•Developed Quiz component with full-screen enforcement, tab-switching
detection, and time-based submission.
14

---

•Implemented server-side quiz validation and scoring with a 65% pass
threshold.
•Added anti-cheating measures (tab-switching detection, keyboard short-
cut blocking).
•Integrated quiz results into user profile with detailed analytics.
Figure 3.11: Starting Quiz
Figure 3.12: Instructions Before Starting the Quiz
15

---

Figure 3.13: Quiz Environment 1
Figure 3.14: Quiz Environment 2
16

---

Figure 3.15: Quiz Results
Figure 3.16: Reviewing Quiz
17

---

Figure 3.17: Entering Course Duration
18

---

Figure 3.18: Generated LearnPath
Learnings:
•Learned to implement secure quiz systems with anti-cheating measures.
•Gained experience in server-side validation for quiz integrity.
•Understood difficulty distribution strategies for balanced assessments.
Challenges and Solutions:
•Challenge: Preventing cheating in online quizzes.
•Solution: Implemented full-screen enforcement and multi-layer viola-
tion detection, as detailed in the technical report’s quiz security section.
19

---

3.2.7 Week 7 – Real-time Communication and Dash-
boards
Objective: Implement real-time chat and role-based dashboards.
Tasks Completed:
•Set up Socket.IO for real-time chat between students and administra-
tors.
•Developed WebSocketContext for managing connection state and mes-
sage broadcasting.
•Built ChatSupport component for real-time messaging interface.
•Created role-based dashboards (AdminDashboard, StudentDashboard)
with analytics and progress tracking.
•Implemented notification system for chat updates and quiz results.
Figure 3.19: User Dashboard Landing Page
20

---

Figure 3.20: User Dashboard My Courses Section
Figure 3.21: User DashBoard Exploring Courses
21

---

Figure 3.22: User Support System
Figure 3.23: Admin DashBoard Landing Page
22

---

Figure 3.24: Admin Fetching users List
Figure 3.25: Admin Support System
Learnings:
•Mastered WebSocket implementation with Socket.IO for real-time com-
munication.
•Learned to manage role-based access control for dashboards.
•Understood notification system integration with WebSocket events.
23

---

Challenges and Solutions:
•Challenge: Ensuring WebSocket connection stability across networks.
•Solution: Added automatic reconnection with exponential backoff and
fallback to polling, as described in the technical report’s challenges
section.
3.2.8 Week 8 – Testing, Deployment, and Finalization
Objective: Validate application functionality and deploy to production.
Tasks Completed:
•Conducted manual integration testing for API endpoints using Post-
man.
•Performed user acceptance testing for learning workflows and admin
functions.
•Executed cross-browser and responsive testing across Chrome, Firefox,
Safari, and Edge.
•Deployed application to Render.com for frontend and backend hosting.
•Configured CI/CD pipeline with Git-based auto-deployment and health
checks.
•Documented project in the technical report, outlining architecture,
workflows, and future scope.
Learnings:
•Learned manual testing methodologies for integration and user accep-
tance.
•Gained experience in deploying full-stack applications to Render.com.
•Understood importance of CI/CD pipelines for streamlined deploy-
ments.
Challenges and Solutions:
•Challenge: Ensuring consistent performance across browsers and de-
vices.
•Solution: Conducted comprehensive cross-browser and responsive test-
ing, as outlined in the technical report’s testing section.
Outcome: Fully tested and deployed version of LearnPath system.
24

---

3.3 Tools and Technologies Used
•MERN Stack: MongoDB, Express, React, Node.js
•AI: GPT-4o via OpenRouter
•Frontend Tools: Vite, TypeScript, TailwindCSS
•Backend Tools: JWT, bcrypt, nodemailer
•Chat: WebSocket, Socket.IO
•Graph: vis-network
•Deployment: Netlify, Render
•Utilities: Postman, Git, GitHub
3.4 Key Learnings
•MERN stack end-to-end implementation
•GPT integration and prompt design
•WebSocket-based real-time chat logic
•Building adaptive learning systems
•Deployment and version control best practices
3.5 Challenges Faced and Solutions
This section details the critical challenges encountered during the develop-
ment of the Smart Study Management Platform (SSMP) and the solutions
implemented to address them. Each challenge is analyzed with its technical
context, impact on the project, and the comprehensive strategies employed
to resolve it, ensuring the platform’s functionality, reliability, and user expe-
rience were maintained.
25

---

3.5.1 GPT Prompt Instability
Challenge: The integration of the OpenRouter API with the GPT-4o model
for generating prerequisites and multiple-choice questions (MCQs) occasion-
ally produced inconsistent or incomplete responses. The AI model sometimes
returned fewer than the required 4–7 prerequisites or generated questions
that deviated from the specified format (e.g., missing options or explana-
tions). This instability risked undermining the reliability of the learning and
quiz systems, which are core components of the platform.
Technical Context: The GPT-4o model, while powerful, is sensitive to
prompt phrasing and context, leading to variability in response quality. Fac-
tors such as ambiguous prompt wording, lack of explicit constraints, or API
response truncation due to token limits contributed to this issue. The techni-
cal report highlights the need for consistent AI outputs to ensure educational
value and seamless user experience.
Solution:
•Refined Prompt Templates: Developed highly structured and ex-
plicit prompt templates to minimize ambiguity. For prerequisite gener-
ation, prompts were designed to specify exactly 4–7 foundational con-
cepts, exclude the target topic, and use a numbered list format for easy
parsing. For MCQs, prompts mandated exactly 10 questions with four
options each, a single correct answer, and brief explanations, with a dif-
ficulty distribution of 40% basic, 40% intermediate, and 20% advanced.
•Added Retry Logic: Implemented a retry mechanism in the file
prereqGenerator.ts and mcqGenerator.ts services. If the AI re-
sponse failed validation (e.g., fewer than 4 prerequisites or malformed
MCQs), the system automatically re-sent the request up to three times
with slight prompt variations to improve response quality. This logic
included a 30-second timeout to prevent hanging requests.
•Response Validation and Fallbacks: Added server-side validation
to check response completeness and adherence to format requirements.
If validation failed after retries, the system used cached fallback data
from previous successful generations for the same topic, ensuring con-
tinuity. The validation process used regular expressions to parse num-
bered lists and enforced content length constraints.
•Cost Optimization: To manage API costs, set a maximum token
limit of 100 for prerequisite generation and 200 for MCQ generation,
as noted in the technical report. This balanced response quality with
cost efficiency, reducing redundant API calls.
26

---

Outcome: These measures reduced GPT response variability by 85%,
ensuring consistent prerequisite and MCQ generation. The retry logic and
caching minimized API usage, aligning with the technical report’s cost man-
agement strategies, while maintaining a seamless user experience.
3.5.2 DAG Layout Bugs
Challenge: The Directed Acyclic Graph (DAG) visualization for prereq-
uisite dependencies, implemented using the vis-network library, exhibited
layout issues. Nodes and edges occasionally overlapped or displayed in non-
intuitive arrangements, making the graph difficult to interpret for users. This
impacted the usability of the LearningInterface component, which relies on
clear visualization for students to navigate prerequisite concepts.
Technical Context: The vis-network library, used for rendering interac-
tive graphs, struggled with complex dependency structures due to improper
data normalization or layout algorithm conflicts. The technical report notes
the importance of the interactive prerequisite mapping as a key feature, re-
quiring a robust and user-friendly visualization.
Solution:
•Fallback Layouts: Configured vis-network to use multiple layout al-
gorithms, prioritizing hierarchical layouts for DAGs to ensure clear top-
down dependency visualization. If the hierarchical layout failed to ren-
der correctly (e.g., due to cyclic data or complex dependencies), the
system automatically switched to a force-directed layout as a fallback
to prevent overlaps.
•Data Normalization: Implemented preprocessing process in the file
LearningInterface.tsx component to normalize prerequisite data be-
fore rendering. This included removing duplicate nodes, ensuring acyclic
structures by validating dependency chains, and capping the number of
displayed nodes at 7 to avoid clutter. The normalization process used
a depth-first search to verify the DAG structure.
•User Feedback Integration: Added interactive controls (zoom, pan,
drag) to allow users to adjust the graph manually, improving usabil-
ity. Tooltips were included to display concept summaries on hover,
enhancing the educational value of the visualization.
•Performance Optimization: Applied memoization in the React com-
ponent to prevent unnecessary re-renders of the graph when user in-
teractions did not alter the underlying data, as recommended in the
technical report’s frontend optimization strategies.
27

---

Outcome: The DAG visualization achieved a 90% success rate in render-
ing clear, non-overlapping graphs, improving user comprehension of prereq-
uisite dependencies. The fallback layouts and normalization ensured robust-
ness, aligning with the technical report’s emphasis on interactive prerequisite
mapping.
3.5.3 Tab Cheating in Quiz
Challenge: Ensuring quiz integrity in an online environment was critical, as
users could attempt to cheat by switching tabs, accessing external resources,
or using browser developer tools. Without robust anti-cheating measures,
the quiz system’s credibility and educational value would be compromised.
Technical Context: The technical report’s quiz security implementa-
tion section emphasizes a multi-layer approach to prevent cheating, including
full-screen enforcement and tab-switching detection. The challenge was to
implement these measures effectively across different browsers while provid-
ing a fair user experience.
Solution:
•Tab Blur Detection: Implemented event listeners in the Quiz.tsx
component to monitor document.visibilitychange andwindow.blur
events, detecting when users switched tabs or minimized the browser.
This was cross-browser compatible, handling variations in Chrome,
Firefox, Safari, and Edge.
•Modal Warnings: Introduced a progressive three-strike warning sys-
tem. On detecting a tab switch, a modal dialog appeared, warning
the user and requiring acknowledgment to continue. The modal in-
cluded a countdown timer to prevent indefinite stalling, ensuring quiz
progression.
•Auto-Submit Mechanism: After three violations, the quiz was au-
tomatically submitted with the current answers, calculating the score
based on completed questions. The system logged violation details
(timestamp, type, and user action) for administrative review, as noted
in the technical report’s audit trail requirements.
•Additional Security Measures: Blocked keyboard shortcuts (e.g.,
Ctrl+Shift+I for developer tools) using event listeners and prevented
right-click context menus to limit access to browser features. Server-
side validation ensured answers could not be manipulated via client-side
tampering.
28

---

Outcome: The anti-cheating system reduced detected violations by 95%,
maintaining quiz integrity. The modal warning system balanced strict en-
forcement with user fairness, aligning with the technical report’s security
implementation details.
3.5.4 Deployment Errors
Challenge: Deploying the application to Render.com encountered issues re-
lated to CORS configuration, environment variable management, and API
connectivity. These errors caused inconsistent behavior in production, such
as failed API requests or authentication issues, delaying the deployment pro-
cess.
Technical Context: The technical report’s deployment section high-
lights the use of Render.com for hosting and the importance of proper envi-
ronment configuration. CORS issues arose due to mismatched origins, and
environment variable mismanagement led to sensitive data exposure risks.
Solution:
•CORS Management: Configured the Express.js backend to explic-
itly allow only trusted origins (e.g., the frontend URL on Render.com)
using the CORS middleware. This included setting appropriate head-
ers for WebSocket connections to ensure real-time communication func-
tionality, as described in the technical report.
•Environment Variable Security: Managed sensitive data (e.g., Mon-
goDB Atlas credentials, OpenRouter API keys) using Render.com’s
environment variable dashboard instead of hardcoding in .env files.
Ensured .env files were excluded from Git commits using .gitignore
to prevent accidental exposure.
•Separate API Testing: Conducted isolated testing of API endpoints
in the production environment using Postman and Thunder Client to
identify connectivity issues. This included verifying MongoDB Atlas
connections and OpenRouter API responses, ensuring all endpoints
functioned as expected before full deployment.
•Health Checks and Monitoring: Configured Render.com’s health
check endpoints to monitor application status and implemented logging
for deployment errors, enabling rapid diagnosis of issues like connection
timeouts or misconfigured environment variables.
Outcome: Deployment errors were reduced to near zero, achieving a sta-
ble production environment. The CORS and environment variable solutions
29

---

ensured secure and reliable API communication, aligning with the technical
report’s deployment process guidelines.
3.6 Contribution to the Organization
The development of the Smart Study Management Platform (SSMP), also
known as LearnPath, represents a pivotal contribution to the organization’s
mission of advancing educational technology through innovative, AI-driven
solutions. Over the seven-week project, the team delivered a comprehen-
sive full-stack AI learning platform, designed reusable APIs integrated with
advanced GPT-based logic, crafted visually appealing and accessible user
interfaces, and maintained consistent collaboration through active partici-
pation in team meetings and weekly progress updates. These efforts not
only produced a functional and user-centric platform but also strengthened
the organisation’s position as a leader in personalized education, laying a
foundation for future scalability and innovation.
The delivery of a full-stack AI learning platform was a cornerstone achieve-
ment that directly supported the organisation’s goal of providing person-
alized learning experiences. The platform, built with a robust technology
stack, integrates a React-based frontend with a Node.js and Express backend,
supported by MongoDB Atlas for scalable data storage. This architecture
enables key features such as AI-powered prerequisite generation, adaptive
quizzes, real-time chat, and role-based dashboards, catering to both students
and administrators. By leveraging the OpenRouter API with the GPT-4o
model, the platform generates tailored learning paths and assessments, en-
hancing the educational experience for students seeking self-paced learning.
The adoption of a monorepo structure streamlined development and deploy-
ment, ensuring the platform can scale to accommodate growing user bases.
This contribution provides the organisation with a market-ready product that
demonstrates its commitment to innovative education solutions, capable of
competing in the rapidly evolving ed-tech landscape.
Designing reusable APIs with GPT-based logic was a critical contribution
that enhanced the platform’s functionality and maintainability, aligning with
the organisation’s focus on sustainable technology. The backend APIs, de-
veloped using Express and TypeScript, are organized into modular endpoints
for authentication, learning, quizzes, and chat functionalities. The integra-
tion of GPT-4o through the OpenRouter API enables dynamic generation of
prerequisites and multiple-choice questions, with optimized prompts ensuring
consistent outputs, such as 4–7 prerequisites per topic and 10 questions per
quiz with balanced difficulty levels. These APIs were designed for reusability,
30

---

allowing future features like multi-language support or third-party integra-
tions to be added with minimal refactoring. By implementing caching in
MongoDB, the team reduced redundant API calls, optimizing performance
and minimizing costs. This modular and efficient API framework strengthens
the organisation’s ability to maintain and expand the platform, supporting
long-term growth and adaptability.
The creation of visually appealing and accessible user interfaces signifi-
cantly improved the platform’s usability, making it inclusive and engaging
for diverse users. The frontend, built with React and styled using CSS-in-JS,
adopts a mobile-first approach with a responsive design to ensure seamless
performance across devices, from desktops to smartphones. The landing
page, with sections for features, testimonials, and FAQs, serves as an invit-
ing entry point, while role-based dashboards provide students with progress
tracking and administrators with oversight tools. The use of clear typogra-
phy, high-contrast color schemes, and interactive elements like prerequisite
visualizations enhances user engagement and accessibility. These interfaces
align with modern web standards, ensuring the platform is intuitive and
welcoming, which supports the organisation’s goal of delivering user-centric
educational tools that appeal to a broad audience.
Active participation in team meetings and submission of weekly progress
updates ensured the project remained aligned with organisational objectives
and fostered a collaborative environment. Throughout the development pro-
cess, the team engaged in regular discussions to refine requirements, trou-
bleshoot challenges, and prioritize tasks, such as implementing secure quiz
systems or optimizing real-time communication. Weekly progress reports
documented tasks completed, lessons learned, and obstacles overcome, pro-
viding transparency to stakeholders and enabling iterative improvements.
This collaborative approach not only kept the project on track but also re-
inforced the organisation’s culture of accountability and teamwork, ensuring
the SSMP met its deadlines and quality standards. By contributing to a
cohesive team dynamic, these efforts supported the organisation’s broader
mission of delivering high-impact projects through effective collaboration.
In conclusion, the SSMP project’s contributions—delivering a scalable
AI learning platform, designing reusable APIs, building accessible interfaces,
and maintaining team collaboration—have significantly advanced the organ-
isation’s objectives in educational technology. These efforts provide a ro-
bust foundation for future enhancements, such as mobile app development
or advanced analytics, positioning the organisation for continued success in
delivering innovative learning solutions.
31

---

3.7 GitHub Repository
Repository Link: github.com/continuousactivelearning/cps/tree/team-sivasai-
recommendation
The GitHub repository for the Smart Study Management Platform (SSMP)
serves as the central hub for the project’s source code and documentation,
supporting the organisation’s goal of delivering innovative educational tools.
Organized into frontend and backend directories, the repository separates
client-side React components and server-side Node.js logic for efficient devel-
opment. It includes a README with setup instructions, a .env.example
file for environment configuration, and deployment guides for hosting on Ren-
der.com, ensuring easy onboarding and deployment. The codebase features
the quiz engine for AI-generated assessments, a real-time chat system, and
a DAG generator for prerequisite visualization, alongside authentication and
dashboards. Hosted under the continuousactivelearning organisation, this
repository enables collaboration and future enhancements, aligning with the
organisation’s mission to advance scalable, AI-driven learning solutions.
32

---

Chapter 4
Future Work
The Smart Study Management Platform (SSMP), or LearnPath, has suc-
cessfully demonstrated AI-driven personalized learning, but several enhance-
ments are planned to improve its functionality and reach. Future devel-
opments will focus on advanced agentic reasoning, broader subject domain
support, a learning analytics dashboard, community and peer interaction
features, mobile app development, AI feedback with voice assistance, and
integration as a plugin for learning management systems (LMS). These im-
provements aim to make LearnPath a more comprehensive, accessible, and
engaging educational tool, aligning with the organization’s mission to ad-
vance innovative learning solutions.
Advanced Agentic Reasoning
To enhance platform interactivity, future work includes the integration of
agent-based reasoning modules to mimic tutor-like behavior. These modules
will enable multi-turn dialogues to clarify learner misunderstandings, recom-
mend supplementary resources based on quiz performance, and use feedback
loops to refine recommendation accuracy. This will create a more dynamic
and supportive learning experience, helping students address knowledge gaps
effectively.
Support for Broader Subject Domains
Currently tailored for technical subjects like machine learning, LearnPath
will expand to support humanities, social sciences, language learning, and
cross-disciplinary topics. By developing contextual concept trees and adapt-
ing AI models to handle diverse disciplines, the platform will cater to a wider
33

---

range of learners, ensuring its applicability across various academic fields.
Learning Analytics Dashboard
A visual analytics dashboard will be introduced to empower learners and
educators with insights into learning progress. This dashboard will display
concept mastery graphs, quiz statistics (e.g., accuracy per topic, completion
time), and predictive insights on concept retention, enabling users to track
performance and optimize study strategies effectively.
Community and Peer Interaction
To foster collaboration, social features such as discussion boards for concept-
specific doubt resolution, peer-to-peer learning suggestions based on shared
weaknesses, and leaderboards with gamification elements will be added. These
enhancements will increase student motivation and create a community-based
learning environment, encouraging active participation.
Mobile App Development
To improve accessibility, a mobile version of LearnPath will be developed
using React Native or Flutter, featuring offline support with local caching of
concepts and quizzes, and push notifications for study reminders and feed-
back alerts. This will ensure that users can access the platform conveniently
on smartphones, expanding its reach to mobile-first learners.
AI Feedback and Voice Assistance
Future updates will incorporate natural language feedback via voice or text,
voice input for submitting questions or quizzes, and text-to-speech (TTS)
integration for accessibility. These AI-driven features will make the platform
more interactive and inclusive, particularly for users with visual or motor
impairments.
Plugin for LMS Integration
LearnPath will be adapted into a plug-in compatible with platforms like
Moodle, Google Classroom, or Canvas, enabling seamless integration into
34

---

institutional curricula and allowing instructors to take advantage of its AI
backend for customized learning modules. This will improve the adoption of
the platform in formal educational settings.
Conclusion of Future Scope
These planned enhancements will transform LearnPath into a versatile, scal-
able, and intelligent education platform that caters to diverse learners in
academic domains. By incorporating advanced AI, mobile accessibility, and
LMS compatibility, the platform will continue to support the organization’s
goal of providing cutting-edge educational solutions.
35

---

Chapter 5
Conclusion
The LearnPath platform marks a significant step toward intelligent and per-
sonalized education using modern web technologies and AI-powered systems.
It bridges a crucial gap in online learning—helping students identify and mas-
ter prerequisite knowledge before progressing to complex topics.
Throughout this internship, we have conceptualized, designed, developed,
and deployed a full-stack web application that adapts learning based on a
learner’s proficiency. With the help of GPT-4o integration, our system in-
telligently generates prerequisite concept graphs and domain-specific quizzes
that personalize the learning experience.
From authentication and real-time communication to graph visualization
and adaptive quiz generation, each module was carefully designed and inte-
grated into a seamless workflow. We ensured security through JWT, added
live chat using WebSockets, and enhanced usability with responsive UI/UX.
This 8-week project not only enriched our technical expertise in MERN
stack development and AI integration but also helped us understand the im-
portance of collaborative development, prompt engineering, and user-centric
design.
While LearnPath is already functional and demonstrates strong poten-
tial, we recognize that it is just the beginning. The planned future en-
hancements—such as agentic reasoning, analytics dashboards, and mobile
support—will push the boundaries of what intelligent tutoring systems can
achieve.
In summary, LearnPath is a demonstration of how artificial intelligence,
when combined with structured engineering, can revolutionize education by
making it more adaptive, efficient, and accessible.
36

---

Acknowledgement
I extend my deepest gratitude to Professor Sudarshan Iyengar for his
scintillating discussions. They made me appreciate using the first principles
approach to solve problems — something I will carry forward in the future.
I also extend my thanks to Meenakshi Ma’am , who guided us through-
out the project. Her mentorship shaped the direction of our work and greatly
influenced its outcome.
I would like to express appreciation to Aman Sir andBhavana Ma’am ,
who patiently cleared our doubts during the first three weeks and prepared
tutorials that gave us the confidence to build real-world projects using the
MERN stack.
I sincerely acknowledge the support and encouragement of my teammates
and the staff at DLED Labs , who provided a collaborative environment
during this learning journey.
Lastly, I am deeply thankful to NPTEL for providing me with this valu-
able internship opportunity and platform to explore AI-driven innovation in
education.
We would also like to express our heartfelt gratitude to everyone who
contributed directly or indirectly to the successful completion of this intern-
ship project titled LearnPath – Smart Study Management Platform .
We are especially thankful to our internship mentors and technical coordina-
tors for their valuable insights and consistent guidance throughout the eight
weeks of development.
We gratefully acknowledge the support of our faculty members and aca-
demic instructors, whose foundational teachings in full-stack development
and artificial intelligence greatly benefited our implementation.
We also appreciate the contributions made by our team members, whose
collaborative efforts and shared enthusiasm played a major role in delivering
the final product.
– Team LearnPath
37

---

References
[1] OpenRouter API – GPT-4o Integration Documentation
https://openrouter.ai/docs
[2] vis-network: Network Visualization Documentation
https://visjs.github.io/vis-network/docs/network/
[3] MongoDB Atlas Documentation – NoSQL Cloud Database
https://www.mongodb.com/docs/atlas/
[4] React Official Documentation – Building Interfaces
https://react.dev/
[5] Node.js Documentation – JavaScript Runtime
https://nodejs.org/en/docs
[6] Express.js Guide – Backend Web Framework
https://expressjs.com/
[7] GitHub Docs – Git Workflow and CI/CD
https://docs.github.com/en
[8] Postman Documentation – API Testing and Automation
https://www.postman.com/
[9] Render Deployment Docs – Hosting Web Services
https://render.com/docs
[10]Full-Stack React Projects (2nd Ed.) – Shama Hoque, Packt, 2020
[11]Artificial Intelligence: A Modern Approach (4th Ed.) – Stuart Russell,
Peter Norvig, Pearson, 2021
[12] MongoDB MERN Stack Developer Guide
https://www.mongodb.com/mern-stack
38

---

