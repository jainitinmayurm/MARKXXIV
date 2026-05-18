CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    room_id INT REFERENCES rooms(id), 
    start_time TIMESTAMP WITH TIME ZONE NOT NULL, 
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled' 
);

CREATE TABLE meeting_participants (
    meeting_id INT REFERENCES meetings(id),
    user_id INT REFERENCES users(id),
    PRIMARY KEY (meeting_id, user_id)
);






ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL;