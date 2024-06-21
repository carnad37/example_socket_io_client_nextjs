let count = 0

self.onmessage = function (event) {
  const number = event.data
  const result = calculateFactorial(number)
  self.postMessage(result)
}

function calculateFactorial(number: number) {
  count += number
  return count
}
