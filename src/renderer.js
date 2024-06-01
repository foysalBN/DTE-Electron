const startBtn = document.querySelector('#start')


const showStartingToast = (titleMessage) => {
  saberToast.loading({
    title: titleMessage,
    text: '🔎 Checking login status...',
    delay: 200,
    duration: 0,
    rtl: true,
    position: 'top-right'
  })
}
const closeStartingToast = () => {
  document.querySelector('.close-toast')?.click()
}

const automationInit = (type) => {
  startBtn.classList.add("is-loading")
  startBtn.disabled = true
  switch (type) {
    case "mis":
      showStartingToast('Retrieving MIS Id')
      break;
    // case "sem":
    //   showStartingToast('')
    default:
      showStartingToast('Automation Started')
      break;

  }
}
const automationCleanup = (outputData) => {
  console.log("🔥 got output data from main")
  console.log(outputData)

  startBtn.classList.remove("is-loading")
  startBtn.disabled = false
  closeStartingToast()

  // Guard Class 
  if (!outputData.status) return saberToast.error({
    title: "Got An Error",
    text: outputData.message,
    delay: 200,
    duration: 3000,
    position: 'top-right',
    rtl: true,
  })

  // convert obj data to to excel format
  let excelData = ''
  for (let d of outputData.data) {
    excelData += Object.values(d).join("	") + '\n'
  }
  console.log(excelData)
  document.querySelector('#output').value = excelData


  // Show success Toast
  saberToast.success({
    title: "Success",
    text: outputData.message,
    delay: 200,
    duration: 3000,
    position: 'top-right',
    rtl: true,
  })
}



// event Handlers
document.addEventListener('DOMContentLoaded', async () => {
  window.electronApi.handleToastUpdate(message => {
    console.log("got update toast data from main")
    console.log(message)
    document.querySelector('.saber-toast .text').innerText = message
  })

  window.electronApi.handleScrapEnd(automationCleanup)
})






const startAutomate = async () => {
  const [automationType, username, password, input] = [
    document.querySelector('select#type').value,
    document.querySelector('input[type="text"]').value,
    document.querySelector('input[type="password"]').value,
    document.querySelector('#input').value,
  ]

  automationInit(automationType)

  await window.electronApi.startScrap({
    type: automationType,
    credential: { username, password },
    input
  })
}



startBtn.addEventListener('click', startAutomate)

document.getElementById('copy').addEventListener('click', function () {
  const textarea = document.getElementById('output');
  textarea.select();
  textarea.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand('copy');

  // Optionally, provide user feedback
  saberToast.success({
    title: "Output copied successfully.",
    text: "You can paste in in excel 😊",
    delay: 200,
    duration: 3000,
    position: 'top-right',
    rtl: true,
  })
});