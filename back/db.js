
const mysql = require("mysql2/promise");
require("dotenv").config();

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

/* Bancos gerenciados (Aiven, PlanetScale, Railway público) exigem SSL */
if (String(process.env.DB_SSL || "").toLowerCase() === "true") {
  config.ssl = { rejectUnauthorized: false };
}

const db = mysql.createPool(config);

/* Falha clara no boot, em vez de erro solto na primeira requisição */
db.query("SELECT 1")
  .then(() => console.log("Banco conectado."))
  .catch((erro) => {
    console.error("Falha ao conectar no banco:", erro.message);
    console.error(
      "Confira DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME e, se o banco exigir, DB_SSL=true."
    );
  });

module.exports = db;
