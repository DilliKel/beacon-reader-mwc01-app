# Beacon Reader MWC01

App pessoal (React Native + Expo) pra escanear crachás Minew MWC01 por Bluetooth
Low Energy e ver bateria, sinal e distância aproximada — sem a interface confusa
do app proprietário.

> O documento original que inspirou o projeto está em [`DOC-ORIGINAL.md`](./DOC-ORIGINAL.md).
> Ele tem informações inventadas (prazo, deadline de apresentação) e alguns detalhes
> técnicos errados — não usar como referência técnica, só como histórico.

## ⚠️ Antes de rodar: Expo Go NÃO funciona

Esse app usa `react-native-ble-manager`, que tem código nativo. O Expo Go (app da
loja) só roda projetos 100% JS — com um módulo nativo customizado, ele não carrega.
É preciso gerar um **build de desenvolvimento** (dev build), que já resolve isso:

```bash
# gera as pastas nativas (android/ e ios/) a partir da config do app.json
npm run prebuild

# compila e instala no Android conectado via USB (ou emulador)
npm run android
```

Isso exige o Android SDK instalado (Android Studio, ou pelo menos as command line
tools) — o `expo run:android` precisa dele pra compilar. Se preferir não instalar
nada localmente, dá pra usar o `eas build --profile development --platform android`
(build na nuvem da Expo, precisa de conta gratuita).

## ⚠️ Sobre a pasta OneDrive com "&" no nome

O caminho deste projeto (`...\OneDrive - F&S Holding S.A\...`) tem um `&`, e isso
quebra o `npx` no Windows (`npx expo ...` falha com erro de módulo não encontrado
— o `&` é interpretado como separador de comando pelo `cmd.exe`). Por isso os
scripts do `package.json` chamam `node node_modules/expo/bin/cli ...` diretamente
em vez de `npx expo ...`, contornando o problema.

Isso também provavelmente é a causa de erros de "acesso negado" ao tentar
mover/renomear a pasta do projeto — o OneDrive fica sincronizando os milhares de
arquivos do `node_modules` e prende arquivos em uso.

**Recomendação:** mover este projeto pra fora do OneDrive (ex: `C:\dev\beacon-reader-mwc01`)
antes de continuar. Evita esse bug do `&`, e evita o OneDrive tentar sincronizar
`node_modules` (lento, gera conflitos, não serve pra nada ser sincronizado).

## 🎯 O que o app faz (MVP — só leitura)

- Escaneia dispositivos BLE por perto e lista ordenado por proximidade (RSSI).
- Filtro "Crachás" (reconhecidos pelo nome) vs. "Todos" (todo dispositivo BLE ao redor).
- Ao tocar em "Ler bateria": conecta, lê o nível de bateria (Battery Service padrão
  Bluetooth, `0x180F`/`0x2A19`) e desconecta.
- Mostra MAC/id, RSSI e distância aproximada (`10^((txPower - RSSI)/20)`).
- **"Marcar como crachá"**: se o filtro "Crachás" não achar nada, mude pra "Todos",
  ache o crachá físico na lista (ligue-o, veja o nome que aparece) e toque nesse
  botão — o app aprende esse nome e passa a reconhecer como crachá dali em diante.
  Isso substitui a etapa de "inspecionar com nRF Connect" do plano original: o
  próprio app serve de ferramenta de descoberta.

**Fora de escopo por enquanto:** escrever configuração / desligar remotamente,
múltiplos usuários, backend, integração com Meraki ou sistemas de RH. Ver o plano
completo salvo em `C:\Users\PORTOS\.claude\plans\oi-claude-d-uma-clever-thunder.md`.

## 📁 Estrutura

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

## 🔍 Troubleshooting

| Problema | Causa provável |
|----------|-----------------|
| `npx expo ...` dá erro de módulo não encontrado | Bug do `&` no caminho do OneDrive — use `npm run <script>` (já corrigido) ou mova o projeto pra fora do OneDrive |
| App não acha nenhum dispositivo | Bluetooth desligado, permissão negada, ou nenhum crachá ligado por perto |
| Filtro "Crachás" sempre vazio | Ainda não foi ensinado — mude pro filtro "Todos" e use "Marcar como crachá" num item que seja de fato um MWC01 |
| "Ler bateria" dá erro | Nem todo firmware do MWC01 expõe o Battery Service padrão — testar `retrieveServices` e ver o que o crachá realmente anuncia |
| Distância muito imprecisa | RSSI varia com obstáculos/corpo/orientação do crachá — é só uma referência de proximidade, não uma medição confiável |

## 📝 Status

MVP de leitura (v0.1) — uso pessoal, plataforma-alvo Android.
