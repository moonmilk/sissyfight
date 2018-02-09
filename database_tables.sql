

--
-- Table structure for table `MonthlyScores`
--

CREATE TABLE `MonthlyScores` (
  `id` int(11) NOT NULL,
  `record_month` char(7) NOT NULL DEFAULT '',
  `month_points` int(11) NOT NULL DEFAULT '0',
  `month_games` int(11) NOT NULL DEFAULT '0',
  `month_wins` int(11) NOT NULL DEFAULT '0',
  `month_wins_solo` int(11) NOT NULL DEFAULT '0',
  `month_points_rank` int(11) NOT NULL DEFAULT '0',
  `month_win_pct` float NOT NULL DEFAULT '0',
  `month_win_pct_rank` int(11) DEFAULT NULL,
  `month_fame_points` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Table structure for table `Texts`
--

CREATE TABLE `Texts` (
  `key` varchar(60) NOT NULL DEFAULT '',
  `text` text NOT NULL,
  `cache_ttl` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `nickname` varchar(13) NOT NULL DEFAULT '',
  `password` varchar(60) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT '',
  `avatar` text NOT NULL,
  `lastPlayed` datetime DEFAULT NULL,
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `pwResetSent` datetime DEFAULT NULL,
  `pwResetCode` varchar(60) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `month_points` int(11) NOT NULL DEFAULT '0',
  `month_games` int(11) NOT NULL DEFAULT '0',
  `month_wins` int(11) NOT NULL DEFAULT '0',
  `month_wins_solo` int(11) NOT NULL DEFAULT '0',
  `alltime_points` int(11) NOT NULL DEFAULT '0',
  `alltime_games` int(11) NOT NULL DEFAULT '0',
  `alltime_wins` int(11) NOT NULL DEFAULT '0',
  `alltime_wins_solo` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `MonthlyScores`
--
ALTER TABLE `MonthlyScores`
  ADD UNIQUE KEY `id_month` (`month_points`,`id`),
  ADD KEY `id` (`id`),
  ADD KEY `record_month` (`record_month`);


--
-- Indexes for table `Texts`
--
ALTER TABLE `Texts`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nickname` (`nickname`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

