const express = require("express");
const app = express();
const port = 3520;
const db = require("./db_config");
const cors = require("cors");
const multer = require('multer')

app.use(express.json());
app.use(cors());
app.use("/uploads/profile", express.static("src/profile"));
app.use("/uploads/feed", express.static("src/feed"));

// Storage para foto de perfil
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./src/profile"),
  filename: (req, file, cb) => {
    const fileName = file.originalname.replace(/\s+/g, "_") + "_" + Date.now();
    cb(null, fileName);
  },
});

// Storage para imagens do feed
const storageFeed = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./src/feed"),
  filename: (req, file, cb) => {
    const fileName = file.originalname.replace(/\s+/g, "_") + "_" + Date.now();
    cb(null, fileName);
  },
});

// Configurar o multer para cada tipo de upload
const uploadProfile = multer({ storage: storageProfile });
const uploadFeed = multer({ storage: storageFeed });

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

//***Artistas e usuários***

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
  app.put('/user/uploadProfile', uploadProfile.single('profileImage'), (req, res) => {
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

  // Primeiro apaga artistas relacionados
  const deleteArtists = `DELETE FROM artists WHERE userId = ?`;
  db.query(deleteArtists, [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Erro ao remover artistas relacionados." });
    }

    // Depois apaga o usuário
    const deleteUser = `DELETE FROM users WHERE id = ?`;
    db.query(deleteUser, [id], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: "Erro ao excluir o usuário." });
      }

      res.json({ success: true, message: "Usuário e artistas relacionados excluídos com sucesso." });
    });
  });
});
  
//Rota POST para cadastrar artistas
app.post('/artist/register', (req, res) => {
  const { service, userId, activityId } = req.body;

  if (!service || !userId || !activityId) {
    return res.status(400).json({
      success: false,
      message: 'Todos os campos são obrigatórios.'
    });
  }

  // Verifica se o usuário existe
  const checkUserSql = 'SELECT * FROM users WHERE id = ?';
  db.query(checkUserSql, [userId], (err, users) => {
    if (err || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    // Atualiza userType para 'artista', se ainda não for
    const updateUserType = 'UPDATE users SET userType = "artista" WHERE id = ?';
    db.query(updateUserType, [userId], (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar tipo de usuário.',
          error: err
        });
      }

      // Insere o artista na tabela artists
      const insertArtist = 'INSERT INTO artists (service, userId, activityId) VALUES (?, ?, ?)';
      db.query(insertArtist, [service, userId, activityId], (err, result) => {
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
        });
      });
    });
  });
});

//***Postagens***

//Rota POST para postar fotos e videos
app.post('/feed/upload', uploadFeed.array('media', 5), (req, res) => {
  const { title, description, artSection, artistId } = req.body;
  console.log(req.body);

  if (!title || !artistId) {
    return res.status(400).json({ success: false, message: 'Título e artistId são obrigatórios.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
  }

  // Insere os dados do post na tabela posts
  const sqlPost = `INSERT INTO posts (title, description, artSection, artistId) VALUES (?, ?, ?, ?)`;

  db.query(sqlPost, [title, description, artSection, artistId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao criar post.' });
    }

    const postId = result.insertId;

    // Prepara os nomes dos arquivos para a tabela imageAndVideo (máx 5)
    const files = req.files.slice(0, 5); // garante no máximo 5
    const images = [null, null, null, null, null];

    files.forEach((file, i) => {
      images[i] = file.filename;
    });

    const sqlImages = `INSERT INTO imageAndVideo (id_post, img1, img2, img3, img4, img5) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sqlImages, [postId, ...images], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Erro ao salvar as mídias do post.' });
      }

      res.status(201).json({ success: true, message: 'Post criado com sucesso.', postId });
    });
  });
});

//Rota GET para listar as fotos postados 
app.get('/feed/list', (req, res) => {
  const sql = `
    SELECT 
      p.id, p.title, p.description, p.artSection, p.artistId,
      i.img1, i.img2, i.img3, i.img4, i.img5
    FROM posts p
    LEFT JOIN imageAndVideo i ON p.id = i.id_post
    ORDER BY p.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar posts.' });
    }

    // Transformar colunas img1...img5 em array de imagens, removendo nulos
    const posts = results.map(row => {
      const images = [row.img1, row.img2, row.img3, row.img4, row.img5].filter(Boolean);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        artSection: row.artSection,
        artistId: row.artistId,
        media: images
      };
    });

    res.json({ success: true, posts });
  });
});

//Rota PUT para edição de postagens
app.put('/feed/edit/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, artSection } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'O título é obrigatório.' });
  }

  const sql = `UPDATE posts SET title = ?, description = ?, artSection = ? WHERE id = ?`;

  db.query(sql, [title, description, artSection, id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao editar o post.' });
    }

    res.json({ success: true, message: 'Post atualizado com sucesso.' });
  });
});


//Rota DELETE para exclusão de postagens
app.delete('/feed/delete/:id', (req, res) => {
  const { id } = req.params;

  // Primeiro, deleta as mídias relacionadas
  const deleteMedia = `DELETE FROM imageAndVideo WHERE id_post = ?`;
  db.query(deleteMedia, [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao remover as mídias do post.' });
    }

    // Depois, deleta o post
    const deletePost = `DELETE FROM posts WHERE id = ?`;
    db.query(deletePost, [id], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Erro ao excluir o post.' });
      }

      res.json({ success: true, message: 'Post excluído com sucesso.' });
    });
  });
});

// ** Eventos e Cursos** // 
//Usar [] aqui pra recuperar preview de imgs em links especificos 

//** Chat ** // 

// ** Seguidores ** //

// ** Notificações ** //

//Rota GET para listar notificações

// ** Reações de postagem** // 


app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))


