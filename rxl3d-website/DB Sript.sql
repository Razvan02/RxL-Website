drop table user_address;
drop table user_payment;
drop table cart;
drop table products;
drop table user_info;

CREATE TABLE user_info (
   userID smallint NOT NULL AUTO_INCREMENT,
   nume varchar(50) NOT NULL,
   email varchar(50) NOT NULL,
   parola varchar(60) NOT NULL,
   isAdmin tinyint NOT NULL,
   PRIMARY KEY (userID)
 );
 
CREATE TABLE user_payment (
   userID smallint NOT NULL,
   payment_type varchar(50) NOT NULL,
   provider varchar(50) NOT NULL,
   account_nr smallint NOT NULL,
   expire_date datetime NOT NULL,
   KEY userID (userID),
   CONSTRAINT user_payment_ibfk_1 FOREIGN KEY (userID) REFERENCES user_info (userID)
);

CREATE TABLE user_address (
   userID smallint NOT NULL,
   address varchar(100) ,
   phone char(13) ,
   city varchar(50) ,
   state varchar(100) ,
   postalcode varchar(10),
   KEY userID (userID),
   CONSTRAINT user_address_ibfk_1 FOREIGN KEY (userID) REFERENCES user_info (userID)
);

CREATE TABLE products (
   id smallint NOT NULL AUTO_INCREMENT,
   item_name varchar(100) NOT NULL,
   item_desc varchar(200) NOT NULL,
   custom char(2) NOT NULL,
   image varchar(100) NOT NULL,
   stock smallint NOT NULL,
   price decimal(10,0) NOT NULL,
   reviews smallint DEFAULT NULL,
   review decimal(10,0) DEFAULT NULL,
   category varchar(50) NOT NULL,
   discount smallint DEFAULT NULL,
   PRIMARY KEY (id)
 );
 
 CREATE TABLE cart (
   id int NOT NULL AUTO_INCREMENT,
   userID smallint NOT NULL,
   productID smallint DEFAULT NULL,
   item_name varchar(200) DEFAULT NULL,
   price decimal(10,0) DEFAULT NULL,
   amount smallint DEFAULT NULL,
   total decimal(10,2) DEFAULT NULL,
   discount smallint default null,
   PRIMARY KEY (id),
   KEY userID (userID),
   KEY productID (productID),
   CONSTRAINT cart_ibfk_1 FOREIGN KEY (userID) REFERENCES user_info (userID),
   CONSTRAINT cart_ibfk_2 FOREIGN KEY (productID) REFERENCES products (id)
 );

select * from user_info;
select * from user_address;
select * from cart;
select * from products;
select * from cart where userID = 1;

-- INSERT INTO cart 
-- (userID, productID, item_name, price, amount, total) 
-- VALUES (1, 1, "Valentin", 15, 2, 30);

insert into products 
	(item_name, item_desc, custom, image, stock, price, reviews, review, category, discount)
    values ("Test", "Cacat", "da", "test", 2, 35, 5, 10, "Produse", 15);
insert into products 
	(item_name, item_desc, custom, image, stock, price, reviews, review, category, discount)
    values ("Alala", "Dada", "da", "test", 2, 35, 5, 10, "Produse", 45);

insert into user_address (address, phone, city, state, postalcode) 
values ("1","test","test","test","test","test" );

INSERT INTO user_address (userID, address, phone, city, state, postalcode)
VALUES (?, ?, ?, ?, ?, ?);

UPDATE user_address
SET address = 'NewAddress', phone = 'NewPhone', city = 'NewCity', state = 'NewState', postalcode = 1234123412
WHERE userID = 1;

-- update cart set amount = amount + 1 where userID = 2 and productID = 1;