
const inputs = {
  year: 2024,
  session: 1,
  weekday: 'Tuesday',
  teams: [
    'Diggin\' N\' Swiggin\'',
    'FXB',
    'Net Ninjas',
    'Can You Dig It',
    'The Other Team',
    'Bump, Set, Brick',
    'Sets for Life',
    'Bump, Set, WTF',
    'Block Party',
    'Drink 182',
    'Team USA',
    'Team XII',
    'Blue Ballers',
    'Volley Llamas',
  ],
  dates: [
    '2024-04-23',
    '2024-04-30',
    '2024-05-07',
    '2024-05-14',
    '2024-05-21',
    '2024-05-28',
    '2024-06-04',
    '2024-06-11',
    '2024-06-18',
  ],
  times: [
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
    '8:00 PM',
    '8:30 PM',
    '9:00 PM',
  ],
  courts: [
    1,
    2,
  ],
};

const matchupOrderTemplates = [
  { teams: 14, order: ['A6', 'A7', 'B5', 'B6', 'A1', 'B7', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'A2', 'A3'] },
];

const orderMatchups = (matchups) => {
  const template = matchupOrderTemplates.find(x => x.teams === matchups.length);
  const order = template.order;
  const A = matchups.slice(0, matchups.length / 2);
  const B = matchups.slice(matchups.length / 2);
  const M = { A, B };
  const res = order.map(x => {
    const o = x.split('');
    const [round, index] = [o[0], parseInt(o[1]) - 1];
    const matchup = M[round][index];
    return matchup;
  });
  return res;
}


/* ------------------------------------------------ */
// helpers

const getConfig = () => {
  const year = inputs.year.toString();
  const session = inputs.session.toString().padStart(2, '0');
  const weekday = inputs.weekday.toUpperCase();
  const dates = inputs.dates.map(x => new Date(x).toLocaleDateString());
  const times = inputs.times;
  const courts = inputs.courts;
  const teams = inputs.teams;
  return { year, session, weekday, dates, times, courts, teams };
}

const toObject = (arr, key) => {
  return arr.reduce((acc, x) => {
    acc[x[key]] = x;
    return acc;
  }, {});
}

/* ------------------------------------------------ */
// createLeague

function createLeague(config) {

  const times = config.times;
  const courts = config.courts;

  const weeks = config.dates.map((x, i) => {
    const id = i + 1;
    const name = 'Week ' + id;
    const date = x;
    return { id, name, date };
  });

  const teams = config.teams.map((x, i) => {
    const id = i + 1;
    const name = x;
    const games = 0;
    const wins = 0;
    const losses = 0;
    const record = '0-0';
    return { id, name, games, wins, losses, record };
  });

  // create rounds of matchups for each week
  const rounds = [];
  let lastRotation = [];
  for (let i = 0; i < teams.length / 2; i++) {
    lastRotation.push([i + 1, teams.length - i]);
  }

  weeks.forEach((week, i) => {
    const r1 = (i === 0) ? lastRotation : rotateN(lastRotation, 1, 1);
    const r2 = rotateN(r1, 1, 1);
    const round = r1.concat(r2);
    rounds.push(round);
    lastRotation = r2;
  });

  // create empty schedule
  let slot = 1;
  const schedule = [];
  weeks.forEach(week => {
    times.forEach(time => {
      courts.forEach(court => {
        schedule.push({
          id: slot,
          week: week.id,
          date: week.date,
          time,
          court,
          teams: { 1: 0, 2: 0 },
          matches: { 1: 0, 2: 0 },
          status: null,
        });
        slot++;
      });
    });
  });

  // assign matchups to schedule
  weeks.forEach((week, i) => {
    const matchupSet = rounds[i];
    const matchups = orderMatchups(matchupSet);
    const games = schedule.filter(x => x.week === week.id);
    matchups.forEach((matchup, j) => {
      const game = games[j];
      game.teams[1] = matchup[0];
      game.teams[2] = matchup[1];
      game.status = 'pre';
    });
  });

  const data = {
    teams: toObject(teams, 'id'),
    schedule: toObject(schedule, 'id'),
  };

  return data;
}


/* ------------------------------------------------ */
// makeLeague

// function makeLeague(config) {

//   if (config === undefined) config = getConfig();

//   const teams = config.teams;
//   const weeks = config.weeks;
//   const games = createGames(config);

//   const league = {
//     weeks,
//     teams,
//     games,

//     getTeamLabels: () => {
//       return teams.map(x => x.name + ' (' + x.nbr + ')');
//     },

//     getGamesTable: () => {
//       const res = games.map(game => {
//         const teamLabels = game.teams.map(nbr => {
//           const team = teams.find(x => x.nbr === nbr);
//           const label = team.name + ' (' + team.nbr + ')';
//           return label;
//         });
//         game.week = weeks.find(x => x.nbr === game.week).name;
//         game.team1 = teamLabels[0];
//         game.team2 = teamLabels[1];
//         delete game.teams;
//         return game;
//       });
//       return res;
//     }
//   };

//   return league;
// }

/* ------------------------------------------------ */
// create array of available week/time/court combinations

function createSchedule(config) {

  const courts = config.courts;
  const times = config.times;
  const weeks = config.weeks;

  const schedule = [];
  for (let i = 0; i < weeks.length; i++) {
    for (let j = 0; j < times.length; j++) {
      for (let k = 0; k < courts.length; k++) {
        const w = weeks[i];
        const t = times[j];
        const c = courts[k];
        schedule.push({
          'week': w.nbr,
          'date': w.day,
          'time': t,
          'court': c,
        });
      }
    }
  }

  return schedule;
}

/* ------------------------------------------------ */
// generate array of matchups

function createMatchups(config) {

  const teams = config.teams;
  const numTeams = teams.length;
  const nbrs = teams.map(x => x.nbr);
  const matchups = [[]];
  while (nbrs.length > 1) {
    const team1 = nbrs.shift();
    const team2 = nbrs.pop();
    matchups[0].push([team1, team2]);
  }

  while (matchups.length < numTeams - 1) {
    let lastRound = matchups[matchups.length - 1];
    let newRound = rotateN(lastRound, 1, 1);
    matchups.push(newRound);
  }

  return matchups;
}

/* ------------------------------------------------ */
// assign matchups to schedule

function assignMatchups(schedule, matchups) {

  const weeks = [...new Set(schedule.map(x => x.week))];
  const roundsPerWeek = 2;
  const roundsTotal = weeks.length * roundsPerWeek;
  while (matchups.length < roundsTotal) {
    matchups.push(...matchups);
  }

  const assignedSchedule = [];
  for (let i = 0; i < weeks.length; i++) {
    const weekSchedule = schedule.filter(x => x.week == weeks[i]);
    const A = matchups.shift();
    const B = matchups.shift();
    const M = { A, B };
    const order = [
      'A6', 'A7',
      'B5', 'B6',
      'A1', 'B7',
      'A4', 'A5',
      'B1', 'B2',
      'B3', 'B4',
      'A2', 'A3',
    ];

    const weekMatchups = order.map(x => {
      const o = x.split('');
      const [round, index] = [o[0], parseInt(o[1]) - 1];
      const matchup = M[round][index];
      return matchup;
    });

    for (let j = 0; j < weekMatchups.length; j++) {
      const matchup = weekMatchups[j];
      const game = weekSchedule[j];
      game['teams'] = matchup;
      assignedSchedule.push(game);
    }
  }

  return assignedSchedule;
}

/* ------------------------------------------------ */
// rotate helpers

function rotate(mat, fixVal = 1) {
  let n = mat.length;
  let res = [];
  for (let i = 0; i < n; i++) {
    let item = mat[i];
    let above = mat[i - 1];
    let above2 = mat[i - 2];
    let below = mat[i + 1];
    let isFirst = i === 0;
    let isLast = i === n - 1;

    let v1 = (isFirst) ? item[1] : above[0];
    let v2 = (isLast) ? item[0] : below[1];
    if (item[0] === fixVal) {
      v1 = item[0];
    }
    if (above && above[0] === fixVal) {
      if (i === 1) {
        v1 = above[1];
      } else {
        v1 = above2[0];
      }
    }
    res.push([v1, v2]);
  }

  return res;
}

function rotateN(mat, fixVal = 1, n = 1) {
  let res = mat;
  for (let i = 0; i < n; i++) {
    res = rotate(res, fixVal);
  }
  return res;
}
