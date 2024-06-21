describe("betCheckLib", function() {
  var betCheckLib = require('../../libs/betCheckLib');
  var money = require('../../libs/money');
  var data;
  beforeEach(function() {
    data = {
      ss: '1-1',
      odd: {"home_od":0.6,"handicap_team":"home","handicap_value":0.25,"handicap":"0-0.5","away_od":-0.84},
      term: '-0.84',
      stake: 50,
      position: 1
    }
  });

  describe(" - home bet - ", function() {
    beforeEach(function() {
      //data.odd.handicap_team = 'home';
    });

    it("case 1: win: 0-0.5: 0.25, 2-1, position = 0", function() {
      let ss = betCheckLib.diffSs('3-2', '4-3');
      console.log(ss);
      let value = betCheckLib.handicap(data.ss, data.odd, data.term, data.stake, data.position);
      console.log(value);
      expect(value).toEqual({status: 'win', returns: money.mul(data.stake, (1+ 0.88)), profit: money.mul(data.stake, 0.88)});
    });

    // it("case 2: win: home bet 3-3.5: 0.25, 2-1,position = 1", function() {
    //   data.odd.handicap_value = '3-3.5';
    //   data.ss = '4-1';
    //   data.position = 1;
    //   let value = betCheckLib.handicap(data.ss, data.odd, data.term, data.stake, data.position);
    //   expect(value).toEqual({status: 'win', returns: data.stake + money.mul(data.stake, 0.88)/2, profit: money.mul(data.stake, 0.88)/2});
    // });

    // it("case 3: win: home bet 3-3.5: 0.25, 2-1,position = 1", function() {
    //   data.odd.handicap_value = '2-2.5';
    //   data.ss = '2-1';
    //   data.position = 1;
    //   let value = betCheckLib.handicap(data.ss, data.odd, data.term, data.position);
    //   expect(value.status).toEqual('win');
    // });

    // it("case 4: lose: home bet 3-3.5: 0.25, 4-1,position = 1", function() {
    //   data.odd.handicap_value = '2-2.5';
    //   data.ss = '5-2';
    //   data.position = 0;
    //   let value = betCheckLib.handicap(data.ss, data.odd, data.term, data.position);
    //   expect(value.status).toEqual('win');
    // });

  });


  // describe(" - away bet - ", function() {
  //   beforeEach(function() {
  //     // data.odd.handicap_team = 'away';
  //     // data.term = "-0.6";
  //   });

  //   it("case 1: win: 0-0.5: 0.25, 2-1, position = 0", function() {
  //     data = {
  //       ss: '2-2',
  //       odd: {
  //         "home_od":0.88,
  //         "handicap_team":"home",
  //         "handicap":"3.5-4",
  //         "away_od": 0.76
  //       },
  //       term: '0.83',
  //       stake: 5,
  //       position: 0
  //     }
  //     let value = betCheckLib.overUnder(data.ss, data.odd, data.term, data.stake, data.position);
  //     expect(value).toEqual({status: 'win', returns: 6, profit: 3});
  //   });

  //});
});
