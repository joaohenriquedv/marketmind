require("dotenv").config();
const db = require("./db");

async function migrar() {
 const alteracoes = [
  {
    nome: "negocios.descricao",
    sql: "ALTER TABLE negocios ADD COLUMN descricao TEXT NULL",
  },
  {
    nome: "usuarios.telefone",
    sql: "ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(30) NULL",
  },
  {
    nome: "usuarios.foto",
    sql: "ALTER TABLE usuarios ADD COLUMN foto LONGTEXT NULL",
  },

  {
  nome: "preferencias_usuario",
  sql: "CREATE TABLE IF NOT EXISTS preferencias_usuario (usuario_id BIGINT NOT NULL PRIMARY KEY, dados JSON NOT NULL, atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
},  
];

  for (const a of alteracoes) {
    try {
      await db.query(a.sql);
      console.log(`OK  -> ${a.nome} criada`);
    } catch (erro) {
      if (erro.code === "ER_DUP_FIELDNAME") {
        console.log(`OK  -> ${a.nome} já existia (nada a fazer)`);
      } else {
        console.log(`ERRO -> ${a.nome}: ${erro.message}`);
      }
    }
  }

  console.log("\nMigração concluída.");
  process.exit(0);

  
}

migrar();