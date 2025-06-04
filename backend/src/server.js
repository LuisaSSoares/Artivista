const express = require("express");
const app = express();
const port = 3520;
const db = require("./db_config");
const cors = require("cors");
const multer = require('multer')

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("src/profile"))

// Configurando o multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/profile");
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.replace(/\s+/g, "_") + "_" + Date.now();
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// Rota POST de cadastro de usuário
app.post("/user/register", (req, res) => {
    const { name, userName, email, password} = req.body; 
    if (!name || !userName || !email || !password) {
      return res.json({ 
        success: false, 
        message: "Todos os campos são obrigatórios." 
      });
  }

    const checkSql = `SELECT * FROM users WHERE email = ? OR userName = ?`;

    db.query(checkSql, [email, userName], (err, results) => {
      if (err) {
        console.log(err);
        return res.json({
          success: false, 
          message: "Erro ao verificar usuário." 
        });
      }
  
      if (results.length > 0) {
        return res.json({ 
          success: false, 
          message: "Email ou nome de usuário já cadastrados. Tente novamente ou faça o login" 
        });
      }
    const sql = `INSERT INTO users (name, userName, email, password) VALUES (?, ?, ?, ?)`;
  
    db.query(sql, [ name, userName, email, password], (err, result) => {
        if (err) {
            console.log(err);
            res.json({ 
              success: false, 
              message: "Erro ao cadastrar usuário." });
        } else {
            const id = result.insertId; // pega o id do morador cadastrado
            res.json({ success: 
              true, 
              message: "Usuário cadastrado com sucesso.", 
              id });
        }
    });
  });
})


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
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        user
      });
    });
  });

  //Rota POST para colocar a foto de perfil
  app.post('/user/uploadProfile', upload.single('profileImage'), (req, res) => {
    const userId = req.body.userId;  
    const profileImage = req.file.filename; 

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
    }

    const sql = `UPDATE users SET profileImage = ? WHERE id = ?`;

    db.query(sql, [profileImage, userId], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar foto de perfil:", err);
            return res.status(500).json({ 
              success: false, 
              message: "Erro ao atualizar foto de perfil." 
            });
        }

        return res.json({ 
          success: true, 
          message: "Foto de perfil atualizada com sucesso.", 
          profileImage 
        });
    });
});

// Rota GET para listar os users
app.get("/users/list", (req, res) => {
  const sql = "SELECT * FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      res.json({ 
        success: false, 
        message: "Erro ao listar os usuários." });
    } else {
      res.json({ 
        success: true, 
        data: result });
    }
  });
});

//Rota PUT pra atualizar o perfil
app.put('/user/updateProfile/:id', upload.single('profileImage'), (req, res) => {
  const id = req.params.id;
  const { name, userName } = req.body;

  if (!id || !name || !userName) {
    return res.status(400).json({ success: false, message: 'ID, name e userName são obrigatórios.' });
  }

  const profileImage = req.file ? req.file.filename : null;

  let sql, params;

  if (profileImage) {
    sql = `UPDATE users SET name = ?, userName = ?, profileImage = ? WHERE id = ?`;
    params = [name, userName, profileImage, id];
  } else {
    sql = `UPDATE users SET name = ?, userName = ? WHERE id = ?`;
    params = [name, userName, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Erro ao atualizar perfil:', err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar perfil.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    res.json({ success: true, message: 'Perfil atualizado com sucesso.' });
  });
});

//Rota DELETE paradeletar user
app.delete("/users/delete/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM users WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      res.json({ success: false, message: "Erro ao excluir o usuário." });
    } else {
      res.json({ success: true, message: "Usuário excluído com sucesso." });
    }
  });
});
  
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))