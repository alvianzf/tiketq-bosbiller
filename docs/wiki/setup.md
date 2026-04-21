# ⚙️ Getting Started

Follow these steps to set up the TiketQ Bosbiller development environment on your local machine.

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js**: v14.x or higher
- **npm**: v6.x or higher
- **PostgreSQL**: v12 or higher (Running and reachable)
- **Redis** (Optional): Required for caching features to function correctly.

## 📦 Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd tiketq-bosbiller
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Copy the `.env.example` file to `.env` and fill in your credentials.
    ```bash
    cp .env.example .env
    ```

### Required `.env` Variables
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/dbname`) |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens |
| `MIDTRANS_SERVER_KEY` | Your Midtrans Server Key |
| `MIDTRANS_CLIENT_KEY` | Your Midtrans Client Key |
| `REDIS_URL` | (Optional) Redis connection URL |

## 🗄️ Database Setup

1.  **Run Migrations**: Apply the Prisma schema to your local database.
    ```bash
    npx prisma migrate dev --name init
    ```

2.  **Seed the Database**: Populate the database with initial data (e.g., the default admin user).
    ```bash
    # Note: Ensure you have a script or procedure for seeding if not automated
    node db/seeds/seedAdmin.js
    ```

## 🏃‍♂️ Running the Server

### Development Mode
Start the server with standard node:
```bash
npm start
```
The server will run on `http://localhost:3000` by default.

### Accessing Documentation
Once the server is running, you can access the interactive API docs at:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🧪 Verification

To verify your setup:
1.  Check the console for "PostgreSQL connected via Prisma".
2.  Log in via `POST /api/auth/login` using the seeded admin credentials.
3.  Access a protected route (e.g., `GET /api/auth/users`) with the returned token.
