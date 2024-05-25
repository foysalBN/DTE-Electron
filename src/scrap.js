// scrap.js
const puppeteer = require('puppeteer');

// Global variables
let page;
const extendedTimeout = { timeout: 60000 }

// ALL Links
const BENEFICIARY_STUDENT_PROFILE_LINK = 'https://dte.finance.gov.bd/dte/beneficiary/beneficiaryStudentProfileList?lang=en'


async function openGoogle() {
  const browser = await puppeteer.launch({ headless: false });
  browser.on('disconnected', () => {
    console.log('🔥Browser Closed')
  })

  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  console.log('Opened Google.com');
  // await browser.close();
}


const searchRoll = async (roll) => {
  // await page.waitForNetworkIdle() // without this, much faster 😍
  await page.waitForSelector('#presentRoll', { visible: false })
  await page.waitForSelector('button[type="button"]')
  await page.click('button[type="button"]')
  await page.waitForSelector('#presentRoll', { visible: true })
  await page.evaluate(() => document.getElementById("presentRoll").value = "")
  await page.type('#presentRoll', '00' + roll)
  await page.click('button[type="submit"]')
  await page.waitForSelector('#presentRoll', { visible: false })
}


const getDataByRoll = async (roll, tableId) => {
  try {
    await searchRoll(roll)
    await page.waitForSelector("#searchForm", extendedTimeout) // fixed: Cannot read properties of undefined (reading 'querySelectorAll') 
    await page.waitForSelector(`#${tableId} tbody tr`, extendedTimeout)
    let stdData = await page.evaluate(async (roll, tableId) => {
      const tr = document.querySelectorAll(`#${tableId} tbody tr`)
      let note = tr.length > 1 ? "Multiple Entry" : '';
      const tds = tr[0].querySelectorAll("td")
      return tds.length == 1
        ? ({ roll, MIS: tds[0].innerHTML, note: 'No data' })
        : ({
          roll,
          MIS: tds[0].innerHTML,
          name: tds[1].innerHTML,
          sem: tds[2].innerHTML,
          status: tds[6].innerHTML,
          note
        })
    }, roll, tableId)
    return stdData
  } catch (error) {
    // TODO: show error toast
    console.log(` error while searching: ${roll}`)
    console.error(error)
    console.log("Waiting 10 second")
    setTimeout(function () {
      console.log("Ready")
    }, 10000);
  }
}




// mis
const startScrap = async (data, updateToast) => {
  let { type, credential, input } = data
  const inputArr = input.split("\n")
  class ReturnData {
    constructor(status, message, data) {
      this.status = status
      this.data = data
      this.message = message
    }
  }


  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1020, height: 1080 },
    timeout: 60000,
    // userDataDir: './user_data'
  })

  // event Handlers
  // TODO: modularized the function
  browser.on('disconnected', () => {
    console.log('🔥Browser Closed')
  })

  // global Page variable
  page = await browser.newPage();
  if (type === 'mis') {
    await page.goto('https://dte.finance.gov.bd/dte/home?lang=en', { timeout: 120000 });
  }


  const url = await page.url()
  let isLoggedIn;
  if (url === 'https://dte.finance.gov.bd/dte/login') {
    const login = async () => {
      // TODO: add Try Catch
      updateToast('⏳ Logging in...')
      await page.type('#icon_user', credential.username)
      await page.type('#icon_pass', credential.password)
      await page.click('button[type="submit"]')
      await page.waitForNetworkIdle()
      let loginError = await page.$('.red span')
      if (loginError) {
        return false
      }
      await page.waitForSelector('#id_menu_dashboard')
      updateToast('✔ Logged In Successfully')
      return true
    }
    isLoggedIn = await login()
  }


  console.log("isLogged in: ", isLoggedIn)
  if (!isLoggedIn) {
    // TODO: return the error 
    return new ReturnData(false, "Invalid Username or Password", null)
  }

  switch (type) {
    case "mis":
      await page.goto(BENEFICIARY_STUDENT_PROFILE_LINK)
      break;
    default:
      // return error
      break
  }






  let outputData = []
  let count = 1
  const total = inputArr.length
  const updateMessage = 'Collecting Data for:'

  for (let roll of inputArr) {
    updateToast(`(${count}/${total})  ${updateMessage} ${roll}`)
    const stdData = await getDataByRoll(roll, "beneficiary_student_list")
    outputData.push(stdData)
    count++
  }
  // spinner.stop(stopMessage)
  updateToast('Data Collected Successfully')
  // console.log(outputData)


  // end
  return new ReturnData(true, 'Data Collected Successfully', outputData)


}



module.exports = {
  openGoogle,
  startScrap,
};