const express = require("express");
const app = express();
const port = 3520;
const db = require("./db_config");
const cors = require("cors");

app.use(express.json());
app.use(cors());
// Rota POST de cadastro de usuário
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


// Rota POST para logar usuário
app.post('/user/login', (req, res) => {
    const { email, password } = req.body;
  
    // Validação dos campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, informe email e senha!' 
      });
    }
  
    // Consulta para verificar usuário e senha
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  
    db.query(query, [email, password], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro no servidor.',
          error: err
        });
      }
  
      if (results.length === 0) {
        // Usuário não encontrado ou senha incorreta
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos.'
        });
      }
  
      // Login bem-sucedido
      const user = results[0];
      delete user.password; // remover senha da resposta
  
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        user
      });
    });
  });

  //Rota GET para listar usuários 
  
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))