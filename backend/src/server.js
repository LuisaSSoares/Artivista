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

  //Rota PUT para colocar a foto de perfil
  app.put('/user/uploadProfile', upload.single('profileImage'), (req, res) => {
    const userId = req.body.id;  
    const profileImage = req.file.filename; 
    console.log(req);
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
app.put('/user/edit/:id', (req, res) => {
  const {id} = req.params
  const {name, username, password} = req.body
  let query = 'UPDATE users SET name = ?, username = ? WHERE id = ?'
  let values = [name, username, id]

  if(password){
      query = 'UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?'
      values = [name, username, password, id]
  }

  db.query(query, values, (err, result) => {
      if (err) {
          return res.status(500).json ({ success: false, message: 'Erro ao atualizar usuario' })
      }

      db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
          if(err){
              return res.status(500).json({success: false, message: 'Erro ao buscar o usuário'})
          }
          res.json({success: true, message: 'Perfil atualizado com sucesso', user: results[0]})
      })
  })

})

//Rota DELETE para deletar user
app.delete("/user/delete/:id", (req, res) => {
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
  
//Rota POST para cadastrar artistas
app.post('/artist/register', (req, res) => {
  const {service, userId, activityId} = req.body

  if( !service || !userId || activityId){
    return res.status(400).json({
      success: false,
      message: 'Todos os campos são obrigatórios'
    })
  }

  const checkArtist = 'SELECT * FROM users WHERE id = ? AND userType = "artista"'
  db.query(checkArtist, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar usuário.',
        error: err
      });
    }
    const insertArtist = 'INSERT INTO artists (service, userId, activityId) VALUES (?, ?, ?)';
    db.query(insertArtist, [service, userId , activityId], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao cadastrar artista.',
          error: err
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Artista cadastrado com sucesso.',
        artistId: result.insertId
      })
    })
  })
})

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))


