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

create table artists(
id int not null primary key auto_increment,
service enum ('sim', 'não'),
phone VARCHAR(20),
userId int,
activity1 varchar(100),
activity2 varchar(100),
link1 VARCHAR(255),
link2 VARCHAR(255),
link3 VARCHAR(255),
foreign key (userId) references users(id) on delete cascade
);

create table posts(
id int not null primary key auto_increment,
title varchar(100),
description varchar(225),
artSection varchar(100), 
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
artistId int,
foreign key (artistId) references artists(id) on delete cascade
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
typeEvent enum ('gratuito', 'pago'),
link varchar(255), 
artistId int,
foreign key (artistId) references artists(id) on delete cascade
);

create table courses(
id int not null auto_increment primary key,
title varchar(100),
dateCourse date, 
startTime varchar(45), 
endTime  VARCHAR(45),
description varchar(255),
classification enum ('livre', '12 anos', '14 anos', '16 anos', '18 anos ou mais'),
typeCourse enum ('gratuito', 'pago'),
modeCourse ENUM('online', 'presencial'),
durationValue int,
durationUnit ENUM('dia', 'semana', 'mês', 'ano'),
link varchar(255), 
artistId int,
foreign key (artistId) references artists(id) on delete cascade
);


create table chat(
id int not null auto_increment primary key, 
message varchar(255), 
sendIn datetime default current_timestamp, 
userId int,
foreign key (userId) references users(id) on delete cascade
);

create table notifications(
id int not null primary key auto_increment,
alert varchar(255), 
sendData datetime default current_timestamp, 
userId int,
foreign key (userId) references users(id) on delete cascade
);

create table likes(
id int not null primary key auto_increment,
postId int,
userId int,
foreign key (userId) references users(id) on delete cascade,
foreign key (postId) references posts(id) on delete cascade
);

create table favorites(
id int not null primary key auto_increment,
postId int,
userId int,
foreign key (userId) references users(id) on delete cascade,
foreign key (postId) references posts(id) on delete cascade
);

create table comments(
id int not null primary key auto_increment,
content text, 
sendData datetime default current_timestamp,
postId int,
userId int,
foreign key (userId) references users(id) on delete cascade,
foreign key (postId) references posts(id) on delete cascade
);


