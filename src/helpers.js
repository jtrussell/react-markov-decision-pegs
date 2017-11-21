
/**
 * Constants to indicate whether or not a board position has a peg
 */
export const OCCUPIED = '1'
export const VACANT = '0'

/**
 * We assumes this grid numbering system:
 *
 *         0
 *       1  2
 *     3  4  5
 *   6  7  8  9
 * 10 11 12 13 14
 *
 * An `m in MOVES` should be interpretted as picking up the peg at position
 * `m[0]` and placing it postion `m[1]` thereby "jumping" the peg in between
 *
 * A move is only legal if:
 *
 * - There **is** a peg at `m[0]`
 * - There **is not** a peg at `m[1]`
 * - There **is** a peg at `Math.floor((m[0] + m[1]) / 2)`. I.e. there is a
 *   peg between the two positions to jump.
 *
 * Having an ordered list of moves also allows us to refer to moves by their
 * position in this list.
 */
export const MOVES = [
  [0, 3], [0, 5],
  [1, 6], [1, 8],
  [2, 7], [2, 9],
  [3, 5], [3, 10], [3, 12],
  [4, 11], [4, 13],
  [5, 12], [5, 14],
  [6, 8],
  [7, 9],
  [10, 12],
  [11, 13],
  [12, 14]
].reduce((ALL_MOVES, m) => {
  ALL_MOVES.push(m) // The downward move listed above
  ALL_MOVES.push([m[1], m[0]]) // The reverse move
  return ALL_MOVES
}, [])

/**
 * The above list of moves as an adjacency matrix
 */
export const MOVES_ADJ = Array(15).fill(0).map((_, ix) => {
  return MOVES
    .filter(m => m[0] === ix)
    .map(m => m[1])
})

export const getJumpedPosition = (move) => {
  return Math.floor((move[0] + move[1]) / 2)
}

/**
 * Return a list of the legal moves from a given state
 */
export const getLegalMoves = (startState) => {
  const legalMoves = []
  for (let ix = 15; ix--;) {
    if (startState[ix] === OCCUPIED) {
      MOVES_ADJ[ix] // Possible spaces to move to
        .filter(toIx => startState[toIx] === VACANT) // That are vacant
        .filter(toIx => startState[Math.floor((ix + toIx ) / 2)] === OCCUPIED) // And make us jump a peg
        .forEach(toIx => {
          legalMoves.push([ix, toIx])
        })
    }
  }
  return legalMoves
}

/**
 * Applies a move to a start and returns the new board state
 */
export const getNextState = (startState, move) => {
  const ix = move[0]
  const toIx = move[1]
  const jumpIx = getJumpedPosition(move)
  let nextState = startState
  nextState = nextState.substr(0, ix) + '0' + nextState.substr(ix + 1)
  nextState = nextState.substr(0, jumpIx) + '0' + nextState.substr(jumpIx + 1)
  nextState = nextState.substr(0, toIx) + '1' + nextState.substr(toIx + 1)
  return nextState
}

/**
 * A state looks like a string with 15 characters.
 *
 * Each character index corresponds to a position in the grid numbering system
 * listed above. A `1` indicates there is a peg at that postion, a `0` indicates
 * that position is open (no peg).
 *
 * To keep numbers small, we'll fix a starting state and only enumerate the
 * possible states given that starting state.
 */
export const INITIAL_STATE = '011111111111111'
export const ALL_STATES = []

const visitedStates = {}
const statesToVisit = [INITIAL_STATE]

// There are only about 3,016 reachable states. The guard on ALL_STATES.length
// is just catch issues during development ;).
while (statesToVisit.length && ALL_STATES.length < 5000) {
  const s = statesToVisit.shift()
  ALL_STATES.push(s)
  visitedStates[s] = 1
  getLegalMoves(s)
    .map(m => getNextState(s, m))
    .filter(nextState => !visitedStates.hasOwnProperty(nextState))
    .forEach(nextState => {
      statesToVisit.push(nextState)
      visitedStates[nextState] = 1
    })
}

/**
 * Humans like name tags
 */
export const ixToLabel = (ix) => {
  return 'ABCDEFGHIJKLMNO'[ix]
}

/**
 * An IID chooser
 */
export const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

/**
 * Sometimes things don't quite go as we planned...
 *
 * - 70% the asked for more is performed
 * - 20% another with the same starting position is performed
 * - 10% another move is performed
 *
 * When there are no other moves from the same starting position we use an 80/20
 * split.
 */
export const fuzzifyMove = (state, move) => {
  if (Math.random() < 0.70) {
    return move
  }

  const differentMoves = getLegalMoves(state)
    .filter(m => m[0] !== move[0] || m[1] !== move[1])

  const sameStartMoves = differentMoves
    .filter(m => m[0] === move[0])

  const diffStartMoves = differentMoves
    .filter(m => m[0] !== move[0])

  if (sameStartMoves.length) {
    if (!differentMoves.length || Math.random() < 0.67) {
      return random(sameStartMoves)
    }
  }

  if (diffStartMoves.length) {
    return random(diffStartMoves)
  }

  // No different moves :(
  return move
}

/**
 * Scoring:
 *
 * - The first captured peg is worth 10 points
 * - Every other captured peg is worth 1o points more than the one before it.
 *   I.e. fibonacci scoring.
 * - You get a final bonus having pegs near the 0th position
 */
export const getScore = (state) => {
  const stateArr = state.split('')

  let nextScore = 0

  const baseScore = stateArr
    .filter(peg => peg === VACANT)
    .map(() => 10 * nextScore++)
    .reduce((totalScore, pegScore) => totalScore + pegScore)

  const occupiedIndexes = stateArr
    .map((peg, ix) => peg === OCCUPIED ? 15 - ix : 0)
    .filter(ix => ix > 0)

  const bonusMultiplier = 14 - occupiedIndexes.length

  let bonus = occupiedIndexes.reduce((a, b) => a + b) 
  bonus = bonus / occupiedIndexes.length
  bonus = Math.ceil(bonusMultiplier * bonus)

  return [baseScore, bonus]
}

// For playing in the console
window.ALL_STATES = ALL_STATES
window.MOVES = MOVES
window.MOVES_ADJ = MOVES_ADJ

console.log('See window.[ALL_STATES | MOVES | MOVES_ADJ]')
console.log(`Num reachable states: ${ALL_STATES.length}`)
console.log(`Num possible moves: ${MOVES.length}`)
