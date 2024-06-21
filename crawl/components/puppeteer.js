const puppeteer = require('puppeteer');
const join = require('lodash/join');
const { setCookiesMlv } = require('./Cache');
const listAccount = [
    // {
    //     username: 'toiyeuthethao',
    //     password: 'Tanmoc12345'
    // },
    // {
    //     username: 'bongda123',
    //     password: 'Tanmoc12345'
    // },
    // {
    //     username: 'bangaitoi',
    //     password: 'bongda@123'
    // },
    // {
    //     username: 'ingomata',
    //     password: 'bongda@1234'
    // },
    // {
    //     username: 'anhyeuem1',
    //     password: 'Tanmoc@123'
    // },
    // {
    //     username: 'anhyeuem2',
    //     password: 'Tanmoc@123'
    // },
    // {
    //     username: 'anhyeuem3',
    //     password: 'Tanmoc@123'
    // },
    // {
    //     username: 'anhyeuem4',
    //     password: 'Tanmoc@123'
    // },
    // {
    //     username: 'anhyeuem5',
    //     password: 'Tanmoc@123'
    // },
    // {
    //     username: 'anhyeuem6',
    //     password: 'Tanmoc@123'
    // },
    // {
    //     username: 'anhyeuem7',
    //     password: 'Tanmoc@123'
    // },
    {
        username: 'Tanmockv2',
        password: 'T090487@'
    },
    {
        username: 'Tanmockv1',
        password: 'T090487@'
    },
    {
        username: 'mydoan6',
        password: 'T090487@'
    },
    {
        username: 'kendy4321',
        password: '@849364777dinh'
    },
    {
        username: 'kendy1111',
        password: '@849364777dinh'
    },
    {
        username: 'kendy2222',
        password: '@849364777dinh'
    },
    {
        username: 'mydoan7',
        password: 'T090487@'
    },
    {
        username: 'mydoan8',
        password: 'T090487@'
    },
    {
        username: 'mydoan9',
        password: 'T090487@'
    },
];

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms * 1000));
}

const args = [
    '--no-sandbox'
];

async function wasBrowserKilled(browser) {
    const procInfo = await browser.process();
    return !!procInfo.signalCode;
}

const getNewCookie = async () => {
    const ramdom = randomIntFromInterval(0, listAccount.length - 1);
    const account = listAccount[ramdom];

    console.log(' Using account ', account.username);

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        slowMo: 20,
        defaultViewport: null,
        args
    });
    const page = await browser.newPage();
    // await page.setDefaultNavigationTimeout(0);
    await page.setRequestInterception(true);

    page.on('request', request => {
        if (request.resourceType() === 'image') {
            request.abort();
        } else {
            request.continue();
        }
    });

    page.waitForNavigation();

    let cookiesStr = '';
    try {
        // Contrain loading time to 30 seconds
        await page.goto('https://www.qq288rr.com/vi-VN/Home');
	try{
        let provider = await page.evaluate(() => {

           let el = document.querySelector('#provider_maintenance_popup');
         return el ? el.innerText : '';
       });
        if (provider) {
         await page.waitForSelector('#providerMaintenancepop_close');
        await page.click('#providerMaintenancepop_close');
      	}
        }catch(e){}
        // await page.waitForSelector('#rewardpop_close');
        // await page.click('#rewardpop_close');

        await page.waitForSelector('.header #loginId');
        await page.click('.header #loginId');

        await page.type('.header #loginId', account.username);

        await page.waitForSelector('.header #loginPwd');
        await page.click('.header #loginPwd');
        await page.type('.header #loginPwd', account.password);

        await page.waitForSelector('.header #LoginButton');
        await page.click('.header #LoginButton');
        await page.goto('https://www.qq288rr.com/vi-VN/GamePage?Provider=CDL&RealMoney=True&ProviderPosition=SportsBook');
        await timeout(5);
        await page.goto('https://mylv.fts368.com/Member/Lists/MatchResult_new.aspx');
        const cookiesmylv = await page.cookies();
        const coookl = cookiesmylv.find(item => item.name === 'ASP.NET_SessionId');
        // setCookiesMlv(coookl.value);
        cookiesStr = coookl.value;
        await browser.close();

    } catch (e) {
        console.log(e);
        await browser.close();
    } finally {
        await browser.close();
    }

    return cookiesStr;
};

module.exports = getNewCookie;
