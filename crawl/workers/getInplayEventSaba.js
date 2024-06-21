/* eslint-disable camelcase */
const request = require('request');
const Cache = require('../components/Cache');
const CacheAuth = require('../components/CacheAuth');
const CacheToken = require('../components/CacheToken');
const money = require('../libs/money');
const eventGateway = require('../gateway/eventGateway');
const matchGateway = require('../gateway/matchGateway');
const _ = require('lodash');
const db = require('../components/Sequelize');
const Op = db.Sequelize.Op;

let runing = false;
let timeout = 3;

module.exports = async () => {
    if (global.maintain) {
        return;
    }
    const tokenAuth = await CacheAuth.getTokenAuth();
    if (tokenAuth === 'null') {
        console.log('Not login');
        runing = false;
        return;
    }

    const tokenData = await CacheToken.getTokenData();
    if (tokenData === 'null') {
        console.log('not token');
        runing = false;
        return;
    }

    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl getDataInplaySaba running ....');
        return;
    }

    runing = true;
    timeout = 3;

    console.log('start getDataInplaySaba');
    const date_ob = new Date();
    console.log('thy start getDataInplaySaba================', date_ob.getHours() + ':' + date_ob.getMinutes() + ':' + date_ob.getSeconds());

    await getData(tokenData).then(async data => {
        console.log('thy==========getDataInplaySaba======data', data[0]);
        const oddIds = await eventGateway.saveFromAPI(data, 1, true);
        let eventIds = _.map(data, function (item) {
            // oddIds.push(item.odd_id);
            return item.event_id;
        });
        return {
            oddIds: oddIds,
            eventIds: eventIds
        };

        
    }).then(async function (data) {
        console.log('thy====updatefinishEventSaba');
        await eventGateway.updatefinishEventSaba(data.eventIds, true);
        return data;
        /*
        return eventGateway.updatefinishEventSaba(data.eventIds, true).then(function () {
            return data;
        });*/
    }).then(async function (data) {
        console.log('thy====updateRefundEventSaba');
        await eventGateway.updateRefundEventSaba(data.eventIds);
        return data;
        /*
        return eventGateway.updateRefundEventSaba(data.eventIds).then(function () {
            return data;
        });*/
    }).then(() => {
        // Update matches
        matchGateway.findAll({
            [Op.or]: [
                {
                    match_over: 0
                },
                {
                    match_over_1h: 0
                }
            ]
        }).then(matchs => {
            _.forEach(matchs, function (match) {
                eventGateway.findOne({
                    event_id: match.match_group_id,
                    saba: true,
                    time_status: {
                        [Op.in]: [1, 3, 5]
                    }
                }).then((event) => {
                    if (event) {
                        if (event.time_status === 3) {
                            let HTHomeScore = 0;
                            let HTAwayScore = 0;
                            let homeScore = 0;
                            let awayScore = 0;
                            if (event.hf_ss) {
                                HTHomeScore = event.hf_ss.split('-')[0];
                                HTAwayScore = event.hf_ss.split('-')[1];
                                match.ht_home_score = HTHomeScore;
                                match.ht_away_score = HTAwayScore;
                            }
                            homeScore = event.ss.split('-')[0];
                            awayScore = event.ss.split('-')[1];
                            match.home_score = homeScore;
                            match.away_score = awayScore;
                            match.match_over_1h = 1;
                            match.match_over = 1;
                        }

                        if (event.time_status === 5) {
                            let HTHomeScore = 0;
                            let HTAwayScore = 0;
                            let homeScore = 0;
                            let awayScore = 0;
                            if (event.hf_ss) {
                                HTHomeScore = event.hf_ss.split('-')[0];
                                HTAwayScore = event.hf_ss.split('-')[1];
                                match.ht_home_score = HTHomeScore;
                                match.ht_away_score = HTAwayScore;
                            }
                            homeScore = event.ss.split('-')[0];
                            awayScore = event.ss.split('-')[1];
                            match.home_score = homeScore;
                            match.away_score = awayScore;
                            match.match_over_1h = 2;
                            match.match_over = 2;
                        }
                        if (event.event_id === 534112560) {
                            console.log(event);
                        }
                        match.save();
                    }
                });
            });
        });
    })
        // .then(function (data) {
        //     return oddGateway.updateToPeding(data.oddIds, 1).then(function () {
        //       return data;
        //     });
        //   })
        .catch(function (err) {
            console.log('error getDataInPlay', err);

            CacheAuth.setTokenAuth("null");
            CacheToken.setTokenData("null");

        }).finally(error => {
            console.log('finish getDataInPlay', error);

            const date_ob = new Date();
            console.log('thy end getDataInplaySaba================', date_ob.getHours() + ':' + date_ob.getMinutes() + ':' + date_ob.getSeconds());

            runing = false;
        });
};

const getData = (token) => {
    return new Promise((resolve, reject) => {
        let data;
        var options = {
            'method': 'GET',
            'url': 'https://opdbf.t1111.net/BFOdds/ShowAllOddsApi?GameId=997&DateType=l&BetTypeClass=OU&Gametype=0&_=1650863668465&language=vi-VN',
            'headers': {
                'authorization': 'Bearer ' + token,
                '_mculture': 'vi-VN'
            }
        };
        request(options, async function (error, response) {
            if (error) {
                reject(response.body);
            } else {
                try {
                    
                    const { Data } = JSON.parse(response.body);
                    let chunks = [];
                    const chunkSize = 10;
                    console.log('Data.NewMatch.length = ', Data.NewMatch.length);
                    for(let i = 0; i < Data.NewMatch.length; i += chunkSize) {
                        const chunk = Data.NewMatch.slice(i, i + chunkSize);
                        chunks.push(chunk);
                    }

                    let responseData = {};
                    for(let j = 0; j < chunks.length; j++) {

                        let matchChunks = [];
                        for(let k = 0; k < chunks[j].length; k++) {
                            matchChunks.push({ GameId: 1, DateType: 'l', BetTypeClass: 'OU', Matchid: chunks[j][k].MatchId, GameType: 0 });
                        }
                        await getOdds(token, matchChunks).then((odds) => {
                            const results = odds.Data;
                            responseData = Object.assign(responseData, results);
                        });
                    }
                    data = convertData(Data, responseData);
                    resolve(data);
                    
                    /*
                    const { Data } = JSON.parse(response.body);
                    let matches = [];
                    Data.NewMatch.forEach((match) => {
                        matches.push({ GameId: 1, DateType: 'l', BetTypeClass: 'OU', Matchid: match.MatchId, GameType: 0 });
                    });
                    getOdds(token, matches).then((odds) => {
                        data = convertData(Data, odds.Data);
                        resolve(data);
                    });*/
                } catch (e) {
                    reject(response.body);
                }
            }
        });
    });
};

const getOdds = (token, filter) => {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': 'https://oplg4.t1111.net/Odds/GetMarketsApi',
            'headers': {
                'authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                '_mculture': 'vi-VN'
            },
            body: JSON.stringify(filter)
        };
        request(options, function (error, response) {
            if (error) {
                reject(response);
            } else {
                try {
                    resolve(JSON.parse(response.body));
                } catch (e) {
                    reject(response.body);
                }
            }
        });
    });
};
function getType (league_name, home, away) {
    if (league_name.indexOf('- CORNERS') > -1) {
        if (home.indexOf('No. of Corners') > -1 && away.indexOf('No. of Corners') > -1) {
            return {
                type: 'no_of_corners'
            };
        } else {
            let kinds = /(\d+)([A-z]{2} )(Corner)/g.exec(home);
            if (kinds && kinds.length) {
                return {
                    corner_type: kinds[1],
                    type: 'conner'
                };
            } else {
                return {
                    type: 'other'
                };
            }
        }
    }
    return {
        type: 'main'
    };
}

const getDataSort = (oddEvents, sort) => {
    let odd = [];
    let ft_hdp = oddEvents.find(oe => oe.BetTypeId === 1 && oe.sort === sort);

    if (ft_hdp) {
        odd = {
            ...odd,
            ft_hdp: {
                home_od: ft_hdp.Selections.h.Price,
                handicap_team: ft_hdp.Line < 0 ? 'away' : 'home',
                handicap: calcHandicap(parseFl(ft_hdp.Line, '')),
                handicap_value: parseFl(ft_hdp.Line),
                away_od: ft_hdp.Selections.a.Price
            }
        };
    }
    let ft_ou = oddEvents.find(oe => oe.BetTypeId === 3 && oe.sort === sort);
    if (ft_ou) {
        odd = {
            ...odd,
            ft_ou: {
                oddId: ft_ou.MarketId.toString(),
                over_od: ft_ou.Selections.h.Price,
                handicap: calcHandicap(parseFl(ft_ou.Line, '')),
                handicap_value: parseFl(ft_ou.Line),
                under_od: ft_ou.Selections.a.Price
            }
        };
    }

    let ft_1x2 = oddEvents.find(oe => oe.BetTypeId === 5 && oe.sort === sort);
    if (ft_1x2) {
        odd = {
            ...odd,
            ft_1x2: {
                home_od: ft_1x2.Selections['1'].Price,
                draw_od: ft_1x2.Selections['x'].Price,
                away_od: ft_1x2.Selections['2'].Price
            }
        };
    }
    let hf_hdp = oddEvents.find(oe => oe.BetTypeId === 7 && oe.sort === sort);
    if (hf_hdp) {
        odd = {
            ...odd,
            hf_hdp: {
                home_od: hf_hdp.Selections.h.Price,
                handicap_team: hf_hdp.Line < 0 ? 'away' : 'home',
                handicap: calcHandicap(parseFl(hf_hdp.Line, '')),
                handicap_value: parseFl(hf_hdp.Line),
                away_od: hf_hdp.Selections.a.Price
            }
        };
    }
    let hf_ou = oddEvents.find(oe => oe.BetTypeId === 8 && oe.sort === sort);
    if (hf_ou) {
        odd = {
            ...odd,
            hf_ou: {
                over_od: hf_ou.Selections.h.Price,
                handicap: calcHandicap(parseFl(hf_ou.Line, '')),
                handicap_value: parseFl(hf_ou.Line),
                under_od: hf_ou.Selections.a.Price
            }
        };
    }
    let hf_1x2 = oddEvents.find(oe => oe.BetTypeId === 15 && oe.sort === sort);
    if (hf_1x2) {
        odd = {
            ...odd,
            hf_1x2: {
                home_od: hf_1x2.Selections['1'].Price,
                draw_od: hf_1x2.Selections['x'].Price,
                away_od: hf_1x2.Selections['2'].Price
            }
        };
    }
    return odd;
};
const convertData = (data, odds) => {
    const leagues = data.LeagueN;
    const team = data.TeamN;
    return data.NewMatch.map((d) => {
        let league_name = leagues[d.LeagueId];
        let home = team[d.TeamId1];
        let away = team[d.TeamId2];
        var dataType = getType(league_name, home, away);
        let oddEvents = odds[d.MatchId] && odds[d.MatchId].NewOdds;
        let oddFilters = [];
        if (oddEvents) {
            oddFilters.push(getDataSort(oddEvents, 1));
            oddFilters.push(getDataSort(oddEvents, 2));
        }

        return {
            'event_id': d.MatchId.toString(),
            'odd_id': '',
            'parent_id': d.ParentId || d.MatchId.toString(),
            'live_id': d.hasLive ? '1' : '0',
            'time_status': 1,
            'order': d.LeagueGroupId,
            'type': dataType.type,
            'corner_type': dataType.corner_type || 0,
            'league_id': d.LeagueId.toString(),
            'league_name': league_name,
            'event_type': '',
            'home': home,
            'home_id': d.TeamId1,
            'away': away,
            'away_id': d.TeamId2,
            'start_time': d.GameTime.toString(),
            'time': d.ShowTime,
            'ss': d.T1V.toString() + '-' + d.T2V.toString(),
            'odds': oddFilters,
            'reds': {
                home: d.Rc1,
                away: d.Rc2
            }
        };
    });
};

const calcHandicap = (value) => {
    if (!value || value === '') {
        return value;
    }
    value = parseFloat(value);
    let key = parseInt(money.mul(value, 10));
    let neVal = parseInt(money.div(key, 10));
    if (key % 5 === 0) {
        if (Number.isInteger(value)) {
            return value + '.0';
        }
        if (value < 0) {
            return String(-value);
        }
        return String(value);
    }
    if (key % 2 === 0) {
        return neVal + '-' + (neVal + 0.5);
    }
    return (neVal + 0.5) + '-' + (neVal + 1);
};

function parseFl (item, defaultValue) {
    if (item === -999) {
        return '';
    }
    return parseFloat(item) || parseFloat(item) === 0 ? parseFloat(item) : defaultValue;
}
