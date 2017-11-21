
import React, { Component } from 'react'
import * as helpers from './helpers'
import './app.css'

class App extends Component {
  render () {
    return (
      <div className='container'>
        <div className='row justify-content-center'>
          <div className='col-md-8'>
            <h1 className='app__title' style={{marginTop: '1em'}}>
              Markov Decision Pegs
            </h1>
            <p>
              <a href='https://en.wikipedia.org/wiki/Peg_solitaire'>
                Tell me more.
              </a>
            </p>
            <Game />
            <Rules />
          </div>
        </div>
      </div>
    )
  }
}

/**
 * Bad form to have multiple classes in the same file... but this is a toy ;)
 */
class Game extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fuzzify: true,
      boardPosition: helpers.INITIAL_STATE
    }

    this.randomMove = this.randomMove.bind(this)
    this.reset = this.reset.bind(this)
  }

  randomMove () {
    const { boardPosition } = this.state
    const moves = helpers.getLegalMoves(boardPosition)
    const m = helpers.random(moves)
    const nextPosition = helpers.getNextState(boardPosition, m)
    this.updateBoard(nextPosition)
  }

  /**
   * Moves have an 80% success rate
   *
   * - 80% the asked for more is performed
   * - 15% another with the same starting position is performed
   * - 5% another move is performed
   */
  attemptMove (move) {
    const { boardPosition, fuzzify } = this.state
    if (fuzzify) {
      move = helpers.fuzzifyMove(boardPosition, move)
    }
    this.updateBoard(helpers.getNextState(boardPosition, move))
  }

  reset () {
    this.setState({
      boardPosition: helpers.INITIAL_STATE
    })
  }

  updateBoard (boardPosition) {
    this.setState({
      boardPosition
    })
  }

  render () {
    const { boardPosition, fuzzify } = this.state
    const legalMoves = helpers.getLegalMoves(boardPosition)
    const isFinished = !legalMoves.length

    const className = [
      'game',
      isFinished && 'game--status-finished'
    ].filter(Boolean).join(' ')

    const score = helpers.getScore(boardPosition)
    const baseScore = score[0]
    const bonusScore = score[1]
    const totalScore = baseScore + bonusScore

    return (
      <div className={className}>
        <div className='game__board'>
          <Board positions={boardPosition} />
        </div>
        <div className='game__controls' style={{display: 'flex'}}>
          <button onClick={this.randomMove}
            disabled={isFinished}
            className='btn btn-outline-primary'>
            Random move
          </button>
          {legalMoves.map((m, ix) => (
            <button key={ix}
              onClick={this.attemptMove.bind(this, m)}
              className='btn btn-outline-success'>
              {helpers.ixToLabel(m[0])}
              &nbsp;&rarr;&nbsp;
              {helpers.ixToLabel(m[1])}
            </button>
          ))}
          <div style={{marginLeft: 'auto'}} />
          <button onClick={this.reset}
            className='btn btn-outline-danger'>
            Start over
          </button>
        </div>
        <div className='form-check'>
          <label className='form-check-label'>
            <input type='checkbox'
              className='form-check-input'
              checked={fuzzify}
              onChange={() => this.setState({ fuzzify: !fuzzify })} />
            Fuzzy moves
          </label>
        </div>
        <div>
          Score: {baseScore},
          Bonus: {bonusScore},
          Total: {totalScore}
        </div>
      </div>
    )
  }
}

const Rules = () => (
  <div className='rules'>
    <h2>The Rules</h2>
    <p>It's peg solitaire... that triangular pegs game you've probably seen in
      restaurants.</p>
    <p>Use the buttons above to move pegs around the board. <code>D &rarr;
      A</code> indicates moving a peg from position <code>D</code> to position
      <code>A</code>, capturing the peg at position <code>B</code> in the
      process.</p>
    <p>While "fuzzy moves" are enabled you may not always get what you ask for.
      The game will select a different move for you about 30% of the time and
      it'll favor moves using the same starting peg.</p>

    <h3>Scoring</h3>
    <p>The first peg you capture is worth <code>10</code> points. Each
      subsequent peg is worth <code>10</code> points more than the last one
      captured.</p>
    <p>There's also a super secret bonus you can get! Try to end the game with
      as few pegs as possible <strong>and</strong> with them as close as
      possible to the top of the triangle.</p>
    <p>Ending the game with one peg in position <code>A</code> will get you the
      maximum bonus (and highest possible overall score).</p>
  </div>
)

const Board = ({ positions }) => (
  <div className='board'>
    <BoardRow startIx={0} positions={positions.slice(0, 1)} />
    <BoardRow startIx={1} positions={positions.slice(1, 3)} />
    <BoardRow startIx={3} positions={positions.slice(3, 6)} />
    <BoardRow startIx={6} positions={positions.slice(6, 10)} />
    <BoardRow startIx={10} positions={positions.slice(10, 15)} />
  </div>
)

const BoardRow = ({ startIx, positions }) => (
  <div className='board__row'>
    {positions.split('').map((occupied, ix) => (
      <div key={ix} className={`board__pos board__pos--occupied-${occupied}`}>
        {helpers.ixToLabel(startIx + ix)}
      </div>
    ))}
  </div>
)

export default App
