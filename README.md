# Beacon Reader MWC01

App mobile (React Native + Expo) pra escanear crachás Minew MWC01 por Bluetooth Low
Energy e ver bateria, sinal e distância aproximada de cada um — uma alternativa mais
simples e rápida que o app proprietário usado hoje, focada só em leitura.

## Contexto

Os crachás MWC01 são usados para georeferenciamento de pessoal em obras. O app
proprietário atual lista os crachás ligados nas proximidades e permite configurá-los,
mas a interface é lenta e confusa pra uma tarefa tão simples quanto "ver a bateria e o
sinal de um crachá". Esse projeto nasce como uma ferramenta pessoal de leitura, com uma
interface limpa — sem reimplementar a configuração/escrita, que fica fora de escopo por
enquanto.

> O documento [`DOC-ORIGINAL.md`](./DOC-ORIGINAL.md) guardado no repo foi o rascunho que
> deu origem à ideia. Ele tem alguns pontos inventados/imprecisos (prazos, detalhes
> técnicos) — não é fonte de verdade, só histórico de como o projeto começou.

## Funcionalidades (MVP — só leitura)

- Escaneia dispositivos BLE por perto e lista ordenado por proximidade (RSSI).
- Filtro **"Crachás"** (só os reconhecidos) vs. **"Todos"** (qualquer dispositivo BLE ao redor).
- Ao tocar em "Ler bateria": conecta no crachá, lê o nível de bateria (Battery Service
  padrão Bluetooth, `0x180F`/`0x2A19`) e desconecta.
- Mostra MAC/id, RSSI e distância aproximada (`10^((txPower - RSSI)/20)`).
- **"Marcar como crachá"**: no filtro "Todos", ao achar o crachá físico na lista (ligue-o
  e veja o nome que aparece), tocar nesse botão ensina o app a reconhecer aquele nome
  como crachá dali em diante — não precisa de nenhuma ferramenta externa de inspeção BLE.

**Fora de escopo por enquanto:** escrever configuração / desligar remotamente,
múltiplos usuários, backend, integração com sistemas externos.

## Stack

- React Native + Expo (SDK 57)
- [`react-native-ble-manager`](https://github.com/innoveit/react-native-ble-manager) — scan/conexão BLE, com suporte à New Architecture
- `@react-native-async-storage/async-storage` — persistência local (assinaturas de crachá aprendidas)

## Como rodar

Esse app usa um módulo nativo de Bluetooth, então **o Expo Go não funciona** — é
preciso gerar um build de desenvolvimento:

```bash
npm install

# gera as pastas nativas (android/ e ios/) a partir da config do app.json
npm run prebuild

# compila e instala num Android conectado via USB (ou emulador)
npm run android
```

Isso exige o Android SDK instalado (via Android Studio, ou as command line tools). Sem
isso localmente, dá pra usar `eas build --profile development --platform android`
(build na nuvem da Expo, precisa de conta gratuita).

## Estrutura

```
App.js                        # entrada, renderiza a ScanScreen
src/
  ble/
    permissions.js            # runtime permissions Android (BLUETOOTH_SCAN/CONNECT ou location)
    uuid.js                   # normalização de UUID + constantes do Battery Service
    distance.js               # RSSI -> distância aproximada
    badgeSignature.js         # heurística de reconhecimento de crachá por nome
  hooks/
    useBleScanner.js          # toda a lógica de scan/conexão/leitura de bateria
  storage/
    appStorage.js             # AsyncStorage: assinaturas de crachá aprendidas + apelidos
  components/
    DeviceCard.js, BatteryBadge.js, FilterToggle.js, EmptyState.js
  screens/
    ScanScreen.js              # tela única do MVP
```

## Como usar

1. Abra o app com Bluetooth ligado e toque em **Escanear**.
2. Se o filtro "Crachás" vier vazio (primeira vez), mude pra **Todos**, ligue um crachá
   MWC01 físico perto do celular e ache ele na lista.
3. Toque em **Marcar como crachá** nesse item — o app aprende e passa a filtrar por ele.
4. Toque em **Ler bateria** em qualquer crachá da lista pra conectar e ver o nível.

## Troubleshooting

| Problema | Causa provável |
|----------|-----------------|
| App não acha nenhum dispositivo | Bluetooth desligado, permissão negada, ou nenhum crachá ligado por perto |
| Filtro "Crachás" sempre vazio | Ainda não foi ensinado — use "Todos" e "Marcar como crachá" num item que seja de fato um MWC01 |
| "Ler bateria" dá erro | Nem todo firmware do MWC01 expõe o Battery Service padrão — vale inspecionar o que `retrieveServices` retorna pra esse crachá |
| Distância muito imprecisa | RSSI varia com obstáculos/corpo/orientação do crachá — é uma referência de proximidade, não uma medição confiável |

## Status

MVP de leitura (v0.1) — uso pessoal, plataforma-alvo Android.
