const Cache = require('../components/Cache');
const matchGateway = require('../gateway/matchGateway');
const eventGateway = require('../gateway/eventGateway');
const betGateway = require('../gateway/betGateway');
const db = require('../components/Sequelize');
const Op = db.Sequelize.Op;
let runing = false;
let timeout = 3;
const betModel = require('../db/Bet');
const eventModel = require('../db/Event');

// fix lỗi liên quan tới match_results
module.exports = async () => {
  if (global.maintain) {
    return false;
  }
  if (runing && timeout !== 0) {
    timeout--;
    console.log('fix bet running ....');
    return false;
  }
  runing = true;
  timeout = 3;
  // const current = Cache.getCookies();
  // if (current) {
  //   console.log('Having session --------');
  //   runing = false;
  //   return;
  // }
  console.log('start fix bet ');
  betGateway.findAll({
      status: betModel.statics.STATUS.RUNING,
  }).then((bets)=>{
    if(bets){
      _bet_event_ids = bets.map(s=>s.event_id)
      bet_event_ids = [...new Set(_bet_event_ids)];
      eventGateway.findEventWithTimeStatusDone({
          time_status: {
            // [Op.in]: [2,3]
            [Op.in]: [eventModel.statics.STATUS.ENDED]
          },
          event_id:{
            [Op.in]: bet_event_ids
          }
        }).then((events)=>{
          
        if (events) {
          console.log('start fix bet count events: ',events.length);
          events.forEach((event)=>{
            console.log('start fix bet event: ',event.event_id);
            matchGateway.findMatchResultWithTimeStatusDone({
              [Op.or]: [
                {
                    ft_check: false,
                    match_over: 0
                },
                {
                    hf_check: false,
                    match_over_1h: 0
                }
              ],
              match_group_id:event.event_id
            }).then((matchs)=>{
              if (matchs) {
                console.log('start fix bet count matchs: ',matchs.length);
                count_match_done=0;
                matchs.forEach((match)=>{
                  console.log('start fix bet match: ', match.match_group_id);
                  let ss = event.ss.split('-')
                  match.home_score = ss[0]
                  match.away_score = ss[1]
                  if (event.hf_ss) {
                    let hf = event.hf_ss.split('-')
                    match.ht_home_score = hf[0]
                    match.ht_away_score = hf[1]
                  }
                  match.match_over = 1;
                  match.match_over_1h = 1;
                  match.save()
                  count_match_done++;
                  if(count_match_done==matchs.length){
                    runing = false;
                  }
                });
                

              }else{
                console.log('start fix bet count matchs: ',0);
                runing = false;
              }
            }).catch((error)=>{
              console.log("start fix bet print error matchGateway: ",error)
              runing = false;
            })
          });
        }else{
          console.log('start fix bet count events: ',0);
          runing = false;
        }
      }).catch((error)=>{
        console.log("start fix bet print error eventGateway: ",error)
        runing = false;
      })
    }else{
      console.log("start fix bet count bets:",0)
      runing = false;
    }
  }).catch((error)=>{
    console.log("start fix bet print error betGateway: ",error)
    runing = false;
  })
  return true;
  // console.log('start fix bet ');
  // matchGateway.getMatchs().then((matchs) => {
  //   console.log('start fix bet count matchs: ', matchs.length);
  //   if (matchs) {
  //     matchs.forEach((match) => {
  //       eventGateway.findOne({
  //         event_id: match.match_group_id,
  //         time_status: {[Op.in]: [2,3]}
  //       }).then((event) => {
  //         if (event) {
  //           console.log('start fix bet event: ', event.event_id);
  //           let ss = event.ss.split('-')
  //           match.home_score = ss[0]
  //           match.away_score = ss[1]
  //           if (event.hf_ss) {
  //             let hf = event.hf_ss.split('-')
  //             match.ht_home_score = hf[0]
  //             match.ht_away_score = hf[1]
  //           }

  //           match.match_over = 1;
  //           match.match_over_1h = 1;
  //           match.save()
  //         }
  //       }).catch((error)=>{
  //         console.log("start fix bet print error: ",error)
  //       })
  //     })
  //   }
  // })
};

