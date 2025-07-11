create database Artivista_db;
use Artivista_db;

create table users(
id int auto_increment not null primary key,
name varchar(255),
userName varchar(255),
email varchar(255),
password varchar(255),
userType enum('artista', 'padrão') default 'padrão',
profileImage varchar (255)
);

CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

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
('Design gráfico');

create table artists(
id int not null primary key auto_increment,
service enum ('sim', 'não'),
userId int,
activityId int,
foreign key (userId) references users(id) on delete cascade,
foreign key (activityId) references activities(id) 
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


