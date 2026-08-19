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
- **Bateria em tempo real, sem conectar**: a Minew manda a bateria no próprio pacote de
  advertising, num frame público Eddystone-TLM (voltagem exata em mV + uma estimativa de
  %). De brinde vem temperatura interna e tempo ligado.
- Mostra MAC/id, RSSI e distância aproximada (`10^((txPower - RSSI)/20)`).
- Tocar num crachá na lista abre uma tela de detalhe com **apelido persistido** (associado
  ao MAC, sobrevive a reabrir o app) e diagnóstico avançado: serviços/characteristics GATT
  encontrados, advertising bruto (serviceData/manufacturerData), e leitura manual de
  qualquer characteristic legível — útil pra investigar firmware que não segue padrão.
- **"Marcar como crachá"**: no filtro "Todos", ao achar o crachá físico na lista (ligue-o
  e veja o nome que aparece), tocar nesse botão ensina o app a reconhecer aquele nome
  como crachá dali em diante — não precisa de nenhuma ferramenta externa de inspeção BLE.
- **Leitor NFC**: encosta o crachá na parte de trás do celular pra ler a tag NFC (UID +
  NDEF, se tiver). Se o UID bater com um MAC já visto no scan BLE, pula direto pro
  detalhe daquele crachá — bom pra identificar fisicamente qual é qual.

**Fora de escopo por enquanto:** escrever configuração / desligar remotamente,
múltiplos usuários, backend, integração com sistemas externos.

## Stack

- React Native + Expo (SDK 57)
- [`react-native-ble-manager`](https://github.com/innoveit/react-native-ble-manager) — scan/conexão BLE, com suporte à New Architecture
- [`react-native-nfc-manager`](https://github.com/revtel/react-native-nfc-manager) — leitura de tags NFC
- `@react-native-async-storage/async-storage` — persistência local (assinaturas de crachá aprendidas, apelidos)

## Como rodar

Esse app usa um módulo nativo de Bluetooth, então **o Expo Go não funciona** — é
preciso instalar um build próprio no celular. Duas formas:

### Opção A — build na nuvem (EAS), sem instalar nada de Android localmente

```bash
npm install
npm run eas:login          # login na conta Expo (grátis) pelo navegador
npm run build:android      # builda um APK na nuvem
```

Ao final, o terminal mostra um link/QR code — abra no celular (ou baixe o `.apk`
direto) e instale. Não precisa de cabo USB nem de Android Studio.

### Opção B — build local via USB

Exige Android SDK instalado (Android Studio, ou as command line tools):

```bash
npm install
npm run prebuild   # gera android/ e ios/ a partir da config do app.json
npm run android     # compila e instala no Android conectado via USB
```

## Estrutura

```
App.js                        # entrada, renderiza a ScanScreen
src/
  ble/
    permissions.js            # runtime permissions Android (BLUETOOTH_SCAN/CONNECT ou location)
    uuid.js                   # normalização de UUID + constantes do Battery Service
    distance.js               # RSSI -> distância aproximada
    badgeSignature.js         # heurística de reconhecimento de crachá por nome
    eddystoneTlm.js            # parse do frame de bateria/temperatura no advertising
    bytes.js                  # formatação hex/decimal de arrays de bytes
  nfc/
    nfcManager.js              # wrapper fino do react-native-nfc-manager
    ndef.js                    # decodificador de NDEF record (Texto/URI)
  hooks/
    useBleScanner.js          # toda a lógica de scan/conexão/leitura BLE
  storage/
    appStorage.js             # AsyncStorage: assinaturas de crachá aprendidas + apelidos
  components/
    DeviceCard.js, DeviceDetailModal.js, NfcReadModal.js, BatteryBadge.js,
    FilterToggle.js, EmptyState.js
  screens/
    ScanScreen.js              # tela única do MVP
```

## Como usar

1. Abra o app com Bluetooth ligado e toque em **Escanear** — deixe a lista aberta uns
   10-15s pra dar tempo de captar o frame de bateria de cada crachá por perto.
2. Se o filtro "Crachás" vier vazio (primeira vez), mude pra **Todos**, ligue um crachá
   MWC01 físico perto do celular e ache ele na lista.
3. Toque em **Marcar como crachá** nesse item — o app aprende e passa a filtrar por ele.
4. Toque num crachá pra abrir o detalhe: definir apelido, ver telemetria, ou explorar os
   services GATT/advertising bruto se precisar investigar algo.
5. Toque em **NFC** e encosta um crachá no celular pra ler a tag física dele.

## Troubleshooting

| Problema | Causa provável |
|----------|-----------------|
| App não acha nenhum dispositivo | Bluetooth desligado, permissão negada, ou nenhum crachá ligado por perto |
| Filtro "Crachás" sempre vazio | Ainda não foi ensinado — use "Todos" e "Marcar como crachá" num item que seja de fato um MWC01 |
| Bateria não aparece | O frame Eddystone-TLM não veio nesse ciclo de scan — escaneie de novo com a lista aberta por mais tempo |
| "Tentar via GATT padrão" dá erro | Esperado — a Minew não usa o Battery Service GATT padrão, só o advertising. Essa opção é um fallback avançado que raramente funciona |
| Distância muito imprecisa | RSSI varia com obstáculos/corpo/orientação do crachá — é uma referência de proximidade, não uma medição confiável |
| Botão NFC diz "sem NFC" | Celular sem NFC, ou NFC desligado nas configurações do Android |

## Status

MVP de leitura (v0.1) — uso pessoal, plataforma-alvo Android.
