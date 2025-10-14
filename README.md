# eLearning Camp API

Backend API for the eLearning Camp platform, built with Node.js, Express, and MongoDB.

## Table of Contents

- [About The Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Running the Server](#running-the-server)
  - [Seeding the Database](#seeding-the-database)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## About The Project

This project serves as the backend for an e-learning platform. It provides a RESTful API to manage communities, courses, users, reviews, and authentication.

### Built With

* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/)

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

* [Node.js](https://nodejs.org/en/download/)
* [MongoDB](https://www.mongodb.com/try/download/community)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/alef-garrido/elearning-camp-backend.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Create a `config/config.env` file. You can use `config.env.env` as a template. Add your environment variables (e.g., `MONGO_URI`, `JWT_SECRET`).

## Usage

### Running the Server

To run the server in development mode with watching:

```sh
npm run dev
```

To run the server in production mode:

```sh
npm run start
```

### Seeding the Database

You can seed the database with some initial data using the `seeder.js` script.

To import data:

```sh
node seeder -i
```

To delete data:

```sh
node seeder -d
```

## API Endpoints

The API version 1 is available under the `/api/v1` prefix.

*   **Authentication:** `/api/v1/auth`
*   **Communities:** `/api/v1/communities`
*   **Courses:** `/api/v1/courses`
*   **Users:** `/api/v1/users`
*   **Reviews:** `/api/v1/reviews`

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m '''Add some AmazingFeature'''`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgements

*   [Brad Traversy](https://github.com/bradtraversy) for the course this project was based on.