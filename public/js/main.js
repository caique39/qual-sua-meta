(function (axios, OSREC, document, window) {
    let LOCKED_COINS = [];

    // MY_GOAL :: Window
    const COINS = window.MY_GOAL.coins;
    const CURRENCY = window.MY_GOAL.currency;
    const GOAL = window.MY_GOAL.goal;

    // * :: Document
    const balanceNode = document.getElementById('amount');
    const goalNode = document.getElementById('goal');
    const useCoinNode = document.getElementsByClassName('use-coin');
    const detailGoalNode = document.getElementById('detail-goal');
    const progressNode = document.getElementById('progress');

    const print = node => data => node.innerHTML = data;
    const sortDescBy = (prop, data) => data.sort((a, b) => b[prop] - a[prop]);
    const arrayLikeToArray = arrayLike => Array.from(arrayLike);

    const checkIfIsLocked = name => LOCKED_COINS.indexOf(name) === -1 ? false : true;

    const convertToBTC = value => `${Number(value).toFixed(8)} BTC`;
    const convertTo = currency => value => OSREC.CurrencyFormatter.format(+value, { currency: currency.toUpperCase() });
    const convertToDefault = convertTo(CURRENCY);

    const percentageBalanceByAmount = (balance, amount) => {
        const percentage = +balance / +amount * 100 || 0;

        return `${percentage.toFixed(2)}%`;
    };

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
                balance: convertToDefault(isLocked ? 0 : +coin.balance),
                balance_btc: convertToBTC(isLocked ? 0 : +coin.balance_btc),
                balanceRaw: isLocked ? 0 : +coin.balance,
                importance: percentageBalanceByAmount(isLocked ? 0 : +coin.balance, amount)
            };
        };
    };

    const useCoinButton = node => {
        const symbol = node.dataset.coin;
        const isBlocked = name => LOCKED_COINS.indexOf(name);

        if (!~isBlocked(symbol)) {
            LOCKED_COINS.push(symbol);
        } else {
            LOCKED_COINS.splice(isBlocked(symbol), 1);
        }

        init();
    };

    const handleUseCoinClick = node => {
        return node.addEventListener('click', useCoinButton.bind(null, node), false);
    };

    const listCoinComponent = coin => {
        return `<li class="coin-list ${checkIfIsLocked(coin.symbol) ? 'no-show' : ''}">
                <span class="list-item coin">${coin.name} (${coin.price_btc})</span>
                <span class="list-item balance">${coin.balance} (${coin.balance_btc})</span>
                <span class="list-item represent-percentage">${coin.importance}</span>
                <button class="list-item use-coin" data-coin=${coin.symbol}>
                    <img class="show-coin"
                        src="img/visibility.svg"
                        alt="Não contabilizar moeda"
                        title="Não contabilizar moeda">
                </button>
            </li>`;
    };

    const mapCoinList = (data, amount) => {
        const coinsList = data.map(mergeBalanceAndSetPrice(COINS)(CURRENCY)).map(coinsDataGram(amount));

        return sortDescBy('balanceRaw', coinsList);
    };

    const showList = coinsList => {
        const printList = print(document.getElementById('coins-list'));
        const listCoinsDOM = coinsList.map(listCoinComponent).join('\n');

        printList('');
        printList(listCoinsDOM);
    };

    const checkGoal = (amount, goal) => {
        const printGoal = print(detailGoalNode);
        const progress = percentageBalanceByAmount(amount, goal);

        if (amount >= goal) {
            printGoal('Parabéns! Você atingiu sua meta! Que tal aproveitar seus lucros?');
        } else {
            printGoal(`Você já atingiu <strong>${progress}</strong> da meta!`);
        }

        progressNode.style.width = +progress.replace('%', '') >= 100 ? '100%' : progress;
    };

    const init = async () => {
        const data = await getDataOfCoins(COINS, CURRENCY);
        const amount = getAmountByCoins(data, COINS, CURRENCY);

        print(goalNode)(`${convertToDefault(GOAL)}.`);
        print(balanceNode)(`${convertToDefault(amount)}`);

        checkGoal(amount, GOAL);
        showList(mapCoinList(data, amount));

        arrayLikeToArray(useCoinNode).forEach(handleUseCoinClick);
    };

    init();
    setInterval(() => init(), 10000);
})(axios, OSREC, document, window);