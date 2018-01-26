(function (axios, document, window) {
    let LOCKED_COINS = [];

    const print = node => data => node.innerHTML = data;
    const sortDescBy = (prop, data) => data.sort((a, b) => b[prop] - a[prop]);
    const convertToBTC = value => `${Number(value).toFixed(8)} BTC`;
    const arrayLikeToArray = arrayLike => Array.from(arrayLike);
    const checkIfIsLocked = name => LOCKED_COINS.indexOf(name) === -1 ? false : true;

    const convertToBRL = value => `R$ ${value.toFixed(2).toString().replace('.', ',')}`;

    const percentageBalanceByAmount = (balance, amount) => `${(+balance / +amount * 100).toFixed(2)}%`;

    const getDataOfCoins = (coins, currency) => {
        const from = 'https://api.coinmarketcap.com/v1/ticker';
        const coinsSymbol = Object.keys(coins);
        const reqs = coinsSymbol.map(coin => axios.get(`${from}/${coin}/?convert=${currency}`));

        return axios.all(reqs).then(axios.spread((...coins) => {
            return coins.map(coin => coin.data[0]);
        }));
    };

    const getAmountByCoins = (data, coins, currency) => {
        return data.reduce((start, coin) => {
            const balance = +coin[`price_${currency.toLowerCase()}`] * coins[coin.id];
            const amount = start + (checkIfIsLocked(coin.symbol) ? 0 : balance);

            return amount;
        }, 0);
    };

    const mergeBalanceAndSetPrice = coins => {
        return currency => {
            return coin => {
                coin.price = +coin[`price_${currency.toLowerCase()}`];
                coin.balance = coins[coin.id] * coin.price;
                coin.balance_btc = coins[coin.id] * coin.price_btc;

                return coin;
            };
        };
    };

    const coinsDataGram = amount => {
        return coin => {
            const isLocked = checkIfIsLocked(coin.symbol);

            return {
                name: coin.name,
                symbol: coin.symbol,
                price: +coin.price,
                price_btc: convertToBTC(+coin.price_btc),
                balance: convertToBRL(isLocked ? 0 : +coin.balance),
                balance_btc: convertToBTC(isLocked ? 0 : +coin.balance_btc),
                balanceRaw: isLocked ? 0 : +coin.balance,
                importance: percentageBalanceByAmount(isLocked ? 0 : +coin.balance, amount)
            };
        };
    };

    const useCoinButton = function () {
        const symbol = this.dataset.coin;
        const IsBlocked = name => LOCKED_COINS.indexOf(name);

        if (IsBlocked(symbol) === -1) LOCKED_COINS.push(symbol);else LOCKED_COINS.splice(IsBlocked(symbol), 1);

        init(window.MY_GOAL.coins, window.MY_GOAL.currency, window.MY_GOAL.goal);

        return;
    };

    const handleUseCoinClick = node => {
        return node.addEventListener('click', useCoinButton.bind(node), false);
    };

    const listCoinComponent = coin => {
        return `<li class="coin-list ${checkIfIsLocked(coin.symbol) ? 'no-show' : ''}">
                <span class="list-item coin">${coin.name} (${coin.price_btc})</span>
                <span class="list-item balance">${coin.balance} (${coin.balance_btc})</span>
                <span class="list-item represent-percentage">${coin.importance}</span>
                <button class="list-item use-coin" data-coin=${coin.symbol}>
                    <img class="show-coin"
                        src="img/visibility.svg"
                        alt="Remover moeda da lista"
                        title="Remover moeda da lista">
                </button>
            </li>`;
    };

    const showList = coinsList => {
        const printList = print(document.getElementById('coins-list'));
        const listCoinsDOM = coinsList.map(listCoinComponent).join('\n');

        printList('');
        printList(listCoinsDOM);

        return;
    };

    const checkGoal = (amount, goal) => {
        const detailGoalNode = document.getElementById('detail-goal');
        const progressNode = document.getElementById('progress');
        const printGoal = print(detailGoalNode);
        const progress = percentageBalanceByAmount(amount, goal);

        if (amount >= goal) {
            printGoal('Parabéns! Você atingiu sua meta! Que tal aproveitar seus lucros?');
        } else {
            printGoal(`Você já atingiu <strong>${progress}</strong> da meta!`);
        }

        progressNode.style.width = +progress.replace('%', '') >= 100 ? '100%' : progress;
    };

    const init = async (coins, currency, goal) => {
        const balanceNode = document.getElementById('amount');
        const goalNode = document.getElementById('goal');
        const useCoinNode = document.getElementsByClassName('use-coin');

        const data = await getDataOfCoins(coins, currency);
        const amount = getAmountByCoins(data, coins, currency);

        print(goalNode)(`${convertToBRL(goal)}.`);
        print(balanceNode)(`${convertToBRL(amount)}.`);
        checkGoal(amount, goal);

        const coinsList = data.map(mergeBalanceAndSetPrice(coins)(currency)).map(coinsDataGram(amount));

        sortDescBy('balanceRaw', coinsList);
        showList(coinsList);
        arrayLikeToArray(useCoinNode).forEach(handleUseCoinClick);
    };

    init(window.MY_GOAL.coins, window.MY_GOAL.currency, window.MY_GOAL.goal);
    setInterval(() => init(window.MY_GOAL.coins, window.MY_GOAL.currency, window.MY_GOAL.goal), 10000);
})(axios, document, window);