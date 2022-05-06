'reach 0.1';

const [isPlayerHand, ZERO, ONE, TWO, THREE, FOUR, FIVE] = makeEnum(6);
const [isPlayerGuess, SUM_ZERO, SUM_ONE, SUM_TWO, SUM_THREE, SUM_FOUR, SUM_FIVE, SUM_SIX, SUM_SEVEN, SUM_EIGHT, SUM_NINE, SUM_TEN] = makeEnum(11);
const [isOutcome, CONTINUE, ONE_WINS, TWO_WINS] = makeEnum(3);

// determines the round winner
// result = 1 if Player2 guesses correctly, 2 if Player1 guesses correctly, and 0 if either both guess correctly or neither guesses correctly 
const roundWinner = (handPlayer1, guessPlayer1, handPlayer2, guessPlayer2) => {
    const roundTotal = handPlayer1 + handPlayer2;

    const player1Correct = guessPlayer1 == roundTotal ? 1 : 0
    const player2Correct = guessPlayer2 == roundTotal ? 2 : 0
    return (player1Correct + player2Correct) % 3;
};

assert(roundWinner(TWO, SUM_SEVEN, FOUR, SUM_FIVE) == CONTINUE);
assert(roundWinner(ONE, SUM_ONE, ONE, SUM_TWO) == TWO_WINS);
assert(roundWinner(FOUR, SUM_SIX, TWO, SUM_TWO) == ONE_WINS);
assert(roundWinner(FOUR, SUM_SEVEN, THREE, SUM_SEVEN) == CONTINUE);

const Player = {
    ...hasRandom,
    getHand: Fun([], UInt),
    getGuess: Fun([], UInt),
    seeWinner: Fun([UInt], Null),
    informTimeout: Fun([], Null),
};

export const main = Reach.App(() => {
    // PLAYER DECLARATIONS
    const Player1 = Participant('Player1', {
        ...Player,
        wager: UInt,
        deadline: UInt,
    });
    const Player2 = Participant('Player2', {
        ...Player,
        acceptWager: Fun([UInt], Null),
    });
    init();

    // GAME SETUP
    const informTimeout = () => {
        each([Player1, Player2], () => {
            interact.informTimeout();
        });
    };

    Player1.only(() => {
        const wager = declassify(interact.wager);
        const deadline = declassify(interact.deadline);
    });
    Player1.publish(wager, deadline)
        .pay(wager);
    commit();

    Player2.only(() => {
        interact.acceptWager(wager);
    });
    Player2.pay(wager)
        .timeout(relativeTime(deadline), () => closeTo(Player1, informTimeout)); // if doesn't complete action before timeout, application transfers to step given by arrow function


    // GAME LOGIC    
    var roundOutcome = CONTINUE;
    invariant(balance() == 2 * wager && isOutcome(roundOutcome));
    while (roundOutcome == CONTINUE) {
        commit();
        // read and encrypt Player1's hand and guess
        Player1.only(() => {
            const handPlayer1 = declassify(interact.getHand());
            //const [_commitHandPlayer1, _saltHandPlayer1] = makeCommitment(interact, _handPlayer1);
            //const commitHandPlayer1 = declassify(_commitHandPlayer1);

            const guessPlayer1 = declassify(interact.getGuess());
            //const [_commitGuessPlayer1, _saltGuessPlayer1] = makeCommitment(interact, _guessPlayer1);
            //const commitGuessPlayer1 = declassify(_commitGuessPlayer1);
        });
        Player1.publish(handPlayer1, guessPlayer1)
            .timeout(relativeTime(deadline), () => closeTo(Player2, informTimeout));
        commit();

        // check that Player2 cannot know anything about Player1's hand or guess, and then get Player2's hand and guess
        //unknowable(Player2, Player1(_commitHandPlayer1, _saltHandPlayer1, _commitGuessPlayer1, _saltGuessPlayer1));
        Player2.only(() => {
            const handPlayer2 = declassify(interact.getHand());
            const guessPlayer2 = declassify(interact.getGuess());
        });
        Player2.publish(handPlayer2, guessPlayer2)
            .timeout(relativeTime(deadline), () => closeTo(Player1, informTimeout));

        // // decrypt Player1's hand and guess
        // Player1.only(() => {
        //     const saltHandPlayer1 = declassify(_saltHandPlayer1);
        //     const handPlayer1 = declassify(_commitHandPlayer1);

        //     const saltGuessPlayer1 = declassify(_saltGuessPlayer1);
        //     const guessPlayer1 = declassify(_commitGuessPlayer1)
        // });
        // Player1.publish(saltHandPlayer1, handPlayer1, saltGuessPlayer1, guessPlayer1)
        //     .timeout(relativeTime(deadline), () => closeTo(Player2, informTimeout));

        // // check that Player1's hand and guess were properly decrypted and read
        // checkCommitment(commitHandPlayer1, saltHandPlayer1, handPlayer1);
        // checkCommitment(commitGuessPlayer1, saltGuessPlayer1, guessPlayer1);

        // ^ couldn't get check commitment to work :/

        roundOutcome = roundWinner(handPlayer1, guessPlayer1, handPlayer2, guessPlayer2);
        continue;
    }

    assert(roundOutcome == ONE_WINS || roundOutcome == TWO_WINS);
    transfer(2 * wager).to(roundOutcome == ONE_WINS ? Player1 : Player2);
    commit();

    each([Player1, Player2], () => {
        interact.seeWinner(roundOutcome);
    });

});


