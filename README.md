CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100),
    email NVARCHAR(100) UNIQUE,
    password NVARCHAR(255),
    googleId NVARCHAR(255),
);

CREATE TABLE Categories (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50)
);

CREATE TABLE Expenses (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT FOREIGN KEY REFERENCES Users(id),
    categoryId INT FOREIGN KEY REFERENCES Categories(id),
    title NVARCHAR(150),
    amount DECIMAL(10, 2),
    date DATE,
    description NVARCHAR(150)
);

CREATE TABLE Income (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

INSERT INTO Categories (name) VALUES
('Food & Dining'),
('Transport'),
('Shopping'),
('Entertainment'),
('Medical'),
('Utilities'),
('Subscriptions'),
('Education'),
('Travel'),
('Others');
