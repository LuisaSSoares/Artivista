const express = require("express");
const app = express();
const port = 3520;
const db = require("./db_config");
const cors = require("cors");
const bcrypt = require('bcrypt');
const saltRounds = 10; 
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'senhajwt'
const multer = require('multer')
const { encrypt, decrypt } = require('./cryptoHelper');

app.use(express.json());
app.use(cors());


const staticOptions = {
  maxAge: 3600000, // 1h de cache
  setHeaders: (res, filePath, stat) => {
    if (stat.isDirectory()) return;

    // Streaming parcial (permite range requests)
    res.setHeader("Accept-Ranges", "bytes");

    // 🔹 Permite acesso cruzado (necessário pro <video> funcionar)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    // 🔹 Cache (opcional)
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
};

app.use("/uploads/profile", express.static("src/profile", staticOptions));
app.use("/uploads/feed", express.static("src/feed", staticOptions));

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido ou expirado.' });
    }
    req.user = decoded;
    next();
  });
}

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
// Rota POST para Login Social (Google)
app.post("/auth/social-login", (req, res) => {
  const { email, name, firebaseUid } = req.body;
  
  if (!email) {
      return res.status(400).json({ success: false, message: "Email é obrigatório." });
  }

  // 1. Verificar se o usuário já existe na tabela 'users'
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
          console.error('Erro na consulta do DB (Social Login):', err);
          return res.status(500).json({ success: false, message: "Erro interno do servidor." });
      }

      let user;
      let userId;

      if (results.length > 0) {
          // Usuário existente: Apenas loga
          user = results[0];
          
      } else {
          // 2. Novo usuário: Cadastrar
          try {
              // Prepara uma senha aleatória criptografada (para satisfazer a coluna NOT NULL do DB)
              const randomPassword = Math.random().toString(36).substring(2, 15);
              // NOTA: Certifique-se de que `saltRounds` e `bcrypt` estão definidos no server.js
              const hashedPassword = await bcrypt.hash(randomPassword, saltRounds); 

              // Usa a primeira parte do email como userName padrão
              const defaultUserName = email.split('@')[0]; 
              
              const insertSql = 'INSERT INTO users (name, userName, email, password, userType) VALUES (?, ?, ?, ?, ?)';
              
              const insertResult = await new Promise((resolve, reject) => {
                  db.query(insertSql, [name, defaultUserName, email, hashedPassword, 'padrão'], (err, result) => {
                      if (err) reject(err);
                      resolve(result);
                  });
              });

              userId = insertResult.insertId;
              
              // Busca os dados do novo usuário
              const fetchSql = 'SELECT * FROM users WHERE id = ?';
              const fetchedUser = await new Promise((resolve, reject) => {
                  db.query(fetchSql, [userId], (err, rows) => {
                      if (err) reject(err);
                      resolve(rows[0]);
                  });
              });
              
              user = fetchedUser;

          } catch (insertError) {
              console.error('Erro ao cadastrar novo usuário (Social Login):', insertError);
              return res.status(500).json({ success: false, message: "Erro ao cadastrar novo usuário." });
          }
      }

      // 3. Gerar JWT e retornar sucesso
      if (user) {
          const userForToken = { 
              id: user.id, 
              email: user.email, 
              userType: user.userType 
          };
          
          // NOTA: Certifique-se de que `jwt` e `jwtSecret` estão definidos no server.js
          const token = jwt.sign(userForToken, jwtSecret, { expiresIn: '1d' });
          
          delete user.password;
          return res.json({ success: true, message: "Login social bem-sucedido.", user, token });
      }
      
      return res.status(500).json({ success: false, message: "Erro desconhecido durante o login social." });
  });
});

// Rota POST de cadastro de usuário
app.post("/user/register", async (req, res) => {
  const { name, userName, email, password, userType} = req.body;

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
      const emailExiste = results.some(user => user.email === email);
      const usernameExiste = results.some(user => user.userName === userName);

      if (emailExiste) {
        return res.json({
          success: false,
          message: "Este email já está cadastrado. Tente novamente ou faça o login"
        });
      }

      if (usernameExiste) {
        return res.json({
          success: false,
          message: "Este nome de usuário já existe. Tente novamente"
        });
      }

      return res.json({
        success: false,
        message: "Email ou nome de usuário já cadastrados. Tente novamente ou faça o login"
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `INSERT INTO users (name, userName, email, password, userType) VALUES (?, ?, ?, ?, ?)`;

      db.query(sql, [name, userName, email, hashedPassword, userType], (err, result) => {
        if (err) {
          console.log(err);
          res.json({
            success: false,
            message: "Erro ao cadastrar usuário."
          });
        } else {
          const token = jwt.sign({ id: result.insertId, email, userName }, jwtSecret, { expiresIn: '5h' });

          res.json({
            success: true,
            message: "Usuário cadastrado com sucesso.",
            token,
            user: {
              id: result.insertId,
              name,
              userName,
              email,
              userType
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
        email: user.email,
        userType: user.userType,
        bio: user.bio,
        profileImage: user.profileImage,
        historia_arte: user.historia_arte
      }
    });
  });
});

  //Rota PUT para colocar a foto de perfil
  app.put('/user/uploadProfile', uploadProfile.single('profileImage'), (req, res) => {
    const userId = req.body.id;  
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
  app.put('/user/edit/:id', async (req, res) => {
    const {id} = req.params
    const {name, userName, password, bio, historia_arte} = req.body
    let query = 'UPDATE users SET name = ?, userName = ?, bio = ?, historia_arte = ? WHERE id = ?'
    let values = [name, userName, bio, historia_arte, id]
    
    if(password){
      const [userRows] = await db.promise().query('SELECT password FROM users WHERE id = ?', [id]);
      const currentHashedPassword = userRows[0]?.password;
      
      // Se a nova senha foi fornecida e é igual à senha atual, retorna um erro
      if (currentHashedPassword && (await bcrypt.compare(password, currentHashedPassword))) {
          return res.status(400).json({ success: false, message: 'A nova senha não pode ser igual à senha atual.' });
      } 
      const hashedPassword = await bcrypt.hash(password, saltRounds)
        query = 'UPDATE users SET name = ?, userName = ?, password = ?, bio = ?, historia_arte = ?  WHERE id = ?'
        values = [name, userName, hashedPassword, bio, historia_arte, id]
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
app.delete("/user/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Busca o ID do artista (artists.id)
    const [artistRows] = await db.promise().query("SELECT id FROM artists WHERE userId = ?", [id]);
    const artistId = artistRows[0]?.id;

    if (artistId) {
      // 2️⃣ Apaga dependências de posts
      await db.promise().query("DELETE FROM imageAndVideo WHERE id_post IN (SELECT id FROM posts WHERE artistId = ?)", [artistId]);
      await db.promise().query("DELETE FROM likes WHERE postId IN (SELECT id FROM posts WHERE artistId = ?)", [artistId]);
      await db.promise().query("DELETE FROM favorites WHERE postId IN (SELECT id FROM posts WHERE artistId = ?)", [artistId]);
      await db.promise().query("DELETE FROM comments WHERE postId IN (SELECT id FROM posts WHERE artistId = ?)", [artistId]);
      await db.promise().query("DELETE FROM posts WHERE artistId = ?", [artistId]);

      // 3️⃣ Apaga eventos e cursos ligados ao artista
      await db.promise().query("DELETE FROM events WHERE artistId = ?", [artistId]);
      await db.promise().query("DELETE FROM courses WHERE artistId = ?", [artistId]);

      // 4️⃣ Apaga o artista
      await db.promise().query("DELETE FROM artists WHERE id = ?", [artistId]);
    }

    // 5️⃣ Apaga o usuário
    await db.promise().query("DELETE FROM users WHERE id = ?", [id]);

    res.json({ success: true, message: "Usuário e todos os dados relacionados foram excluídos com sucesso." });
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
    res.status(500).json({ success: false, message: "Erro interno ao excluir usuário.", error: err.message });
  }
});

// A Rota deve estar ASSÍNCRONA apenas para usar o 'jwt.sign' (não é estritamente necessário)
app.post('/artist/register', verificarToken, (req, res) => {
  const { service, phone, userId, activity1, activity2, links } = req.body;
  // O userId deve ser extraído do token (req.user.id) por segurança, mas usaremos o que veio do body para manter o fluxo
  
  // Links para a query de INSERT
  const link1 = links[0] || null;
  const link2 = links[1] || null;
  const link3 = links[2] || null;

  // 1. INSERIR dados na tabela 'artists'
  const insertArtistSql = `
      INSERT INTO artists (service, phone, userId, activity1, activity2, link1, link2, link3)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const insertArtistValues = [service, phone, userId, activity1, activity2, link1, link2, link3];

  // ** ⚠️ AQUI ESTÁ A CHAVE: O DB.QUERY É ANINHADO E SEQUENCIAL ⚠️ **
  db.query(insertArtistSql, insertArtistValues, (err, artistResult) => {
      if (err) {
          console.error('Erro ao inserir artista:', err);
          // Impede o erro 500 do crash do servidor, retorna mensagem de erro do banco
          return res.status(500).json({ success: false, message: 'Erro ao cadastrar artista (INSERT).' });
      }

      // 2. ATUALIZAR userType na tabela 'users'
      const updateUserSql = 'UPDATE users SET userType = "artista" WHERE id = ?';
      db.query(updateUserSql, [userId], (err2, updateResult) => {
          if (err2) {
              console.error('Erro ao atualizar userType:', err2);
              return res.status(500).json({ success: false, message: 'Erro ao cadastrar artista (UPDATE).' });
          }

          // 3. RECUPERAR dados do usuário atualizado
          const getUserSql = 'SELECT id, name, userName, email, userType, bio, historia_arte, profileImage FROM users WHERE id = ?';
          db.query(getUserSql, [userId], (err3, userResults) => {
              if (err3) {
                  console.error('Erro ao buscar usuário atualizado:', err3);
                  return res.status(500).json({ success: false, message: 'Erro ao buscar dados do usuário.' });
              }

              if (userResults.length === 0) {
                  return res.status(404).json({ success: false, message: 'Usuário não encontrado após atualização.' });
              }

              const userUpdated = userResults[0];

              // 4. GERAR NOVO TOKEN com o userType="artista" (Resolve o Erro de Token na próxima requisição)
              const newToken = jwt.sign(
                  { id: userUpdated.id, userType: userUpdated.userType },
                  jwtSecret,
                  { expiresIn: '1h' }
              );

              // Retorno de Sucesso
              return res.status(200).json({
                  success: true,
                  token: newToken,
                  user: userUpdated
              });
          }); 
      }); 
  }); 
}); 

// Rota PUT para atualizar numero de telefone e links
app.put('/artist/updateConfig/:userId', (req, res) => {
  const { userId } = req.params;
  const { links = [], phone = null, service = "não" } = req.body;

  if (!Array.isArray(links) || links.length > 3) {
    return res.status(400).json({
      success: false,
      message: 'Links deve ser um array com até 3 URLs.'
    });
  }

  const [link1, link2, link3] = links.concat([null, null, null]);

  const sql = `
    UPDATE artists 
    SET phone = ?, link1 = ?, link2 = ?, link3 = ?, service = ?
    WHERE userId = ?
  `;

  db.query(sql, [phone, link1, link2, link3, service, userId], (err) => {
    if (err) {
      console.error("Erro ao atualizar configurações do artista:", err);
      return res.status(500).json({ success: false, message: "Erro ao atualizar configurações do artista." });
    }

    res.json({ success: true, message: "Configurações atualizadas com sucesso." });
  });
});

// ✅ Rota GET perfil simples (atualizada com telefone)
app.get('/profile/:id', (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      u.id, 
      u.name, 
      u.userName, 
      u.email, 
      u.userType, 
      u.bio, 
      u.historia_arte, 
      u.profileImage,
      a.service, 
      a.phone,          -- ✅ novo campo adicionado
      a.activity1, 
      a.activity2, 
      a.link1, 
      a.link2, 
      a.link3
    FROM users u
    LEFT JOIN artists a ON a.userId = u.id
    WHERE u.id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar perfil:', err);
      return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const perfil = results[0];

    // ✅ se o artista não vende serviço, o telefone não é retornado
    if (perfil.service !== 'sim') {
      delete perfil.phone;
    }

    res.json({ success: true, data: perfil });
  });
});


// Rota GET para listar os artistas que vendem serviços (com filtro opcional)
app.get("/artists/list", (req, res) => {
  const { excludeUserId } = req.query;

  let sql = `
    SELECT
      u.id,
      u.name,
      u.userName,
      u.bio,
      u.profileImage,
      a.activity1,
      a.activity2
    FROM users AS u
    INNER JOIN artists AS a ON u.id = a.userId
    WHERE u.userType = 'artista' AND a.service = 'sim'
  `;
  const params = [];

  if (excludeUserId) {
    sql += " AND u.id != ?";
    params.push(excludeUserId);
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Erro ao listar os artistas:", err);
      return res.status(500).json({
        success: false,
        message: "Erro ao listar os artistas."
      });
    }

    res.json({
      success: true,
      data: result
    });
  });
});
//***Postagens***
//Rota POST para postar fotos e videos
app.post('/feed/upload', uploadFeed.array('media', 5), (req, res) => {
  const { title, description, artSection, artistId } = req.body;
  console.log(req.body);

  // Verificações básicas
  if (!title || !artistId) {
    return res.status(400).json({ success: false, message: 'Título e artistId são obrigatórios.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
  }

  // Corrige o artistId para o da tabela artists (relacionado ao userId)
  const sqlFindArtist = 'SELECT id FROM artists WHERE userId = ?';
  db.query(sqlFindArtist, [artistId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar artista:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar artista.' });
    }

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: 'Perfil de artista não encontrado.' });
    }

    const realArtistId = result[0].id;

    // Insere os dados do post na tabela posts
    const sqlPost = `INSERT INTO posts (title, description, artSection, artistId) VALUES (?, ?, ?, ?)`;
    db.query(sqlPost, [title, description, artSection, realArtistId], (errPost, resultPost) => {
      if (errPost) {
        console.error('Erro ao criar post:', errPost);
        return res.status(500).json({ success: false, message: 'Erro ao criar post.' });
      }

      const postId = resultPost.insertId;

      // Prepara as mídias (máx. 5 arquivos)
      const files = req.files.slice(0, 5);
      const images = [null, null, null, null, null];
      files.forEach((file, i) => { images[i] = file.filename; });

      const sqlImages = `INSERT INTO imageAndVideo (id_post, img1, img2, img3, img4, img5) VALUES (?, ?, ?, ?, ?, ?)`;
      db.query(sqlImages, [postId, ...images], (errImgs) => {
        if (errImgs) {
          console.error('Erro ao salvar mídias:', errImgs);
          return res.status(500).json({ success: false, message: 'Erro ao salvar as mídias do post.' });
        }

        res.status(201).json({ success: true, message: 'Post criado com sucesso.', postId });
      });
    });
  });
});


// Rota GET para listar as fotos postadas com informações do artista
app.get('/feed/list', (req, res) => {
  const sql = `
  SELECT 
    p.id, p.title, p.description, p.artSection, p.createdAt,
    a.id AS artistId, a.activity1, a.activity2,
    u.id AS userId, u.name, u.userName, u.email, u.profileImage,
    i.img1, i.img2, i.img3, i.img4, i.img5
  FROM posts p
  JOIN artists a ON p.artistId = a.id
  JOIN users u ON a.userId = u.id
  LEFT JOIN imageAndVideo i ON p.id = i.id_post
  ORDER BY p.id DESC
`;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar posts.' });
    }

    const posts = results.map(row => {
      const media = [row.img1, row.img2, row.img3, row.img4, row.img5].filter(Boolean);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        artSection: row.artSection,
        createdAt: row.createdAt,
        media,
        artist: {
          id: row.userId,
          name: row.name,
          userName: row.userName,
          email: row.email,
          profileImage: row.profileImage,
          activity1: row.activity1,
          activity2: row.activity2
        }
      };
    });

    res.json({ success: true, posts });
  });
});

//Rota PUT para edição de postagens
app.put('/feed/edit/:id', uploadFeed.array('media', 5), (req, res) => {
  const { id } = req.params;
  const { title, description, artSection } = req.body;

  if (!title || !description || !artSection) {
    return res.status(400).json({
      success: false,
      message: 'Campos obrigatórios não preenchidos.'
    });
  }

  try {
    // mídias novas enviadas pelo form
    const newMedia = req.files ? req.files.map(file => file.filename) : [];

    // mídias antigas mantidas (vem no formData como string JSON)
    let existingMedia = [];
    if (req.body.existingMedia) {
      try {
        existingMedia = JSON.parse(req.body.existingMedia);
      } catch (error) {
        console.error("Erro ao parsear existingMedia:", error);
      }
    }

    const cleanedExisting = existingMedia.map(src => {
      if (typeof src === "string") {
        const filename = src.split("/").pop(); // pega só o nome do arquivo
        return filename;
      }
      return src;
    });
    
    // Junta com novas mídias (nomes de arquivo vindos do multer)
    const updatedMedia = [...cleanedExisting, ...newMedia].slice(0, 5);

    // atualiza o conteúdo textual do post
    const sqlUpdatePost = `
      UPDATE posts 
      SET title = ?, description = ?, artSection = ?
      WHERE id = ?
    `;

    db.query(sqlUpdatePost, [title, description, artSection, id], (err, result) => {
      if (err) {
        console.error("Erro ao atualizar post:", err);
        return res.status(500).json({ success: false, message: 'Erro ao editar o post.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Postagem não encontrada.' });
      }

      // monta os valores de imagem (preenche até 5 colunas)
      const images = [null, null, null, null, null];
      updatedMedia.forEach((file, i) => { images[i] = file; });

      const sqlUpdateImages = `
        UPDATE imageAndVideo 
        SET img1 = ?, img2 = ?, img3 = ?, img4 = ?, img5 = ?
        WHERE id_post = ?
      `;

      db.query(sqlUpdateImages, [...images, id], (errImgs) => {
        if (errImgs) {
          console.error('Erro ao atualizar mídias:', errImgs);
          return res.status(500).json({ success: false, message: 'Erro ao atualizar as mídias.' });
        }

        res.json({
          success: true,
          message: 'Post atualizado com sucesso.',
          updatedMedia
        });
      });
    });
  } catch (error) {
    console.error("Erro geral na edição:", error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar a edição.'
    });
  }
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
  const { title, dateEvent, time, description, classification, typeEvent, link, artistId } = req.body;

  if (!title || !dateEvent || !time || !description || !classification || !typeEvent || !artistId) {
    return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  // 🔍 Corrige: busca o ID real do artista (tabela artists)
  const sqlFindArtist = 'SELECT id FROM artists WHERE userId = ?';
  db.query(sqlFindArtist, [artistId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar artista:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar artista.' });
    }

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: 'Perfil de artista não encontrado.' });
    }

    const realArtistId = result[0].id;

    const sqlInsert = `
      INSERT INTO events (title, dateEvent, time, description, classification, typeEvent, link, artistId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlInsert, [title, dateEvent, time, description, classification, typeEvent, link, realArtistId], (err2, result2) => {
      if (err2) {
        console.error('Erro ao criar evento:', err2);
        return res.status(500).json({ success: false, message: 'Erro ao criar evento.' });
      }

      res.status(201).json({ success: true, message: 'Evento criado com sucesso.', eventId: result2.insertId });
    });
  });
});

//Rota GET para listar eventos
app.get('/events', (req, res) => {
  const sql = `
    SELECT 
      e.id, e.title, e.dateEvent, e.time, e.description, e.classification, 
      e.typeEvent, e.link, e.artistId,
      u.id AS userId,
      u.name AS artistName
    FROM events e
    JOIN artists a ON e.artistId = a.id
    JOIN users u ON a.userId = u.id
    ORDER BY e.dateEvent ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao listar eventos:", err);
      return res.status(500).json({ success: false, message: "Erro ao listar eventos." });
    }
    res.json({ success: true, events: results });
  });
});

//Rota PUT para editar eventos
app.put('/events/edit/:id', (req, res) => {
  const { id } = req.params;
  const { title, dateEvent, time, description, classification, link } = req.body;

// Não funciona se não editar em todos os campos
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
  const {
    title,
    dateCourse,
    startTime,
    endTime,
    description,
    classification,
    typeCourse,
    modeCourse,
    durationValue,
    durationUnit,
    link,
    artistId
  } = req.body;

  if (
    !title || !dateCourse || !startTime || !endTime ||
    !description || !classification || !typeCourse ||
    !modeCourse || !durationValue || !durationUnit || !link || !artistId
  ) {
    return res.status(400).json({
      success: false,
      message: 'Todos os campos obrigatórios devem ser preenchidos.'
    });
  }

  // 🔍 Busca o ID real do artista (tabela artists)
  const sqlFindArtist = 'SELECT id FROM artists WHERE userId = ?';
  db.query(sqlFindArtist, [artistId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar artista:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar artista.' });
    }

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: 'Perfil de artista não encontrado.' });
    }

    const realArtistId = result[0].id;

    const sqlInsert = `
      INSERT INTO courses (
        title, dateCourse, startTime, endTime, description,
        classification, typeCourse, modeCourse, durationValue,
        durationUnit, link, artistId
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sqlInsert,
      [
        title, dateCourse, startTime, endTime, description,
        classification, typeCourse, modeCourse, durationValue,
        durationUnit, link, realArtistId
      ],
      (err2, result2) => {
        if (err2) {
          console.error('Erro ao criar curso:', err2);
          return res.status(500).json({ success: false, message: 'Erro ao criar curso.' });
        }

        res.status(201).json({
          success: true,
          message: 'Curso criado com sucesso.',
          courseId: result2.insertId
        });
      }
    );
  });
});


// Rota GET para listar todos os cursos
app.get('/courses', (req, res) => {
  const sql = `
    SELECT 
    c.id, c.title, c.dateCourse, c.startTime, c.endTime, c.description,
    c.classification, c.typeCourse, c.modeCourse, c.durationValue, c.durationUnit, c.link,
    c.artistId,
    u.id AS userId,     
    u.name AS artistName
  FROM courses c
  JOIN artists a ON c.artistId = a.id
  JOIN users u ON a.userId = u.id
  ORDER BY c.dateCourse ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar cursos." });
    }

    res.json({ success: true, courses: results });
  });
});

// === Rota GET para buscar 1 curso por ID ===
app.get('/courses/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM courses WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar curso:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar curso.' });
    }

    if (results.length === 0)
      return res.status(404).json({ success: false, message: 'Curso não encontrado.' });

    res.json({ success: true, course: results[0] });
  });
});



// Rota PUT para editar curso
app.put('/courses/edit/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, classification, startTime, endTime, durationValue, durationUnit } = req.body;

  if (!title || !description || !classification) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `
    UPDATE courses 
    SET title = ?, description = ?, classification = ?, startTime = ?, endTime = ?, durationValue = ?, durationUnit = ?
    WHERE id = ?
  `;

  db.query(sql, [title, description, classification, startTime, endTime, durationValue, durationUnit, id], (err, result) => {
    if (err) {
      console.error("Erro ao editar curso:", err);
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

  const encryptedMessage = encrypt(message);
  const sql = `INSERT INTO chat (message, userId, recipientId) VALUES (?, ?, ?)`;

  db.query(sql, [encryptedMessage, userId, recipientId], (err, result) => {
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

    // Descriptografa as mensagens
    const decryptedMessages = results.map(msg => ({
      ...msg,
      message: decrypt(msg.message)
    }));

    res.json({ success: true, messages: decryptedMessages });
  });
});

//Rota PUT pra editar mensagem 
app.put('/chat/edit/:id', (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'A nova mensagem é obrigatória.' });
  }
  const encryptedMessage = encrypt(message);
  const sql = `UPDATE chat SET message = ? WHERE id = ?`;

  db.query(sql, [encryptedMessage, id], (err) => {
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

// Rota GET para contar quantas curtidas um post possui
app.get('/post/likes/:postId', (req, res) => {
  const { postId } = req.params;

  const sql = 'SELECT COUNT(*) AS total FROM likes WHERE postId = ?';
  db.query(sql, [postId], (err, results) => {
    if (err) {
      console.error('Erro ao contar curtidas:', err);
      return res.status(500).json({ success: false, message: 'Erro ao contar curtidas.' });
    }

    const totalLikes = results[0]?.total || 0;
    res.json({ success: true, likes: totalLikes });
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
    SELECT
    p.id, p.title, p.description, p.artSection AS artSection,
    p.artistId, p.createdAt,
    i.img1, i.img2, i.img3, i.img4, i.img5
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
        createdAt: post.createdAt,
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
    SELECT 
      c.id, c.content AS comment, c.sendData,
      u.id AS userId, u.name, u.userName, u.profileImage, u.userType,
      a.activity1, a.activity2
    FROM comments c
    JOIN users u ON c.userId = u.id
    LEFT JOIN artists a ON a.userId = u.id
    WHERE c.postId = ?
    ORDER BY c.sendData DESC
  `;

  db.query(sql, [postId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar comentários.' });
    }

    res.json({ success: true, comments: results });
  });
});
// // Rota GET para listar comentários de um post
// app.get('/comments/:postId', (req, res) => {
//   const { postId } = req.params;

//   const sql = `
//     SELECT c.*, u.name, u.userName, u.profileImage
//     FROM comments c
//     JOIN users u ON c.userId = u.id
//     WHERE c.postId = ?
//     ORDER BY c.sendData DESC
//   `;

//   db.query(sql, [postId], (err, results) => {
//     if (err) return res.status(500).json({ success: false, message: 'Erro ao buscar comentários.' });

//     res.json({ success: true, comments: results });
//   });
// });

// Rota GET para buscar comentários feitos por um usuário específico
app.get('/comments/user/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      c.id AS id,
      c.content AS comment,        
      c.sendData AS createdAt,     
      c.sendData AS updatedAt,      
      c.postId,
      u.name,
      u.userName,
      u.profileImage,
      u.userType,
      a.activity1,
      a.activity2
    FROM comments c
    JOIN users u ON c.userId = u.id
    LEFT JOIN artists a ON a.userId = u.id
    WHERE c.userId = ?
    ORDER BY c.sendData DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar comentários do usuário:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar comentários do usuário.' });
    }

    res.json({
      success: true,
      comments: results || [],
      count: results?.length || 0
    });
  });
});

// Rota PUT pra editar o conteúdo do comentário
app.put('/comments/edit/:id', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'O novo conteúdo do comentário é obrigatório.' });
  }

  const sql = `
    UPDATE comments 
    SET content = ?, sendData = NOW() 
    WHERE id = ?
  `;

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


// Busca de usuários (com 2 tags de atuação)
app.get('/search/users', (req, res) => {
  const query = req.query.query?.trim();
  if (!query) return res.json({ success: false, message: "Termo de busca ausente." });

  const like = `%${query}%`;
  const sql = `
    SELECT 
      u.id, u.name, u.userName, u.userType, u.profileImage,
      a.activity1, a.activity2
    FROM users u
    LEFT JOIN artists a ON a.userId = u.id
    WHERE u.name LIKE ? OR u.userName LIKE ? OR a.activity1 LIKE ? OR a.activity2 LIKE ?
    ORDER BY u.name ASC
  `;

  db.query(sql, [like, like, like, like], (err, results) => {
    if (err) {
      console.error("Erro na busca de usuários:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar usuários." });
    }
    res.json({ success: true, results });
  });
});

// Busca de postagens (com autor e mídias)
app.get('/search/posts', (req, res) => {
  const query = req.query.query?.trim();
  if (!query) return res.json({ success: false, message: "Termo de busca ausente." });

  const like = `%${query}%`;
  const sql = `
    SELECT 
      p.id, p.title, p.description, p.artSection,
      u.name, u.userName, u.profileImage,
      a.activity1, a.activity2,
      i.img1, i.img2, i.img3, i.img4, i.img5
    FROM posts p
    JOIN artists a ON p.artistId = a.id
    JOIN users u ON a.userId = u.id
    LEFT JOIN imageAndVideo i ON p.id = i.id_post
    WHERE p.title LIKE ? OR p.description LIKE ? OR u.name LIKE ?
    ORDER BY p.createdAt DESC
  `;

  db.query(sql, [like, like, like], (err, results) => {
    if (err) {
      console.error("Erro ao buscar posts:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar posts." });
    }
    res.json({ success: true, results });
  });
});

// Busca de eventos (todas as infos + autor, foto e tags de atuação)
app.get('/search/events', async (req, res) => {
  const query = req.query.query?.trim();
  if (!query)
    return res.json({ success: false, message: "Termo de busca ausente." });

  const like = `%${query}%`;
  const sql = `
    SELECT 
      e.id, e.title, e.description, e.classification, e.typeEvent,
      e.dateEvent, e.time, e.link,
      u.name AS artistName, u.userName, u.profileImage,
      a.activity1, a.activity2
    FROM events e
    JOIN artists a ON e.artistId = a.id
    JOIN users u ON a.userId = u.id
    WHERE e.title LIKE ? 
       OR e.description LIKE ? 
       OR u.name LIKE ? 
       OR a.activity1 LIKE ? 
       OR a.activity2 LIKE ?
    ORDER BY e.dateEvent ASC, e.time ASC
  `;

  db.query(sql, [like, like, like, like, like], async (err, results) => {
    if (err) {
      console.error("Erro na busca de eventos:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar eventos." });
    }

    // 🔎 Recupera imagem de preview do link de cada evento
    const enhancedResults = await Promise.all(results.map(async (ev) => {
      let imagePreview = null;

      try {
        if (ev.link) {
          const metaRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(ev.link)}`);
          const metaData = await metaRes.json();
          imagePreview = metaData?.data?.image?.url || null;
        }
      } catch (e) {
        console.warn("Erro ao obter imagem preview:", e.message);
      }

      return { ...ev, imagePreview };
    }));

    res.json({ success: true, results: enhancedResults });
  });
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`))


