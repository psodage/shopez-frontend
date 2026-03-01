# ShopEZ – Fullstack Auth Setup

ShopEZ is an e‑commerce starter project with a **React** frontend and a **Node.js/Express/MongoDB** backend. This guide explains how to run the project using **MongoDB Atlas** instead of a local MongoDB instance.

---

## 1. Tech Stack

- **Frontend**: React (Create React App), React Router, Redux Toolkit, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB (via MongoDB Atlas), Mongoose
- **Auth**: bcryptjs (password hashing), jsonwebtoken (JWT), custom auth middleware

Folder layout (simplified):

- `src/` – React frontend
- `server/` – Node/Express backend
  - `src/server.js` – Express entry
  - `models/User.js` – Mongoose User model
  - `controllers/authController.js` – register/login logic
  - `routes/authRoutes.js` – `/api/auth/*` routes
  - `middleware/authMiddleware.js` – JWT auth guard
  - `middleware/errorMiddleware.js` – error handling
  - `.env.example` – backend environment template

---

## 2. Prerequisites

- **Node.js** (LTS recommended) + **npm**
- A **MongoDB Atlas** account and cluster

---

## 3. Configure MongoDB Atlas

1. Log into **MongoDB Atlas** and create a free cluster if you don’t already have one.
2. Create a **database user** with username and password.
3. Under **Network Access**, allow your development IP or `0.0.0.0/0` (for development only).
4. Go to **Connect → Drivers** and copy the **connection string** that looks like:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

5. Update it to point to the `shopez` database, for example:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/shopez?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## 4. Backend Setup (`server/`)

1. Open a terminal in the project root and install backend dependencies (already done if you see `node_modules` inside `server/`):

   ```bash
   cd server
   npm install
   ```

2. Create the backend `.env` file from the example:

   ```bash
   cd server
   cp .env.example .env   # On Windows PowerShell: copy .env.example .env
   ```

3. Edit `server/.env` and set:

   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/shopez?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_super_strong_secret_here
   JWT_EXPIRES_IN=1h
   ```

   - `MONGO_URI` **must** be your MongoDB Atlas connection string.
   - `JWT_SECRET` should be a long, random string.

4. Start the backend in development mode:

   ```bash
   cd server
   npm run dev
   ```

   The API will run at `http://localhost:5000` by default.

   Notes for Windows:
   - The backend scripts use `cross-env`, so `npm run dev` works in PowerShell/CMD.

---

## 5. Frontend Setup (`src/`)

1. From the project root, install frontend dependencies if you haven’t already:

   ```bash
   npm install
   ```

2. (Optional but recommended) Create a React environment file to point Axios at the backend:

   - Create `./.env` in the project root with:

     ```env
     REACT_APP_API_BASE_URL=http://localhost:5000/api
     ```

   - If this is not set, the frontend defaults to `http://localhost:5000/api` anyway.

3. Start the React development server:

   ```bash
   npm start
   ```

   The frontend will run at `http://localhost:3000` by default.

---

## 6. Auth API Endpoints

Backend (Express) routes under `http://localhost:5000/api/auth`:

- **POST `/api/auth/register`**
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }`
  - Responses:
    - `201 Created` – successful registration
    - `400 Bad Request` – validation error
    - `409 Conflict` – email already registered

- **POST `/api/auth/login`**
  - Body: `{ "email": "john@example.com", "password": "secret123" }`
  - Responses:
    - `200 OK` – returns `{ token, user, message }`
    - `400 Bad Request` – missing inputs
    - `401 Unauthorized` – invalid credentials

- **GET `/api/auth/me`** (protected)
  - Requires header: `Authorization: Bearer <JWT_TOKEN>`
  - Response:
    - `200 OK` – current authenticated user
    - `401 Unauthorized` – missing/invalid token

The React frontend uses Axios (with an interceptor) to attach the JWT from `localStorage` to protected requests.

---

## 7. Running Everything Together

In two terminals from the project root:

1. **Backend**:

   ```bash
   cd server
   npm run dev
   ```

2. **Frontend**:

   ```bash
   npm start
   ```

You can now open `http://localhost:3000`, use the **Register** and **Login** pages, and the app will persist users in **MongoDB Atlas** instead of a local MongoDB instance.

---

## 8. Production Notes

- Use a stronger `JWT_SECRET` and rotate it periodically.
- Restrict MongoDB Atlas network access to trusted IPs or your hosting provider.
- Do **not** commit real `.env` files or secrets to version control.
- Configure `REACT_APP_API_BASE_URL` to point to your deployed backend URL when deploying the frontend.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
