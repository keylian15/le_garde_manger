
CREATE USER 'admin1'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON garde_manger.* TO 'admin1'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    calories INT,
    type ENUM('aliment', 'plat','dessert','boisson','hippo') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password)
VALUES ('admin@example.com', '1234');


INSERT INTO foods (name, description, calories, type) VALUES
-- 🥦 ALIMENTS DE LA PLANETE
('Pomme', 'Fruit frais et croquant', 52, 'aliment'),
('Banane', 'Fruit riche en potassium', 89, 'aliment'),
('Carotte', 'Légume croquant riche en vitamine A', 41, 'aliment'),
('Riz blanc', 'Riz cuit nature', 130, 'aliment'),
('Poulet cru', 'Blanc de poulet sans assaisonnement', 120, 'aliment'),
('Fromage', 'Fromage à pâte dure', 350, 'aliment'),

-- 🍝 PLATS
('Spaghetti bolognaise', 'Pâtes avec sauce tomate et viande', 550, 'plat'),
('Poulet rôti', 'Poulet rôti au four', 600, 'plat'),
('Riz cantonais', 'Riz sauté avec œufs et légumes', 500, 'plat'),
('Lasagnes', 'Lasagnes à la viande et fromage', 650, 'plat'),
('Salade composée', 'Salade avec légumes variés', 250, 'plat'),

-- 🍰 DESSERTS TRES BON
('Tarte aux pommes', 'Dessert sucré aux pommes', 320, 'dessert'),
('Brownie', 'Gâteau au chocolat dense', 450, 'dessert'),
('Crème brûlée', 'Crème vanillée caramélisée', 300, 'dessert'),
('Glace vanille', 'Glace parfum vanille', 210, 'dessert'),
('Donut', 'Beignet sucré glacé', 390, 'dessert'),

-- 🥤 BOISSONS
('Eau', 'Eau plate', 0, 'boisson'),
('Jus d’orange', 'Jus d’orange pressé', 45, 'boisson'),
('Soda', 'Boisson gazeuse sucrée', 140, 'boisson'),
('Café', 'Café noir sans sucre', 5, 'boisson'),
('Thé sucré', 'Thé avec sucre ajouté', 60, 'boisson'),

-- 🦛 HIPPO (MALBOUFFE)
('Burger double steak', 'Burger avec double steak et fromage', 950, 'hippo'),
('Frites', 'Frites croustillantes', 430, 'hippo'),
('Pizza pepperoni', 'Pizza grasse au pepperoni', 900, 'hippo'),
('Hot-dog', 'Saucisse et pain avec sauces', 480, 'hippo'),
('Tacos 3 viandes', 'Tacos bien gras fromage-sauce', 1100, 'hippo'),
('Kebab', 'Sandwich kebab sauce blanche', 980, 'hippo'),
('Nuggets', 'Nuggets de poulet frits', 520, 'hippo'),
('Milkshake chocolat', 'Milkshake très sucré', 650, 'hippo'),
('Chips', 'Chips industrielles', 540, 'hippo'),
('Soda XXL', 'Boisson ultra sucrée format géant', 300, 'hippo'),
('Burger bacon', 'Burger avec bacon et cheddar', 870, 'hippo'),
('Frites fromage', 'Frites avec sauce fromage', 700, 'hippo'),
('Pizza 4 fromages', 'Pizza très riche en fromage', 1000, 'hippo'),
('Croque-monsieur', 'Pain, jambon et fromage grillé', 600, 'hippo'),
('Pain au chocolat', 'Viennoiserie très beurrée', 420, 'hippo');

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);
