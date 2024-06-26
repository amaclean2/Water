CREATE TABLE users(
    id INT AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    is_premium TINYINT,
    sex ENUM('male', 'female', 'non-binary', 'decline'),
    user_site VARCHAR(100),
    password VARCHAR(255),
    city VARCHAR(100),
    bio TEXT,
    profile_picture_url VARCHAR(255),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    email_opt_out TINYINT DEFAULT 0,
    PRIMARY KEY(id)
);

CREATE TABLE searchable_users(
    user_id INT NOT NULL UNIQUE,
    searchable_text TEXT,
    PRIMARY KEY(user_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE friends(
    follower_id INT,
    leader_id INT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    public TINYINT,
    PRIMARY KEY(follower_id, leader_id),
    FOREIGN KEY(follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(leader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ski_approach(
    id INT AUTO_INCREMENT,
    summit_elevation INT,
    base_elevation INT,
    gear VARCHAR(50),
    trail_path TEXT,
    elevations TEXT,
    exposure INT,
    PRIMARY KEY(id)
);

CREATE TABLE ski(
    id INT AUTO_INCREMENT,
    avg_angle FLOAT,
    max_angle FLOAT,
    aspect VARCHAR(3),
    summit_elevation INT,
    base_elevation INT,
    exposure INT,
    season VARCHAR(100),
    trail_path TEXT,
    elevations TEXT,
    ski_approach_id INT,
    PRIMARY KEY(id),
    FOREIGN KEY(ski_approach_id) REFERENCES ski_approach(id)
);

CREATE TABLE climb(
    id INT AUTO_INCREMENT,
    first_ascent VARCHAR(255),
    pitches INT,
    protection VARCHAR(100),
    approach TEXT,
    climb_type VARCHAR(100),
    light_times VARCHAR(100),
    season VARCHAR(100),
    PRIMARY KEY(id)
);

CREATE TABLE hike(
    id INT AUTO_INCREMENT,
    summit_elevation INT,
    base_elevation INT,
    season VARCHAR(100),
    trail_path TEXT,
    elevations TEXT,
    climb INT,
    descent INT,
    PRIMARY KEY(id)
);

CREATE TABLE bike(
    id INT AUTO_INCREMENT,
    summit_elevation INT,
    base_elevation INT,
    season VARCHAR(100),
    trail_path TEXT,
    elevations TEXT,
    climb INT,
    descent INT,
    PRIMARY KEY(id)
);

CREATE TABLE adventures(
    id INT AUTO_INCREMENT,
    adventure_ski_id INT,
    adventure_hike_id INT,
    adventure_climb_id INT,
    adventure_bike_id INT,
    ski_approach_id INT,
    adventure_name VARCHAR(100) NOT NULL,
    adventure_type ENUM('ski', 'hike', 'climb', 'bike', 'skiApproach'),
    bio TEXT,
    coordinates_lat FLOAT NOT NULL,
    coordinates_lng FLOAT NOT NULL,
    creator_id INT NOT NULL,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    nearest_city VARCHAR(100),
    public TINYINT NOT NULL,
    rating VARCHAR(50),
    difficulty VARCHAR(50),
    parent_id INT,
    PRIMARY KEY(id),
    FOREIGN KEY(creator_id) REFERENCES users(id),
    FOREIGN KEY(adventure_ski_id) REFERENCES ski(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_climb_id) REFERENCES climb(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_hike_id) REFERENCES hike(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_bike_id) REFERENCES bike(id) ON DELETE CASCADE,
    FOREIGN KEY(ski_approach_id) REFERENCES ski_approach(id) ON DELETE CASCADE
);

CREATE TABLE zones(
    id INT AUTO_INCREMENT,
    zone_name VARCHAR(100) NOT NULL,
    adventure_type ENUM('ski', 'hike', 'climb', 'bike', 'skiApproach'),
    bio TEXT,
    approach TEXT,
    coordinates_lat FLOAT NOT NULL,
    coordinates_lng FLOAT NOT NULL,
    creator_id INT NOT NULL,
    parent_id INT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    nearest_city VARCHAR(100),
    public TINYINT NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(creator_id) REFERENCES users(id),
);

CREATE TABLE zone_interactions(
    id INT AUTO_INCREMENT,
    adventure_child_id INT,
    zone_child_id INT,
    interaction_type ENUM('zone', 'adventure'),
    parent_id INT,
    PRIMARY KEY(id),
    FOREIGN KEY(parent_id) REFERENCES zones(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_child_id) REFERENCES adventures(id) ON DELETE CASCADE,
    FOREIGN KEY(zone_child_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE searchable_zones(
    zone_id INT NOT NULL UNIQUE,
    searchable_text TEXT,
    PRIMARY KEY(zone_id),
    FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE device_tokens(
    token VARCHAR(100),
    user_id INT,
    date_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE searchable(
    id INT NOT NULL AUTO_INCREMENT,
    adventure_id INT,
    zone_id INT,
    user_id INT,
    searchable_text TEXT,
    group_type ENUM('adventure', 'zone', 'user'),
    PRIMARY KEY(id),
    FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE CASCADE,
    FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE todo_adventures(
    creator_id INT,
    adventure_id INT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    public TINYINT,
    PRIMARY KEY(creator_id, adventure_id),
    FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
);

CREATE TABLE completed_adventures(
    creator_id INT,
    adventure_id INT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    public TINYINT,
    PRIMARY KEY(creator_id, adventure_id),
    FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
);

CREATE TABLE images(
    url VARCHAR(150),
    creator_id INT,
    adventure_id INT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    public TINYINT,
    PRIMARY KEY(url),
    FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
);

CREATE TABLE conversations(
    id INT AUTO_INCREMENT,
    last_message TEXT,
    conversation_name VARCHAR(255),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE conversation_interactions(
    user_id INT,
    conversation_id INT,
    unread TINYINT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, conversation_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE messages(
    id INT AUTO_INCREMENT,
    conversation_id INT,
    sender_id INT,
    message_body TEXT,
    data_reference VARCHAR(255),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX user_conversation_index ON conversation_interactions (user_id);
CREATE INDEX message_conversation_idex ON messages (conversation_id);
CREATE INDEX image_index ON images (creator_id, adventure_id);
CREATE INDEX adventure_coordinate_index ON adventures (coordinates_lat, coordinates_lng);
CREATE INDEX adventure_search_index ON adventures(adventure_name, nearest_city, creator_id);
CREATE INDEX adventure_type_index ON adventures(adventure_type);

-- DROP TABLE searchable_adventures;
-- DROP TABLE searchable_users;
-- DROP TABLE images;
-- DROP TABLE completed_adventures;
-- DROP TABLE todo_adventures;
-- DROP TABLE adventures;
-- DROP TABLE ski;
-- DROP TABLE climb;
-- DROP TABLE hike;
-- DROP TABLE bike;
-- DROP TABLE ski_approach;
-- DROP TABLE friends;
-- DROP TABLE messages;
-- DROP TABLE conversation_interactions;
-- DROP TABLE conversations;
-- DROP TABLE users;