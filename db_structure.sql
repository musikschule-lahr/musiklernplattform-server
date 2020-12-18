
-- v1, nur User und Board, Lane, Card

CREATE TABLE IF NOT EXISTS `User` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `username` varchar(255) UNIQUE NOT NULL,
  `mail` varchar(255) UNIQUE,
  `phone` varchar(255),
  `birthdate` timestamp NULL DEFAULT NULL,
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT (now()),
  `updatedAt` timestamp NULL DEFAULT NULL,
  `lastLogin` timestamp NULL DEFAULT NULL,
  `matrixUserId` varchar(255)
);

/* REFERENCES ist bei ALTER TABLE immer lowercase => führt zu Fehler in Prisma Introspect, daher schon bei CREATE TABLE eingefügt, Problem Group Tabelle existiert noch nicht */
CREATE TABLE IF NOT EXISTS `Board` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `userId` int UNIQUE,
  `groupId` int UNIQUE COMMENT 'Board kann einer Gruppe zugeordnet werden',
  CONSTRAINT `board_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `board_groupId` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Lane` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255),
  `sorting` int,
  `boardId` int,
  KEY `boardId` (`boardId`),
  CONSTRAINT `lane_boardId` FOREIGN KEY (`boardId`) REFERENCES `Board` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Card` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255),
  `description` text,
  `createdAt` timestamp DEFAULT (now()),
  `updatedAt` timestamp NULL DEFAULT NULL,
  `createdBy` int COMMENT 'ist dies notwendig?',
  `updatedBy` int COMMENT 'ist dies notwendig?',
  KEY `createdBy` (`createdBy`),
  KEY `updatedBy` (`updatedBy`),
  CONSTRAINT `card_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`),
  CONSTRAINT `card_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `User` (`id`)
);

CREATE TABLE IF NOT EXISTS `CardLane` (
  `cardId` int,
  `laneId` int,
  `sorting` int,
  KEY `cardId` (`cardId`),
  KEY `laneId` (`laneId`),
  CONSTRAINT `cardLane_cardId` FOREIGN KEY (`cardId`) REFERENCES `Card` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cardLane_laneId` FOREIGN KEY (`laneId`) REFERENCES `Lane` (`id`) ON DELETE CASCADE
);

/* IMMER NUR EINMAL AUSFÜHREN */
/* ALTER TABLE `CardLane` ADD PRIMARY KEY (`cardId`, `laneId`); */

DELIMITER //
CREATE OR REPLACE PROCEDURE `resortLane`(
  IN `lane` INT
)
    MODIFIES SQL DATA
BEGIN
SET @laneId = lane;
SET @newsort:= 0;
UPDATE `CardLane` SET `sorting` = @newsort:= @newsort + 100 WHERE `laneId` = @laneId ORDER BY `sorting` ASC;
SET @newsort:= NULL;
END//
DELIMITER ;



-- v1.1, Keycloak User ID ergänzt

ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `keycloakUserId` VARCHAR(255) UNIQUE NULL DEFAULT NULL AFTER `lastLogin`;




-- v2, Erweiterung um Roles, Plans, Groups, Instruments, Relations

CREATE TABLE IF NOT EXISTS `Role` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `Plan` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `Instrument` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL,
  `icon` varchar(255)
);

CREATE TABLE IF NOT EXISTS `Group` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ownerId` int,
  `matrixRoomId` varchar(255),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `group_ownerId` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`)
);

CREATE TABLE IF NOT EXISTS `UserRole` (
  `userId` int,
  `roleId` int,
  KEY `userId` (`userId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `userRole_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userRole_roleId` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `UserPlan` (
  `userId` int,
  `planId` int,
  KEY `userId` (`userId`),
  KEY `planId` (`planId`),
  CONSTRAINT `userPlan_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userPlan_planId` FOREIGN KEY (`planId`) REFERENCES `Plan` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `UserRelated` (
  `userId` int,
  `relatedUserId` int,
  `userRelationType` ENUM ('teacherStudent', 'schoolTeacher', 'studentParent'),
  `instrumentId` int COMMENT 'Lehrer-Schüler-Beziehung, in welchem Fach unterrichtet der Lehrer den Schüler',
  `matrixRoomId` varchar(255),
  KEY `instrumentId` (`instrumentId`),
  KEY `userId` (`userId`),
  KEY `relatedUserId` (`relatedUserId`),
  CONSTRAINT `userRelated_instrumentId` FOREIGN KEY (`instrumentId`) REFERENCES `Instrument` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userRelated_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userRelated_relatedUserId` FOREIGN KEY (`relatedUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `UserInstrument` (
  `userId` int,
  `instrumentId` int,
  KEY `userId` (`userId`),
  KEY `instrumentId` (`instrumentId`),
  CONSTRAINT `userInstrument_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userInstrument_instrumentId` FOREIGN KEY (`instrumentId`) REFERENCES `Instrument` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `UserGroup` (
  `userId` int,
  `groupId` int,
  KEY `userId` (`userId`),
  KEY `groupId` (`groupId`),
  CONSTRAINT `userGroup_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `userGroup_groupId` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE
);

/* REFERENCES ist bei ALTER TABLE immer lowercase => führt zu Fehler in Prisma Introspect, daher schon bei CREATE TABLE eingefügt */
-- ALTER TABLE `Board` ADD FOREIGN KEY IF NOT EXISTS `board_groupId` (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE;


/* IMMER NUR EINMAL AUSFÜHREN */
/* ALTER TABLE `UserRole` ADD PRIMARY KEY (`userId`, `roleId`);

ALTER TABLE `UserPlan` ADD PRIMARY KEY (`userId`, `planId`);

ALTER TABLE `UserRelated` ADD PRIMARY KEY (`userId`, `relatedUserId`, `userRelationType`, `instrumentId`);

ALTER TABLE `UserInstrument` ADD PRIMARY KEY (`userId`, `instrumentId`);

ALTER TABLE `UserGroup` ADD PRIMARY KEY (`userId`, `groupId`); */



-- v2.1, n:m-Tabellen durch implizite Prisma Relations ersetzt, wo möglich

DROP TABLE IF EXISTS `UserRole`;
DROP TABLE IF EXISTS `UserPlan`;
DROP TABLE IF EXISTS `UserInstrument`;
DROP TABLE IF EXISTS `UserGroup`;

CREATE TABLE IF NOT EXISTS `_RoleToUser` (
  `A` int NOT NULL REFERENCES `Role`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `_PlanToUser` (
  `A` int NOT NULL REFERENCES `Plan`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `_InstrumentToUser` (
  `A` int NOT NULL REFERENCES `Instrument`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `_GroupToUser` (
  `A` int NOT NULL REFERENCES `Group`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_RoleToUser_AB_unique` ON `_RoleToUser`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_RoleToUser_B_index` ON `_RoleToUser`(`B`);

CREATE UNIQUE INDEX IF NOT EXISTS `_PlanToUser_AB_unique` ON `_PlanToUser`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_PlanToUser_B_index` ON `_PlanToUser`(`B`);

CREATE UNIQUE INDEX IF NOT EXISTS `_InstrumentToUser_AB_unique` ON `_InstrumentToUser`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_InstrumentToUser_B_index` ON `_InstrumentToUser`(`B`);

CREATE UNIQUE INDEX IF NOT EXISTS `_GroupToUser_AB_unique` ON `_GroupToUser`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_GroupToUser_B_index` ON `_GroupToUser`(`B`);



-- v2.2, LaneType hinzugefügt

ALTER TABLE `Lane` ADD COLUMN IF NOT EXISTS `laneType` ENUM ('ToDo', 'Done', 'Other') AFTER `boardId`;



-- v3, UserRelations neu definiert

DROP TABLE IF EXISTS `_RoleToUser`;
DROP TABLE IF EXISTS `Role`;

ALTER TABLE `UserRelated` ADD COLUMN IF NOT EXISTS `id` int FIRST;
ALTER TABLE `UserRelated` ADD COLUMN IF NOT EXISTS `userRole` ENUM ('Student', 'Teacher', 'Parent', 'Office') AFTER `userId`;
ALTER TABLE `UserRelated` ADD COLUMN IF NOT EXISTS `relatedUserRole` ENUM ('Student', 'Teacher', 'Parent', 'Office') AFTER `relatedUserId`;

CREATE UNIQUE INDEX IF NOT EXISTS `userRelation` ON `UserRelated` (`userId`, `userRole`, `relatedUserId`, `relatedUserRole`, `instrumentId`);
ALTER TABLE `UserRelated` DROP PRIMARY KEY, ADD PRIMARY KEY (`userId`, `relatedUserId`, `instrumentId`);
ALTER TABLE `UserRelated` DROP COLUMN IF EXISTS `userRelationType`;
ALTER TABLE `UserRelated` DROP PRIMARY KEY;
ALTER TABLE `UserRelated` MODIFY `id` int PRIMARY KEY AUTO_INCREMENT;



-- v3.1, Stundenplan hinzugefügt

CREATE TABLE IF NOT EXISTS `Timetable` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `userId` int UNIQUE,
  CONSTRAINT `timetable_userId` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Day` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `day` ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
  `sorting` int,
  `timetableId` int,
  CONSTRAINT `day_timetableId` FOREIGN KEY (`timetableId`) REFERENCES `Timetable` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Timeslot` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `time` time,
  `createdAt` timestamp DEFAULT (now()),
  `updatedAt` timestamp NULL DEFAULT NULL,
  `studentId` int COMMENT 'entweder Schüler oder Gruppe befüllt',
  `groupId` int COMMENT 'entweder Schüler oder Gruppe befüllt',
  `dayId` int,
  CONSTRAINT `timeslot_dayId` FOREIGN KEY (`dayId`) REFERENCES `Day` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timeslot_studentId` FOREIGN KEY (`studentId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timeslot_groupId` FOREIGN KEY (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `timetableDay` ON `Day` (`day`, `timetableId`);



-- v4, TeachedInstrumentsRelations hinzugefügt, User nur über Relation zu Gruppen zugeordnet

DROP TABLE IF EXISTS `_GroupToUser`;

CREATE TABLE IF NOT EXISTS `_InstrumentToTeacher` (
  `A` int NOT NULL REFERENCES `Instrument`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_InstrumentToTeacher_AB_unique` ON `_InstrumentToTeacher`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_InstrumentToTeacher_B_index` ON `_InstrumentToTeacher`(`B`);

ALTER TABLE `UserRelated`
  ADD COLUMN IF NOT EXISTS `groupId` INT(11) NULL DEFAULT NULL COMMENT 'Lehrer-Schüler-Beziehung, in welchem Fach/Ensemble unterrichtet der Lehrer den Schüler' AFTER `instrumentId`;

ALTER TABLE `UserRelated` ADD FOREIGN KEY `userRelated_groupId` (`groupId`) REFERENCES `Group` (`id`) ON DELETE CASCADE;

ALTER TABLE `UserRelated`
  DROP INDEX `userRelation`,
  ADD UNIQUE INDEX `userRelation` (`userId`, `userRole`, `relatedUserId`, `relatedUserRole`, `instrumentId`, `groupId`) USING BTREE;


ALTER TABLE `UserRelated`
  ADD COLUMN IF NOT EXISTS `confirmedAt` TIMESTAMP NULL DEFAULT NULL COMMENT 'Bestätigungszeitpunkt der Beziehung' AFTER `matrixRoomId`;



-- v5, LibElements und zugehörige Tabellen hinzugefügt

CREATE TABLE IF NOT EXISTS `Category` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `parentCategoryId` int,
  CONSTRAINT `category_parentCategoryId` FOREIGN KEY (`parentCategoryId`) REFERENCES `Category` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `Key` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `LevelOfDifficulty` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `Epoch` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL,
  `lowerLimit` int,
  `upperLimit` int
);

CREATE TABLE IF NOT EXISTS `AgeRange` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS `LibElement` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `createdAt` timestamp DEFAULT now(),
  `updatedAt` timestamp NULL DEFAULT NULL,
  `authorId` int,
  `metaDataId` int UNIQUE,
  `playerPath` char(36) UNIQUE NULL DEFAULT NULL,
  CONSTRAINT `libElement_authorId` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`),
  CONSTRAINT `libElement_metaDataId` FOREIGN KEY (`metaDataId`) REFERENCES `MetaData` (`id`)
);

CREATE TABLE IF NOT EXISTS `MetaData` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255),
  `composer` varchar(255),
  `comment` text,
  `isInYouthTalent` boolean DEFAULT false,
  `keyId` int,
  `difficultyId` int,
  `epochId` int,
  `ageRangeId` int,
  CONSTRAINT `metaData_keyId` FOREIGN KEY (`keyId`) REFERENCES `Key` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT `metaData_difficultyId` FOREIGN KEY (`difficultyId`) REFERENCES `LevelOfDifficulty` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT `metaData_epochId` FOREIGN KEY (`epochId`) REFERENCES `Epoch` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT `metaData_ageRangeId` FOREIGN KEY (`ageRangeId`) REFERENCES `AgeRange` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `_LibElementToInstrument` (
  `A` int NOT NULL REFERENCES `LibElement`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `Instrument`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_LibElementToInstrument_AB_unique` ON `_LibElementToInstrument`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_LibElementToInstrument_B_index` ON `_LibElementToInstrument`(`B`);

CREATE TABLE IF NOT EXISTS `_LibElementToCategory` (
  `A` int NOT NULL REFERENCES `LibElement`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `Category`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_LibElementToCategory_AB_unique` ON `_LibElementToCategory`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_LibElementToCategory_B_index` ON `_LibElementToCategory`(`B`);



-- v7 LibElements angepasst

CREATE TABLE IF NOT EXISTS `Composer` (
  `id` int(11) PRIMARY KEY AUTO_INCREMENT,
  `firstname` varchar(255),
  `lastname` varchar(255),
  `yearOfBirth` int(4),
  `yearOfDeath` int(4)
);

ALTER TABLE `MetaData` DROP FOREIGN KEY IF EXISTS `metaData_difficultyId`;
ALTER TABLE `MetaData` DROP COLUMN IF EXISTS `difficultyId`;
DROP TABLE `LevelOfDifficulty`;

ALTER TABLE `MetaData`
  DROP COLUMN IF EXISTS `composer`,
  ADD COLUMN IF NOT EXISTS `movement` varchar(255) AFTER `isInYouthTalent`,
  ADD COLUMN IF NOT EXISTS `difficultyMin` int(11) AFTER `movement`,
  ADD COLUMN IF NOT EXISTS `difficultyMax` int(11) AFTER `difficultyMin`,
  ADD COLUMN IF NOT EXISTS `composerId` int(11) AFTER `difficultyMax`;

ALTER TABLE `MetaData` ADD FOREIGN KEY `metadata_composerId` (`composerId`) REFERENCES `Composer` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE `Epoch`
  DROP COLUMN IF EXISTS `name`,
  DROP COLUMN IF EXISTS `lowerLimit`,
  DROP COLUMN IF EXISTS `upperLimit`,
  ADD COLUMN IF NOT EXISTS `code` varchar(255) UNIQUE NOT NULL,
  ADD COLUMN IF NOT EXISTS `description` text;

ALTER TABLE `LibElement`
  ADD COLUMN IF NOT EXISTS `playerType` ENUM ('Korrepetition', 'Band') NOT NULL;

CREATE TABLE IF NOT EXISTS `Track` (
  `id` int(11) PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `isVideo` boolean DEFAULT false,
  `filePath` varchar(255) NOT NULL,
  `libElementId` int(11),
  `sorting` int(11) DEFAULT 1,
  CONSTRAINT `track_libElementId` FOREIGN KEY (`libElementId`) REFERENCES `LibElement` (`id`) ON DELETE CASCADE
);



--- v8 Neue MetaDaten & Verbindung LibElement <-> Card

CREATE TABLE IF NOT EXISTS `Interpreter` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE IF NOT EXISTS `Instrumentation` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE IF NOT EXISTS `Staff` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE IF NOT EXISTS `_LibElementToStaff` (
  `A` int NOT NULL REFERENCES `LibElement`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `Staff`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_LibElementToStaff_AB_unique` ON `_LibElementToStaff`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_LibElementToStaff_B_index` ON `_LibElementToStaff`(`B`);

ALTER TABLE `LibElement`
  ADD COLUMN IF NOT EXISTS `productionNo` varchar(255) UNIQUE NOT NULL AFTER `id`,
  MODIFY COLUMN IF EXISTS `playerType` ENUM('Korrepetition', 'Ensemble_Band', 'Solo');

ALTER TABLE `MetaData`
  ADD COLUMN IF NOT EXISTS `coverImagePath` varchar(255) NULL DEFAULT NULL AFTER `difficultyMax`,
  ADD COLUMN IF NOT EXISTS `tuning` int(11) NULL DEFAULT NULL AFTER `coverImagePath`,
  ADD COLUMN IF NOT EXISTS `style` varchar(255) NULL DEFAULT NULL AFTER `tuning`,
  ADD COLUMN IF NOT EXISTS `yearOfRecording` int(11) NULL DEFAULT NULL AFTER `style`,
  ADD COLUMN IF NOT EXISTS `interpreterId` int(11) AFTER `composerId`,
  ADD COLUMN IF NOT EXISTS `instrumentationId` int(11) AFTER `ageRangeId`;

ALTER TABLE `MetaData` ADD FOREIGN KEY `metaData_interpreterId` (`interpreterId`) REFERENCES `Interpreter` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL;

ALTER TABLE `MetaData` ADD FOREIGN KEY `metaData_instrumentationId` (`instrumentationId`) REFERENCES `Instrumentation` (`id`) ON UPDATE RESTRICT ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS `_CardToLibElement` (
  `A` int NOT NULL REFERENCES `Card`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `LibElement`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_CardToLibElement_AB_unique` ON `_CardToLibElement`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_CardToLibElement_B_index` ON `_CardToLibElement`(`B`);



--- v9 Anpassungen für Verwaltungsoberfläche & Schuldaten, implizite n:m Tabellen alphabetische Benamung

CREATE TABLE IF NOT EXISTS `School` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `address` varchar(255),
  `zip` varchar(255),
  `city` varchar(255)
);

ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `schoolId` int(11) AFTER `matrixUserId`;

ALTER TABLE `User` ADD FOREIGN KEY `user_schoolId` (`schoolId`) REFERENCES `School` (`id`) ON DELETE SET NULL;

ALTER TABLE `MetaData`
  ADD COLUMN IF NOT EXISTS `shortTitle` varchar(255) AFTER `id`;

ALTER TABLE `Track`
	CHANGE COLUMN IF EXISTS `filePath` `filePath` varchar(255) NULL;

ALTER TABLE `Instrument`
	ADD COLUMN IF NOT EXISTS `instrumentGroup` varchar(255) NULL DEFAULT NULL AFTER `icon`;

ALTER TABLE `User`
	CHANGE COLUMN IF EXISTS `birthdate` `birthyear` int(4) NULL DEFAULT NULL AFTER `phone`;

CREATE TABLE IF NOT EXISTS `_InstrumentToLibElement` (
  `A` int NOT NULL REFERENCES `Instrument`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `LibElement`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_InstrumentToLibElement_AB_unique` ON `_InstrumentToLibElement`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_InstrumentToLibElement_B_index` ON `_InstrumentToLibElement`(`B`);

SELECT *
INTO `_InstrumentToLibElement`
FROM `_LibElementToInstrument`;

DROP TABLE `_LibElementToInstrument`;

CREATE TABLE IF NOT EXISTS `_CategoryToLibElement` (
  `A` int NOT NULL REFERENCES `Category`(`id`) ON DELETE CASCADE,
  `B` int NOT NULL REFERENCES `LibElement`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `_CategoryToLibElement_AB_unique` ON `_CategoryToLibElement`(`A`,`B`);
CREATE INDEX IF NOT EXISTS `_CategoryToLibElement_B_index` ON `_CategoryToLibElement`(`B`);

SELECT *
INTO `_CategoryToLibElement`
FROM `_LibElementToCategory`;

DROP TABLE `_LibElementToCategory`;