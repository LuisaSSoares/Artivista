create database Artivista_db;
use Artivista_db;

create table users(
id int auto_increment not null primary key,
name varchar(255),
userName varchar(255),
email varchar(255),
password varchar(50),
userType enum('artista', 'padrão') default 'padrão',
profileImage varchar (255)
);

create table artists(
id int not null primary key auto_increment,
activity varchar(100),
service enum ('sim', 'não'),
userId int,
foreign key (userId) references users(id)
);

create table posts(
id int not null primary key auto_increment,
title varchar(100),
description varchar(225),
artSection enum ('musica e audiovisual', 'artes plásticas', 'artes cênicas', 'literatura'), 
image varchar(255), 
artistId int,
foreign key (artistId) references artists(id)
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
sendData datetime default current_timestamp,
postId int,
userId int,
foreign key (userId) references users(id),
foreign key (postId) references posts(id)
);

create table followers(
followers int, 
following int, 
userId int,
foreign key (userId) references users(id)
);



