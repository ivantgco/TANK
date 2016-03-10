/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50626
Source Host           : localhost:3306
Source Database       : mb002

Target Server Type    : MYSQL
Target Server Version : 50626
File Encoding         : 65001

Date: 2016-03-10 13:59:03
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `user`
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `midname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status_id` bigint(20) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `gender_id` int(2) DEFAULT NULL,
  `hashedPassword` varchar(255) DEFAULT NULL,
  `salt` varchar(255) DEFAULT NULL,
  `company_id` bigint(20) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL,
  `deleted` datetime DEFAULT NULL,
  `published` datetime DEFAULT NULL,
  `sid` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES ('1', 'Гоптарев', 'Иван2', 'Иванович', 'ivantgco@gmail.com', '1', null, '1', 'b1bcd27277f1dcd3a1831f93c87d596609e3c9c2', '123456', '1', '2016-01-11 01:35:18', '2016-03-10 13:39:45', null, '2016-01-11 01:35:18', 'oMbiW3AOzRupgCpcNTFwSTA79lNyqn8B');
INSERT INTO `user` VALUES ('2', 'Тест', 'тест2', 'тест3', 'iig@list.ru', '1', null, '1', 'b1bcd27277f1dcd3a1831f93c87d596609e3c9c2', '123456', '1', '2016-01-11 02:15:43', '2016-02-15 16:43:23', null, '2016-01-11 02:15:43', 'ctyaN__pEod-u7cr-GYT5ZVFIeBH0mbV');
INSERT INTO `user` VALUES ('3', 'Гоптарев', 'Александр', 'Иванович', 'alextgco@gmail.com', '1', null, '1', 'b1bcd27277f1dcd3a1831f93c87d596609e3c9c2', '123456', '1', '2016-01-11 02:26:12', '2016-02-11 22:12:51', null, '2016-01-11 02:26:12', 'b3t7hxHB6BHRpKXYCYOCSRfA5W54XAIE');
INSERT INTO `user` VALUES ('4', null, null, null, 'asdasd', '3', null, null, null, null, '1', '2016-01-11 02:35:00', null, null, '2016-01-11 02:35:00', null);
INSERT INTO `user` VALUES ('5', null, null, null, 'fsdfsf', '3', null, null, null, null, '1', '2016-01-11 02:38:23', null, null, '2016-01-11 02:38:23', null);
INSERT INTO `user` VALUES ('6', null, null, null, 'asdasddd', '3', null, null, null, null, '1', '2016-01-11 02:40:29', null, null, '2016-01-11 02:40:29', null);
INSERT INTO `user` VALUES ('7', null, null, null, 'fgh', '3', null, null, null, null, '1', '2016-01-11 02:42:06', null, null, '2016-01-11 02:42:06', null);
INSERT INTO `user` VALUES ('8', null, null, null, 'sdfsdf', '3', null, null, null, null, '1', '2016-01-11 02:44:08', null, null, '2016-01-11 02:44:08', null);
INSERT INTO `user` VALUES ('9', null, null, null, 'user@example.ru', '3', null, null, null, null, '1', '2016-01-11 02:54:56', null, null, '2016-01-11 02:54:56', null);
INSERT INTO `user` VALUES ('10', null, null, null, 'dsadas@sds.trt', '3', null, null, null, null, '1', '2016-01-11 02:55:21', null, null, '2016-01-11 02:55:21', null);
INSERT INTO `user` VALUES ('11', 'Тест', 'тестт', 'Тесттт', null, '3', null, null, null, null, '2', '2016-02-02 17:52:27', '2016-02-02 17:56:22', null, '2016-02-02 17:52:27', null);
