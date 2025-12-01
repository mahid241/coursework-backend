# After School Lessons – Full Stack Coursework

This project is a full-stack web application for browsing, searching, and booking after school lessons.  
The frontend is built with Vue.js, and the backend uses Express.js with a MongoDB Atlas database and is deployed on Render.

---

## Links

- [Vue.js App – GitHub Repository](https://github.com/mahid241/coursework-frontend)
- [Vue.js App – Live on GitHub Pages](https://mahid241.github.io/coursework-frontend/)
- [Express.js App – GitHub Repository](https://github.com/mahid241/coursework-backend)
- [Render Express.js App – All Lessons Route](https://coursework-backend-rcvf.onrender.com/lessons)

---

## Backend API (this repository)

This repository contains the Express.js API for the After School Lessons app.

### Main endpoints

- `GET /lessons` – returns all lessons from the MongoDB `lessons` collection.
- `POST /orders` – creates a new order in the `orders` collection.
- `PUT /lessons/:id` – updates a lesson document (for example remaining `spaces`).
- `GET /api/info` – returns basic information about this API.
- `GET /` – simple health check that responds with `OK`.

### Environment variables

Create a `.env` file in the project root with:

- `MONGODB_URI` – MongoDB Atlas connection string for the `courseworkfullstack` database.
- `PORT` (optional) – port for the Express server. Defaults to `3000` if not set.

Example:

