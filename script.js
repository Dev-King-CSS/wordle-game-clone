//! Imports
import { dictionary } from "./assets/dictionary.js"
import { targetWords } from "./assets/targetWords.js"

//! Constants
const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = FLIP_ANIMATION_DURATION
//! DOM elements
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
//! Variables
const offsetFromDate = new Date(2022, 0, 1)
const msOffset = Date.now() - offsetFromDate
const dayOffset = msOffset / 1000 / 60 / 60 / 24
const targetWord = targetWords[Math.floor(dayOffset)]

const getActiveTiles = () =>
  guessGrid.querySelectorAll('[data-state="active"]')

const danceTiles = async tiles =>
  await tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => tile.classList.remove("dance"),
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })

const shakeTiles = async tiles =>
  await tiles.forEach(tile => {
    tile.classList.add("shake")
    tile.addEventListener(
      "animationend",
      () => tile.classList.remove("shake"),
      { once: true }
    )
  })

const showAlert = (message, duration = 1000) => {
  const alert = document.createElement("div")
  alert.textContent = message
  alert.classList.add("alert")
  alertContainer.prepend(alert)

  setTimeout(() => {
    alert.classList.add("hide")
    alert.addEventListener("transitionend", () => alert.remove())
  }, duration)
}

const checkWinLose = (guess, tiles) => {
  if (guess === targetWord) {
    showAlert("You win!", 5000)
    danceTiles(tiles)
    stopInteraction()
    return
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")
  if (remainingTiles.length !== 0) return
  showAlert(targetWord.toUpperCase(), 10000)
  stopInteraction()
}

const pressKey = key => {
  const activeTiles = getActiveTiles()
  if (activeTiles.length >= WORD_LENGTH) return
  const nextTile = guessGrid.querySelector(":not([data-letter])")
  nextTile.dataset.letter = key.toLowerCase()
  nextTile.textContent = key
  nextTile.dataset.state = "active"
}

const deleteKey = () => {
  const activeTiles = getActiveTiles()
  const lastTile = activeTiles[activeTiles.length - 1]
  if (lastTile == null) return
  lastTile.textContent = ""
  delete lastTile.dataset.state
  delete lastTile.dataset.letter
}

const flipTile = async (tile, index, array, guess) => {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter}"i]`)
  setTimeout(
    () => tile.classList.add("flip"),
    (index * FLIP_ANIMATION_DURATION) / 2
  )

  await tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip")
      if (targetWord[index] === letter) {
        tile.dataset.state = "correct"
        key.classList.add("correct")
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "wrong-location"
        key.classList.add("wrong-location")
      } else {
        tile.dataset.state = "wrong"
        key.classList.add("wrong")
      }

      if (index !== array.length - 1) return
      tile.addEventListener(
        "transitionend",
        () => {
          startInteraction()
          checkWinLose(guess, array)
        },
        { once: true }
      )
    },
    { once: true }
  )
}

const submitGuess = async () => {
  const activeTiles = [...getActiveTiles()]
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not enough letters")
    await shakeTiles(activeTiles)
    return
  }

  const guess = activeTiles.reduce(
    (word, tile) => word + tile.dataset.letter,
    ""
  )

  if (!dictionary.includes(guess)) {
    showAlert("Not in word list")
    await shakeTiles(activeTiles)
    return
  }

  stopInteraction()
  activeTiles.forEach((...params) => flipTile(...params, guess))
}

function handleMouseClick({ target }) {
  target.matches("[data-key]")
    ? pressKey(target.dataset.key)
    : target.matches("[data-enter]")
    ? submitGuess()
    : target.matches("[data-delete] *")
    ? deleteKey()
    : null
}

function handleKeyPress({ key }) {
  key === "Enter"
    ? submitGuess()
    : key === "Backspace"
    ? deleteKey()
    : key.match(/^[a-zA-Z]$/)
    ? pressKey(key)
    : null
}

function startInteraction() {
  document.addEventListener("click", handleMouseClick)
  document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick)
  document.removeEventListener("keydown", handleKeyPress)
}

//! Starting the game
startInteraction()
