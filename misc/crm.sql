
/* Creating our database */
create database crm;
use crm;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table contact
# ------------------------------------------------------------

DROP TABLE IF EXISTS `contact`;

CREATE TABLE `contact` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Contact_Title` varchar(30) DEFAULT NULL,
  `Contact_First` varchar(5) NOT NULL,
  `Contact_Middle` varchar(30) DEFAULT NULL,
  `Contact_Last` varchar(8) NOT NULL,
  `Lead_Referral_Source` varchar(23) NOT NULL,
  `Date_of_Initial_Contact` date NOT NULL,
  `Title` varchar(20) NOT NULL,
  `Company` varchar(16) NOT NULL,
  `Industry` varchar(12) NOT NULL,
  `Address` varchar(38) NOT NULL,
  `Address_Street_1` varchar(17) NOT NULL,
  `Address_Street_2` varchar(30) DEFAULT NULL,
  `Address_City` varchar(12) NOT NULL,
  `Address_State` char(2) NOT NULL DEFAULT '',
  `Address_Zip` int(11) NOT NULL,
  `Address_Country` varchar(30) DEFAULT NULL,
  `Phone` varchar(14) NOT NULL,
  `Email` varchar(20) NOT NULL,
  `Status` int(11) unsigned NOT NULL,
  `Website` varchar(23) NOT NULL,
  `LinkedIn_Profile` varchar(21) NOT NULL,
  `Background_Info` text NOT NULL,
  `Sales_Rep` int(11) unsigned NOT NULL,
  `Rating` decimal(4,2) NOT NULL,
  `Project_Type` varchar(35) DEFAULT NULL,
  `Project_Description` tinytext,
  `Proposal_Due_Date` date DEFAULT NULL,
  `Budget` decimal(10,2) DEFAULT NULL,
  `Deliverables` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_SALES_REP` (`Sales_Rep`),
  KEY `FK_STATUS` (`Status`),
  CONSTRAINT `FK_SALES_REP` FOREIGN KEY (`Sales_Rep`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_STATUS` FOREIGN KEY (`Status`) REFERENCES `contact_status` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `contact` WRITE;
/*!40000 ALTER TABLE `contact` DISABLE KEYS */;

INSERT INTO `contact` (`id`, `Contact_Title`, `Contact_First`, `Contact_Middle`, `Contact_Last`, `Lead_Referral_Source`, `Date_of_Initial_Contact`, `Title`, `Company`, `Industry`, `Address`, `Address_Street_1`, `Address_Street_2`, `Address_City`, `Address_State`, `Address_Zip`, `Address_Country`, `Phone`, `Email`, `Status`, `Website`, `LinkedIn_Profile`, `Background_Info`, `Sales_Rep`, `Rating`, `Project_Type`, `Project_Description`, `Proposal_Due_Date`, `Budget`, `Deliverables`)
VALUES
	(1,NULL,'Amir',NULL,'Kahnzz','www.google .com','2014-05-09','PR Director','Barnes and Wells','PR','52 Broadway New York, NY 12345','52 Broadway',NULL,'New York','NY',12345,NULL,'(234) 432-2234','amir@pr.com',1,'www.pr.com','www.sample.com','4 years as PR Dir. Knows the biz and has wide network.',1,4.00,NULL,NULL,NULL,NULL,NULL),
	(2,NULL,'Dave',NULL,'Myers','Mack Truck Partner Site','2014-02-11','DEF Sales','DEF Fluids','Auto','456 Diesel St Philadelphia, PA 19308','456 Diesel St',NULL,'Philadelphia','PA',19308,NULL,'(765) 765-7755','dave@def.com',2,'www.def.com','www.sample.com','19 years in biz',2,2.50,NULL,NULL,NULL,NULL,NULL),
	(3,NULL,'Jason',NULL,'Wright','salesforce associate','2014-09-12','Marketing Director','Ben and Jerry\'s','Food','123 Ice Cream Way Burlington, VT 12345','123 Ice Cream Way',NULL,'Burlington','VT',12345,NULL,'(123) 432-1223','eat@benandjerrys.com',1,'www.benandjerrys.com','http://www.sample.com','Amazing ice creme company from Vermont. Sustainable practices.',1,4.00,NULL,NULL,NULL,NULL,NULL),
	(4,NULL,'Linda',NULL,'DeCastro','Conference','2014-01-19','Regional Sales Mgr','Pillsbury','Retail Foods','44 Reading Rd Flourtown, NJ 39485','44 Reading Rd',NULL,'Flourtown','NJ',39485,NULL,'(555) 555-5555','linda@pillsbury.com',3,'www.pillsbury.com','www.sample.com','New territory MGR',1,3.00,'New Packaging for Cookie products','Design new cookie packaging for new line of Sugar Free cookies.','2014-11-01',45000.00,'6 Proofs, multiple assets'),
	(5,NULL,'Sally',NULL,'Jane','CES Conference','2014-07-01','COO','Facetech','Tech','123 Tech Blvd Menlo Park, CA 12345','123 Tech Blvd',NULL,'Menlo Park','CA',12345,NULL,'(321) 321-1122','sally@facetech.com',1,'http://www.facetech.com','www.sample.com','Great contact, has a really great roadmap.',1,5.00,NULL,NULL,NULL,30000.00,NULL),
	(6,NULL,'Tim',NULL,'Smith','www.google.com','2014-10-10','Supply Chain Manager','Levis','Apparel','1 Blue Jean St. Corduroy, CO 12345','1 Blue Jean St.',NULL,'Corduroy','CO',12345,NULL,'(321) 321-4321','tim@levis.com',2,'www.levis.com','www.sample.com','Jeans and apparel for eastern U.S.<br />',1,3.50,'Shelf talkers; kiosk style displays','Set up shelf talkers for stock shelves with an end of aisle kiosk detailing the history of Levis.','2014-11-05',333000.00,'10k shelf talkers, 1500 kiosks');

/*!40000 ALTER TABLE `contact` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table contact_status
# ------------------------------------------------------------

DROP TABLE IF EXISTS `contact_status`;

CREATE TABLE `contact_status` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `contact_status` WRITE;
/*!40000 ALTER TABLE `contact_status` DISABLE KEYS */;

INSERT INTO `contact_status` (`id`, `status`)
VALUES
	(1,'lead'),
	(2,'opportunity'),
	(3,'customer/won'),
	(4,'archive');

/*!40000 ALTER TABLE `contact_status` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table notes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notes`;

CREATE TABLE `notes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Date` date DEFAULT NULL,
  `Notes` tinytext,
  `Is_New_Todo` int(11) unsigned NOT NULL,
  `Todo_Type_ID` int(11) unsigned NOT NULL,
  `Todo_Desc_ID` int(11) unsigned NOT NULL,
  `Todo_Due_Date` varchar(29) DEFAULT NULL,
  `Contact` int(11) unsigned NOT NULL,
  `Task_Status` int(11) unsigned NOT NULL,
  `Task_Update` varchar(51) DEFAULT NULL,
  `Sales_Rep` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_EVENT_NAME` (`Todo_Type_ID`),
  KEY `FK_EVENT_TYPE` (`Todo_Desc_ID`),
  KEY `FK_CONTACT_ID` (`Contact`),
  KEY `FK_SALES_ID` (`Sales_Rep`),
  KEY `FK_TASK_STATUS` (`Task_Status`),
  CONSTRAINT `FK_CONTACT_ID` FOREIGN KEY (`Contact`) REFERENCES `contact` (`id`),
  CONSTRAINT `FK_EVENT_NAME` FOREIGN KEY (`Todo_Type_ID`) REFERENCES `todo_type` (`id`),
  CONSTRAINT `FK_EVENT_TYPE` FOREIGN KEY (`Todo_Desc_ID`) REFERENCES `todo_desc` (`id`),
  CONSTRAINT `FK_SALES_ID` FOREIGN KEY (`Sales_Rep`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_TASK_STATUS` FOREIGN KEY (`Task_Status`) REFERENCES `task_status` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;

INSERT INTO `notes` (`id`, `Date`, `Notes`, `Is_New_Todo`, `Todo_Type_ID`, `Todo_Desc_ID`, `Todo_Due_Date`, `Contact`, `Task_Status`, `Task_Update`, `Sales_Rep`)
VALUES
	(1,'2014-07-11','ddddd',1,1,1,'07/23/2014 6:00pm to 8:00pm',1,1,'',1),
	(2,'2015-10-10','Sample Note',0,1,1,NULL,2,1,NULL,2),
	(3,'2015-05-21','sx',1,1,2,'07/31/2014',3,1,'',1),
	(4,'2014-06-01','Want to be sure to communicate weekly.',1,2,3,'07/04/2014 10:00am to 10:30am',4,1,'Ongoing',1),
	(5,'2014-01-31','Was introduced at textile conference.zzz',1,1,1,'04/09/2014 3:45pm to 4:45pm',5,2,'Great demo. All they needed to seal the deal.<br>',1),
	(6,'2014-11-11','Great to have this customer on board!',0,1,4,NULL,6,1,NULL,1),
	(7,'2017-01-27','test',0,1,2,'',3,1,'',1),
	(8,'2017-01-11','test123',0,1,5,NULL,6,1,NULL,1);

/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table roles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `role` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;

INSERT INTO `roles` (`id`, `role`)
VALUES
	(1,'Sales Rep'),
	(2,'Sales Manager'),
	(3,'Admin');

/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table task_status
# ------------------------------------------------------------

DROP TABLE IF EXISTS `task_status`;

CREATE TABLE `task_status` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `task_status` WRITE;
/*!40000 ALTER TABLE `task_status` DISABLE KEYS */;

INSERT INTO `task_status` (`id`, `status`)
VALUES
	(1,'pending'),
	(2,'completed');

/*!40000 ALTER TABLE `task_status` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table todo_desc
# ------------------------------------------------------------

DROP TABLE IF EXISTS `todo_desc`;

CREATE TABLE `todo_desc` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `todo_desc` WRITE;
/*!40000 ALTER TABLE `todo_desc` DISABLE KEYS */;

INSERT INTO `todo_desc` (`id`, `description`)
VALUES
	(1,'Follow Up Email'),
	(2,'Phone Call'),
	(3,'Lunch Meeting'),
	(4,'Tech Demo'),
	(5,'Meetup'),
	(6,'Conference'),
	(7,'Others');

/*!40000 ALTER TABLE `todo_desc` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table todo_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `todo_type`;

CREATE TABLE `todo_type` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `todo_type` WRITE;
/*!40000 ALTER TABLE `todo_type` DISABLE KEYS */;

INSERT INTO `todo_type` (`id`, `type`)
VALUES
	(1,'task'),
	(2,'meeting');

/*!40000 ALTER TABLE `todo_type` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table user_status
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_status`;

CREATE TABLE `user_status` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `user_status` WRITE;
/*!40000 ALTER TABLE `user_status` DISABLE KEYS */;

INSERT INTO `user_status` (`id`, `status`)
VALUES
	(1,'active'),
	(2,'inactive'),
	(3,'pending approval');

/*!40000 ALTER TABLE `user_status` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Name_Title` varchar(30) DEFAULT NULL,
  `Name_First` varchar(6) NOT NULL,
  `Name_Middle` varchar(30) DEFAULT NULL,
  `Name_Last` varchar(8) NOT NULL,
  `Email` varchar(16) NOT NULL,
  `Password` varchar(9) NOT NULL,
  `User_Roles` int(11) unsigned NOT NULL,
  `User_Status` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_USER_STATUS` (`User_Status`),
  KEY `FK_ROLE` (`User_Roles`),
  CONSTRAINT `FK_ROLE` FOREIGN KEY (`User_Roles`) REFERENCES `roles` (`id`),
  CONSTRAINT `FK_USER_STATUS` FOREIGN KEY (`User_Status`) REFERENCES `user_status` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `Name_Title`, `Name_First`, `Name_Middle`, `Name_Last`, `Email`, `Password`, `User_Roles`, `User_Status`)
VALUES
	(1,NULL,'Johnny',NULL,'Rep','rep@test.com','123456',1,1),
	(2,NULL,'Mary',NULL,'Rep','rep2@test.com','123456',1,1),
	(3,NULL,'Suzy',NULL,'Manager','manager@test.com','123456',2,1),
	(4,NULL,'Sales',NULL,'Manager1','sm@sm.com','123456',2,1),
	(5,NULL,'Rich',NULL,'C','test@test.com','123456',1,1);

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;