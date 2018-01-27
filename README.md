# Qual sua meta?

> Qual sua meta é simplemente uma ferramenta que ajudará você na hora de contabilizar
> o seu saldo em criptomoedas.

## Como usá-la?

> Simples! Faça download dos arquivos em seu computador, edite a variável global disponível no
> `public/index.html` e abra no seu navegador favorito! Isso é importante porque não coloca nenhuma
> referência do seu portifólio online.

### Exemplo:

```html
<script type="text/javascript">
    var MY_GOAL = {
        currency: 'BRL', // Moeda para mostragem dos valores.
        coins: { // Moedas do seu portifólio.
            bitcoin: 0.5,
            ethereum: 1.7
        },
        goal: 50000 // Sua meta!
    };
</script>
```

## Observações:

- Usamos o [CoinMarketCap] para obter os dados, portanto, a nome da moeda aqui adicionada deve corresponder com o id da mesma na API;
- Foi testado apenas no Google Chrome e não está responsivo (ainda) \`:^P.


[CoinMarketCap]: <https://coinmarketcap.com>
