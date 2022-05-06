import React from 'react';
import AppViews from './views/AppViews';
import DeployerViews from './views/DeployerViews';
import AttacherViews from './views/AttacherViews';
import { renderDOM, renderView } from './views/render';
import './index.css';
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
const reach = loadStdlib(process.env);

const outcomes = ['Player 1 wins!', 'Player 2 wins!'];
const { standardUnit } = reach;
const defaults = { defaultWager: '5', standardUnit };

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: 'ConnectAccount', ...defaults };
  }
  async componentDidMount() {
    const startingBalance = reach.parseCurrency(100);
    const acc = await reach.newTestAccount(startingBalance);
    // const acc = await reach.getDefaultAccount(); // for linking with their Metamask or Algo wallet
    const balAtomic = await reach.balanceOf(acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({ acc, bal, view: 'DeployerOrAttacher' });
  }

  selectAttacher() { this.setState({ view: 'Wrapper', ContentView: Attacher }); }
  selectDeployer() { this.setState({ view: 'Wrapper', ContentView: Deployer }); }
  render() { return renderView(this, AppViews); }
}

class Player extends React.Component {
  random() { return reach.hasRandom.random(); }
  async getHand() {
    const hand = await new Promise(resolveHandP => {
      this.setState({ view: 'GetHand', playable: true, resolveHandP });
    });
    this.setState({ hand });
    return hand;
  }
  async getGuess() {
    const guess = await new Promise(resolveGuessP => {
      this.setState({ view: 'GetGuess', playable: true, resolveGuessP });
    });
    this.setState({ view: 'WaitingForResults', guess });
    return guess;
  }

  seeWinner(i) { this.setState({ view: 'Done', outcome: outcomes[i - 1] }); }
  informTimeout() { this.setState({ view: 'Timeout' }); }
  setHand(hand) { this.state.resolveHandP(hand); }
  makeGuess(guess) { this.state.resolveGuessP(guess); }
}

class Deployer extends Player {
  constructor(props) {
    super(props);
    this.state = { view: 'SetWager' };
  }
  setWager(wager) { this.setState({ view: 'Deploy', wager }); }
  async deploy() {
    const ctc = this.props.acc.contract(backend);
    this.setState({ view: 'Deploying', ctc });
    this.wager = reach.parseCurrency(this.state.wager);
    this.deadline = 50;
    backend.Player1(ctc, this);
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
    this.setState({ view: 'WaitingForAttacher', ctcInfoStr });
  }
  render() { return renderView(this, DeployerViews); }
}
class Attacher extends Player {
  constructor(props) {
    super(props);
    this.state = { view: 'Attach' };
  }
  attach(ctcInfoStr, word) {
    const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
    this.setState({ view: 'Attaching' });
    backend.Player2(ctc, this);
  }
  async acceptWager(wagerAtomic) {
    const wager = reach.formatCurrency(wagerAtomic, 4);
    return await new Promise(resolveAcceptedP => {
      this.setState({ view: 'AcceptTerms', wager, resolveAcceptedP });
    });
  }

  async termsAccepted() {
    this.state.resolveAcceptedP();
    // return await new Promise(resolveSetHandP => {
    //   this.setState({ view: 'SetHand', resolveSetHandP });
    // });
  }
  readyToBegin() {
    this.state.resolveAcceptedP();
    this.setState({ view: 'WaitingForTurn' });
  }
  render() { return renderView(this, AttacherViews); }
}

renderDOM(<App />);
