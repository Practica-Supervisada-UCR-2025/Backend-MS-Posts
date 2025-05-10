# Backend-MS-Base

[![codecov](https://codecov.io/gh/Practica-Supervisada-UCR-2025/Backend-MS-Base/graph/badge.svg?token=M29OG2XDU6)](https://codecov.io/gh/Practica-Supervisada-UCR-2025/Backend-MS-Base)

## Project Overview

Backend-MS-Base is a foundational backend service built with Node.js and TypeScript. It provides a modular structure for managing features like user authentication, database interactions, and API routing.

## Prerequisites

### Install Node.js

1. Download the MSI installer from [Node.js Downloads](https://nodejs.org/en/download/).

2. Verify the installation by running the following command in the terminal:
   ```
   node -v
   ```
3. Open PowerShell as an administrator and execute:
   ```
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
4. Verify npm installation:
   ```
   npm -v
   ```

### Install TypeScript and Dependencies

Run the following commands:

```
npm install -g typescript ts-node nodemon
npm install express body-parser cookie-parser compression cors
npm install -g @types/express @types/body-parser @types/cookie-parser @types/compression @types/cors
npm install --save-dev @types/supertest jest ts-jest @types/jest
```

### Install PostgreSQL

Run the following command:

```
npm install pg @types/pg dotenv
```

## Folder Structure

- `src/`: Contains the application source code.
  - `features/users/`: Includes controllers, DTOs, middleware, routes, and services for user-related functionality.
- `tests/`: Contains unit and integration tests.
- `docs/`: Documentation files, including the [ER Diagram](docs/ER_Diagram3.md).

## Usage

Currently, the application does not have defined scripts for running the server or tests. Please update the `package.json` file with appropriate commands, such as:

- Start the server: `"start": "npx ts-node src/app"`
- Run tests: `"test": "npx jest"`

## Documentation

Refer to the [ER Diagram](docs/ER_Diagram3.md) for the database schema.

# Post Management API

### Get User Posts

`GET /api/posts/mine`

#### Request

Query Parameters:

```json
{
  "page": 1, // optional, default: 1, must be an integer >= 1
  "limit": 10 // optional, default: 10, must be an integer between 1 and 100
}
```

#### Headers

```http
Authorization: Bearer <jwt-token>    // required, must be a valid JWT token
```

### Expected Status Codes

| Code | Error Type            | Description                                                          |
| ---- | --------------------- | -------------------------------------------------------------------- |
| 200  | Success               | Posts fetched successfully.                                          |
| 400  | Bad Request           | One or more query parameters don't meet the established validations. |
| 401  | Unauthorized          | Invalid or missing JWT token.                                        |
| 500  | Internal Server Error | Unexpected server error (e.g., DB connection error, etc).            |

---

### Example Fetch Request for Get User Posts

Here is an example of how to make a fetch request to the `GET /posts/mine` endpoint:

```javascript
const fetchUserPosts = async () => {
  const token = "your-jwt-token"; // Replace with a valid JWT token
  const page = 1;
  const limit = 10;

  try {
    const response = await fetch(
      "http://localhost:3000/api/posts/mine?page=" + page + "&limit=" + limit,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("User Posts:", data);
  } catch (error) {
    console.error("Failed to fetch user posts:", error);
  }
};

fetchUserPosts();
```

### Example 400 Error (Validation)

```json
{
  "status": 400,
  "message": "Validation Error",
  "details": ["The page must be an integer"]
}
```

### Example 200 Success

**IMPORTANT**:

- The response must be validated with Mobile team.
- The posts data returned (text, file_url,...) has not been validated with Mobile and all Backend Team.

```json
{
  "message": "Posts fetched successfully",
  "posts": [
    {
      "text": "This is the first post",
      "file_url": "https://example.com/file1.jpg",
      "file_type": ".jpg",
      "file_size": 102400,
      "created_at": "2025-05-01T12:00:00Z"
    }
  ],
  "metadata": {
    "totalPosts": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```
