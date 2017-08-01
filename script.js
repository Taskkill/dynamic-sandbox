// user defined function
function run() {
  const output = document.getElementById('console-output')
  output.innerHTML = ''

  const source = document.getElementById('snippet').textContent
  try {
    evaluate(
      source,
      {
        console: {
          log() {
            for (let line of arguments) {
              output.innerHTML += line + '<br>'
            }
          },
          error() {
            for (let line of arguments) {
              output.innerHTML += `<span style="color:red">${line} </span><br>`
            }
          },
          dir(object) {
            console.dir(object)
          }
        },
      },
      window
    )
  } catch (Ex) {
    output.innerHTML += `<span style="color:red; font-weight:bold;">${Ex} </span><br>`
  }
}
