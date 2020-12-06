CREATE TABLE IF NOT EXISTS users (
    userName TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cryptoPass TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shows (
    showID INTEGER PRIMARY KEY AUTOINCREMENT,
    showName TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS show_dates (
    showID INTEGER NOT NUll,
    showDate DATE NOT NULL,
    isMatinee BOOLEAN NOT NULL,
    PRIMARY KEY (showID, showDate, isMatinee),
    FOREIGN KEY (showID) REFERENCES shows(showID)
);
