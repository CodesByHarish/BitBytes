# Smart Hostel Issue Tracking System (BitBytes)

A full-stack web platform that enables students and hostel/campus authorities to efficiently report, track, and resolve hostel-related issues in a transparent and structured manner.

---

## Features

- Student issue reporting and tracking
- Role-based dashboards (Student, Caretaker, Subadmin, Superadmin)
- Status updates and resolution history
- Lost & Found system
- Leave and outpass management
- Announcements and hostel-block specific news
- Community feed
- Analytics for issue resolution

---

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MongoDB Atlas(Cloud)
- Hosting: Netlify

---

## User Roles & Permissions

### Student
- View announcements
- Report issues and track status
- Lost and found participation
- Hostel block based news
- Leave and outpass requests
- Community feed access

### Super Admin
- Full system control
- View issue resolution analytics
- Approve lost and found items
- Approve leave and outpass requests
- Approve new management accounts
- Change user roles

### Sub Admin
- Approve lost and found items
- Approve leave and outpass requests
- View issue resolution analytics

### Caretaker
- Resolve reported issues
- View resolved issues history

---

## Installation

Clone the repository:
```bash
git clone https://github.com/CodesByHarish/BitBytes.git

Navigate into the project directory:
cd BitBytes


Install dependencies:
npm install


Start the development server:
npm run dev

Create a .env file in the backend folder and add the following:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

---


##ID's used for testing

Student 
harishkkg22@gmail.com    pass-harish@13
tejasmprasanna94@gmail.com  pass-tejas@123

management
harishkumarkg2247@gmail.com   pass-harish@123
rahul1406@gmail.com (caretaker)	 pass-password123
rahul220503@gmail.com(subadmin)  pass-rahul@123	

---

##Live Demo
https://hosteleazy.netlify.app

---

##Author
Harish
GitHub: https://github.com/CodesByHarish