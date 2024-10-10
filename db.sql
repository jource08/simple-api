CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    bio TEXT,
    salt VARCHAR(255),
    sessiontoken VARCHAR(255)
);