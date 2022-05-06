import React from 'react';

const exports = {};

exports.GetGuess = class extends React.Component {
  render() {
    const { parent, playable } = this.props;
    const guess = (this.state || {}).guess || "";
    return (
      <div>
        {!playable ? 'Please wait...' : ''}
        <br />
        Guess for the sum of the hands:
        <input
          type='text'
          disabled={!playable}
          onChange={(e) => this.setState({ guess: e.currentTarget.value })}
        />
        <br />
        <button
          disabled={!playable}
          onClick={() => parent.makeGuess(guess)}
        >Make Guess</button>
      </div>
    );
  }
}

exports.GetHand = class extends React.Component {
  render() {
    const { parent, playable, hand } = this.props;
    const handToPlay = (this.state || {}).handToPlay || "";

    const handleHandChange = (e) => {
      console.log("New hand: ", e.currentTarget.value);
      this.setState({ handToPlay: e.currentTarget.value });
    }

    return (
      <div>
        {hand ? 'No winner from the last round, play another hand!' : ''}
        <br />
        {!playable ? 'Please wait...' : ''}
        <br />
        How many fingers?:
        <div>
          <div>
            <input type="radio" id="hand0"
              name="hand" value="0" onChange={handleHandChange} />
            <label for="hand0">0</label>
            <input type="radio" id="hand1"
              name="hand" value="1" onChange={handleHandChange} />
            <label for="hand1">1</label>
            <input type="radio" id="hand2"
              name="hand" value="2" onChange={handleHandChange} />
            <label for="hand2">2</label>
            <input type="radio" id="hand3"
              name="hand" value="3" onChange={handleHandChange} />
            <label for="hand3">3</label>
            <input type="radio" id="hand4"
              name="hand" value="4" onChange={handleHandChange} />
            <label for="hand4">4</label>
            <input type="radio" id="hand5"
              name="hand" value="5" onChange={handleHandChange} />
            <label for="hand5">5</label>
          </div>
          <br />
          <button
            onClick={() => parent.setHand(handToPlay)}
          >Set Hand</button>
        </div >
      </div>
    );
  }
}

exports.WaitingForResults = class extends React.Component {
  render() {
    return (
      <div>
        Waiting for results...
      </div>
    );
  }
}

exports.Done = class extends React.Component {
  render() {
    const { outcome } = this.props;
    return (
      <div>
        Thank you for playing. The outcome of this game was:
        <br />{outcome || 'Unknown'}
      </div>
    );
  }
}

exports.Timeout = class extends React.Component {
  render() {
    return (
      <div>
        There's been a timeout. (Someone took too long.)
      </div>
    );
  }
}

export default exports;
