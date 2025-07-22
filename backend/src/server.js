const express = require("express");
const app = express();
const port = 3520;
const db = require("./db_config");
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'senhajwt'
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

//***Artistas e usuários***
// Rota POST de cadastro de usuário
app.post("/user/register", async (req, res) => {
  const { name, userName, email, password } = req.body;

  if (!name || !userName || !email || !password) {
    return res.json({
      success: false,
      message: "Todos os campos são obrigatórios."
    });
  }

  const checkSql = `SELECT * FROM users WHERE email = ? OR userName = ?`;

  db.query(checkSql, [email, userName], async (err, results) => {
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

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `INSERT INTO users (name, userName, email, password) VALUES (?, ?, ?, ?)`;

      db.query(sql, [name, userName, email, hashedPassword], (err, result) => {
        if (err) {
          console.log(err);
          res.json({
            success: false,
            message: "Erro ao cadastrar usuário."
          });
        } else {
          const token = jwt.sign({ id: result.insertId, email, userName }, jwtSecret, { expiresIn: '1h' });

          res.json({
            success: true,
            message: "Usuário cadastrado com sucesso.",
            token,
            user: {
              id: result.insertId,
              name,
              userName,
              email
            }
          });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Erro ao criptografar a senha.' });
    }
  });
});

// Rota POST para logar usuário
app.post('/user/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, informe email e senha!'
    });
  }

  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro no servidor.',
        error: err
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos.'
      });
    }

    const user = results[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, userName: user.userName },
      jwtSecret,
      { expiresIn: '5h' }
    );

    //Login bem-sucedido
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        userName: user.userName,
        email: user.email
      }
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
  const {name, userName, password} = req.body
  let query = 'UPDATE users SET name = ?, userName = ? WHERE id = ?'
  let values = [name, userName, id]

  if(password){
      query = 'UPDATE users SET name = ?, userName = ?, password = ? WHERE id = ?'
      values = [name, userName, password, id]
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
// ** Eventos **
//Rota POST para postar eventos
app.post('/events/create', (req, res) => {
  const { title, dateEvent, time, description, classification, link, artistId } = req.body;

  if (!title || !dateEvent || !time || !description || !classification || !eventType || !artistId) {
    return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `
    INSERT INTO events (title, dateEvent, time, description, classification, eventType, link, artistId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, dateEvent, time, description, classification, eventType, link, artistId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao criar evento.', error: err });
    }

    res.status(201).json({ success: true, message: 'Evento criado com sucesso.', eventId: result.insertId });
  });
});

//Rota GET para listar eventos
app.get('/events', (req, res) => {
  const sql = 'SELECT * FROM events ORDER BY dateEvent ASC';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar eventos.' });
    }

    res.json({ success: true, events: results });
  });
});

//Rota PUT para editar eventos
app.put('/events/edit/:id', (req, res) => {
  const { id } = req.params;
  const { title, dateEvent, time, description, classification, link } = req.body;

  if (!title || !dateEvent || !time || !description || !classification) {
    return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `UPDATE events SET title = ?, dateEvent = ?, time = ?, description = ?, classification = ?, link = ? WHERE id = ?`;

  db.query(sql, [title, dateEvent, time, description, classification, link, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao editar evento.' });

    res.json({ success: true, message: 'Evento atualizado com sucesso.' });
  });
});

//Rota DELETE para remover eventos
app.delete('/events/delete/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM events WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao deletar evento.' });

    res.json({ success: true, message: 'Evento deletado com sucesso.' });
  });
});

// **Cursos**
// Rota POST para criar curso
app.post('/courses/create', (req, res) => {
  const { title, dateCourse, time, description, classification, courseType, participantsLimit, link, artistId } = req.body;

  if (!title || !dateCourse || !time || !description || !classification || !courseType|| !participantsLimit || !link || !artistId) {
    return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `
    INSERT INTO courses (title, dateCourse, time, description, classification, courseType, participantsLimit, link, artistId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, dateCourse, time, description, classification, courseType, participantsLimit, link, artistId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao criar curso.', error: err });
    }

    res.status(201).json({ success: true, message: 'Curso criado com sucesso.', courseId: result.insertId });
  });
});

// Rota GET para listar todos os cursos
app.get('/courses', (req, res) => {
  const sql = 'SELECT * FROM courses ORDER BY dateCourse ASC';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar cursos.' });
    }

    res.json({ success: true, courses: results });
  });
});

// Rota PUT para editar curso
app.put('/courses/edit/:id', (req, res) => {
  const { id } = req.params;
  const { title, dateCourse, time, description, classification, participantsLimit, link } = req.body;

  if (!title || !dateCourse || !time || !description || !classification || !participantsLimit || !link) {
    return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `
    UPDATE courses SET title = ?, dateCourse = ?, time = ?, description = ?, classification = ?, participantsLimit = ?, link = ?
    WHERE id = ?
  `;

  db.query(sql, [title, dateCourse, time, description, classification, participantsLimit, link, id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao editar curso.' });
    }

    res.json({ success: true, message: 'Curso atualizado com sucesso.' });
  });
});

// Rota DELETE para remover curso
app.delete('/courses/delete/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM courses WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao deletar curso.' });
    }

    res.json({ success: true, message: 'Curso deletado com sucesso.' });
  });
});

//** Chat ** // 
//Rota POST para enviar mensagem a um user
app.post('/chat/send', (req, res) => {
  const { message, userId, recipientId } = req.body;

  if (!message || !userId || !recipientId) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
  }

  const sql = `INSERT INTO chat (message, userId, recipientId) VALUES (?, ?, ?)`;

  db.query(sql, [message, userId, recipientId], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao enviar mensagem.', error: err });
    }

    res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso.', chatId: result.insertId });
  });
});

//Rota GET pra recuperar histórico de mensagem
app.get('/chat/:userId/:recipientId', (req, res) => {
  const { userId, recipientId } = req.params;

  const sql = `
    SELECT c.*, u.userName, u.profileImage
    FROM chat c
    JOIN users u ON c.userId = u.id
    WHERE (c.userId = ? AND c.recipientId = ?) OR (c.userId = ? AND c.recipientId = ?)
    ORDER BY c.sendIn ASC
  `;

  db.query(sql, [userId, recipientId, recipientId, userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar mensagens.' });

    res.json({ success: true, messages: results });
  });
});

//Rota PUT pra editar mensagem 
app.put('/chat/edit/:id', (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'A nova mensagem é obrigatória.' });
  }

  const sql = `UPDATE chat SET message = ? WHERE id = ?`;

  db.query(sql, [message, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao editar mensagem.' });

    res.json({ success: true, message: 'Mensagem editada com sucesso.' });
  });
});

//Rota DELETE pra excluir mensagem
app.delete('/chat/delete/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM chat WHERE id = ?`;

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao deletar mensagem.' });

    res.json({ success: true, message: 'Mensagem excluída com sucesso.' });
  });
});

// ** Notificações ** //
//Rota GET para listar notificações
app.get('/notifications/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM notifications WHERE userId = ? ORDER BY sendData DESC';

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar notificações.' });

    res.json({ success: true, notifications: results });
  });
});

// ** Reações de postagem** // 
// ** curtidos ** 
//Rota POST para curtir postagens
app.post('/post/like', (req, res) => {
  const { postId, userId } = req.body;

  const checkSql = 'SELECT * FROM likes WHERE postId = ? AND userId = ?';
  db.query(checkSql, [postId, userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao verificar curtida.' });

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Usuário já curtiu este post.' });
    }

    const insertSql = 'INSERT INTO likes (postId, userId) VALUES (?, ?)';
    db.query(insertSql, [postId, userId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Erro ao curtir o post.' });

      res.json({ success: true, message: 'Post curtido com sucesso.' });
    });
  });
});

//Rota DELETE pra remover post curtido
app.delete('/post/unlike', (req, res) => {
  const { postId, userId } = req.body;

  const sql = 'DELETE FROM likes WHERE postId = ? AND userId = ?';
  db.query(sql, [postId, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao remover curtida.' });

    res.json({ success: true, message: 'Curtida removida com sucesso.' });
  });
});

//Rota GET pra listar posts curtidos pelo usuário
app.get('/user/:id/liked-posts', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT p.*, i.img1, i.img2, i.img3, i.img4, i.img5
    FROM likes l
    JOIN posts p ON l.postId = p.id
    LEFT JOIN imageAndVideo i ON p.id = i.id_post
    WHERE l.userId = ?
    ORDER BY p.id DESC
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar posts curtidos.' });

    const posts = results.map(post => {
      const images = [post.img1, post.img2, post.img3, post.img4, post.img5].filter(Boolean);
      return { ...post, media: images };
    });

    res.json({ success: true, posts });
  });
});

//*favoritos **
//Rota POST pra adicionar uma postagem aos favoritos
app.post('/favorites/add', (req, res) => {
  const { postId, userId } = req.body;

  const checkSql = 'SELECT * FROM favorites WHERE postId = ? AND userId = ?';
  db.query(checkSql, [postId, userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao verificar favorito.' });

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Post já favoritado.' });
    }

    const sql = 'INSERT INTO favorites (postId, userId) VALUES (?, ?)';
    db.query(sql, [postId, userId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Erro ao favoritar o post.' });

      res.json({ success: true, message: 'Post favoritado com sucesso.' });
    });
  });
});

//Rota DELETE pra remover uma postagem dos favoritos
app.delete('/favorites/remove', (req, res) => {
  const { postId, userId } = req.body;

  const sql = 'DELETE FROM favorites WHERE postId = ? AND userId = ?';
  db.query(sql, [postId, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao remover favorito.' });

    res.json({ success: true, message: 'Favorito removido com sucesso.' });
  });
});

//Rota GET pra listar as postagens favoritadas 
app.get('/user/:id/favorites', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT p.*, i.img1, i.img2, i.img3, i.img4, i.img5
    FROM favorites f
    JOIN posts p ON f.postId = p.id
    LEFT JOIN imageAndVideo i ON p.id = i.id_post
    WHERE f.userId = ?
    ORDER BY p.id DESC
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar posts favoritos.' });
    }

    const posts = results.map(post => {
      const media = [post.img1, post.img2, post.img3, post.img4, post.img5].filter(Boolean);
      return {
        id: post.id,
        title: post.title,
        description: post.description,
        artSection: post.artSection,
        artistId: post.artistId,
        media
      };
    });

    res.json({ success: true, posts });
  });
});

//**comentários**
// Rota POST para adicionar um comentário
app.post('/comments/add', (req, res) => {
  const {content, postId, userId} = req.body;

  if (!content || !postId || !userId) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios faltando.' });
  }

  const sql = 'INSERT INTO comments (content, postId, userId) VALUES (?, ?, ?)';
  db.query(sql, [content, postId, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao adicionar comentário.' });

    res.json({ success: true, message: 'Comentário adicionado com sucesso.' });
  });
});

// Rota GET para listar comentários de um post
app.get('/comments/:postId', (req, res) => {
  const { postId } = req.params;

  const sql = `
    SELECT c.*, u.name, u.userName, u.profileImage
    FROM comments c
    JOIN users u ON c.userId = u.id
    WHERE c.postId = ?
    ORDER BY c.sendData DESC
  `;

  db.query(sql, [postId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar comentários.' });

    res.json({ success: true, comments: results });
  });
});

//Rota PUT pra editar o conteúdo do comentário
app.put('/comments/edit/:id', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'O novo conteúdo do comentário é obrigatório.' });
  }

  const sql = `UPDATE comments SET content = ? WHERE id = ?`;

  db.query(sql, [content, id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao editar comentário.' });
    }

    res.json({ success: true, message: 'Comentário editado com sucesso.' });
  });
});

//Rota DELETE pra excluir comentário
app.delete('/comments/delete/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM comments WHERE id = ?`;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao excluir comentário.' });
    }

    res.json({ success: true, message: 'Comentário excluído com sucesso.' });
  });
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))


