const express = require("express");
const app = express();
const port = 3520;
const db = require("./db_config");
const cors = require("cors");

app.use(express.json());
app.use(cors());
// Rota de cadastro
app.post("/user/register", (req, res) => {
    const { name, dateBirth, userName, email, password} = req.body; 
    const sql = `INSERT INTO users (name, dateBirth, userName, email, password) VALUES (?, ?, ?, ?, ?)`;
  
    db.query(sql, [ name, dateBirth, userName, email, password], (err, result) => {
        if (err) {
            console.log(err);
            res.json({ success: false, message: "Erro ao cadastrar usuário." });
        } else {
            const id = result.insertId; // pega o id do morador cadastrado
            res.json({ success: true, message: "Usuário cadastrado com sucesso.", id });
        }
    });
  });

  
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))