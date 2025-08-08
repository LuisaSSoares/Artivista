create database Artivista_db;
use Artivista_db;

create table users(
id int auto_increment not null primary key,
name varchar(255) not null,
userName varchar(255) not null,
email varchar(255) not null,
password varchar(255) not null,
userType enum('artista', 'padrão') default 'padrão',
bio varchar(100),
historia_arte varchar(255),
profileImage varchar (255)
);

CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Tem 74 áreas de atuação
INSERT INTO activities (name) VALUES
('Pintura'),
('Escultura'),
('Fotografia'),
('Música'),
('Dança'),
('Teatro'),
('Literatura'),
('Grafite'),
('Artesanato'),
('Moda'),
('Arte digital'),
('Ilustração'),
('Performance'),
('Cinema'),
('Design gráfico'),
('Audiovisual'),
('Artes Plásticas'),
('Artes Cênicas'),
('Artes Visuais'),
('Design'),
('Multimídia'),
('Cultura Popular'),
('Produção Cultural'),
('Desenho'),
('Gravura'),
('Design de Produto'),
('Design de Moda'),
('Design de Interiores'),
('Arte Urbana'),
('Videoarte'),
('Animação'),
('Arte Sonora'),
('Arte Interativa'),
('Instalação Artística'),
('Ballet'),
('Dança de Rua'),
('Dança Contemporânea'),
('Circo'),
('Mímica'),
('Música Vocal'),
('Música Instrumental'),
('Composição Musical'),
('DJ/Produção Musical'),
('Poesia'),
('Roteiro'),
('Quadrinhos'),
('Arte Sequencial'),
('Arte Têxtil'),
('Cerâmica'),
('Arte Indígena'),
('Arte Afro-brasileira'),
('Arte Sacra'),
('Arte Naïf'),
('Arte Conceitual'),
('Arte Feminista'),
('Body Art'),
('Arte Ambiental'),
('Land Art'),
('Cenografia'),
('Figurino'),
('Direção de Arte'),
('Maquiagem Artística'),
('Produção de Eventos'),
('Curadoria'),
('Mediação Cultural'),
('Arte Terapia'),
('Direção Cinematográfica'),
('Edição de Vídeo'),
('Sound Design'),
('Dramaturgia'),
('Interpretação Teatral'),
('Coreografia'),
('Luthieria'),
('Jóias e Ourivesaria');

create table artists(
id int not null primary key auto_increment,
service enum ('sim', 'não'),
userId int,
activityId int,
activityId2 int,
link1 VARCHAR(255),
link2 VARCHAR(255),
link3 VARCHAR(255),
foreign key (userId) references users(id) on delete cascade,
foreign key (activityId) references activities(id), 
foreign key (activityId2) references activities(id)
);

create table posts(
id int not null primary key auto_increment,
title varchar(100),
description varchar(225),
artSection varchar(100), 
artistId int,
foreign key (artistId) references artists(id)
);

create table imageAndVideo(
id_imgs int primary key auto_increment,
id_post int,
img1 varchar(255), 
img2 varchar(255), 
img3 varchar(255), 
img4 varchar(255), 
img5 varchar(255), 
foreign key (id_post) references posts(id)
);
create table events(
id int not null auto_increment primary key,
title varchar(100),
dateEvent date, 
time varchar(45), 
description varchar(255),
classification enum ('livre', '12 anos', '14 anos', '16 anos', '18 anos ou mais'),
link varchar(255), 
artistId int,
foreign key (artistId) references artists(id)
);

create table courses(
id int not null auto_increment primary key,
title varchar(100),
dateCourse date, 
time varchar(45), 
description varchar(255),
classification enum ('livre', '12 anos', '14 anos', '16 anos', '18 anos ou mais'),
participantsLimit int, 
link varchar(255), 
artistId int,
foreign key (artistId) references artists(id) 
);

create table chat(
id int not null auto_increment primary key, 
message varchar(255), 
sendIn datetime default current_timestamp, 
userId int,
foreign key (userId) references users(id) 
);

create table notifications(
id int not null primary key auto_increment,
alert varchar(255), 
sendData datetime default current_timestamp, 
userId int,
foreign key (userId) references users(id)
);

create table likes(
id int not null primary key auto_increment,
postId int,
userId int,
foreign key (userId) references users(id),
foreign key (postId) references posts(id)
);

create table favorites(
id int not null primary key auto_increment,
postId int,
userId int,
foreign key (userId) references users(id),
foreign key (postId) references posts(id)
);

create table comments(
id int not null primary key auto_increment,
content text, 
sendData datetime default current_timestamp,
postId int,
userId int,
foreign key (userId) references users(id),
foreign key (postId) references posts(id)
);


