# 📡 Projeto: Beacon Reader MWC01
## Documentação Executiva para Implementação

**Data:** 19/08/2026 até 31/08/2026 (12 dias)  
**Local:** Boa Vista, RR / Construtora Porto  
**Contexto:** Exploração técnica de cartões Minew MWC01 durante período ocioso antes chegada de Robson Gomes (31/08)  
**Objetivo:** MVP funcional de leitura/controle de cartões para apresentação

---

## 🎯 Visão Geral

### O Problema
Construtora Porto usa 300 cartões inteligentes Minew MWC01 para georeferenciamento de pessoal. Atualmente gerenciados via app proprietário BeaconSET Plus. Você quer explorar se é viável criar uma solução customizada para facilitar leitura/reconfiguração em massa.

### A Solução MVP
App mobile React Native que:
- ✅ Escaneia e identifica cartões MWC01 por BLE
- ✅ Lê MAC address de cada cartão
- ✅ Extrai nível de bateria em tempo real
- ✅ Calcula distância aproximada via RSSI (sinal Bluetooth)
- ✅ Liga/desliga cartão remotamente via comando BLE
- ✅ Exibe dados em interface clean + responsiva

### Por Que Isso Importa
- **No 90-day Porto:** demonstra iniciativa, capacidade técnica, visão de otimização
- **Portfolio:** projeto real de IoT + mobile + Bluetooth = diferencial raro
- **Carreira:** coloca você como "o cara de IA + DevOps + IoT" (trilha infraestrutura)

---

## 📋 Stack Técnico

```
Frontend:        React Native + Expo (roda Android/iOS zero setup)
Bluetooth:       react-native-ble-plx (gerencia conexões BLE)
Hardware:        Minew MWC01 (cartões físicos para test)
Versionamento:   Git + GitHub (repo público)
Deploy:          Expo Go (test local) → APK (Android)
IDE:             VS Code + Claude Code
```

---

## 🗓️ Timeline Comprimida (12 dias)

### Semana 1: Foundation
| Dia | Tarefa | Entregável |
|-----|--------|-----------|
| 19–20 (Dom-Seg) | Setup Expo + primeira integração BLE | Projeto rodando, scaneia devices genéricos |
| 21–22 (Ter-Qua) | Identifica MWC01 specificamente via UUID/name | Lista de cartões encontrados na tela |
| 23–24 (Qui-Sex) | Leitura de bateria + MAC address | "Bateria: 85% \| MAC: XX:XX:XX:XX:XX:XX" |

### Semana 2: Features + Polimento
| Dia | Tarefa | Entregável |
|-----|--------|-----------|
| 25–26 (Sab-Dom) | RSSI → cálculo de distância | "Distância: ~2.5m" funcional |
| 27–28 (Seg-Ter) | Descobre + implementa comando de desligar | Botão "Power Off" que funciona |
| 29–30 (Qua-Qui) | UI polida, tratamento de erros, README | Código pronto pra produção |
| 31 (Sex) | **Teste final + apresentação Robson** | ✅ MVP Live Demo |

---

## 📱 Roadmap Técnico Detalhado

### FASE 1: Setup + Scaffolding (Dia 19–20)

**Objetivo:** Projeto rodando, consegue fazer BLE scan básico

**Passos:**
```bash
# 1. Criar projeto
npx create-expo-app beacon-reader-mwc01
cd beacon-reader-mwc01

# 2. Instalar dependências
npm install react-native-ble-plx
npx expo install expo-permissions

# 3. Inicializar Git
git init
git add .
git commit -m "initial: expo scaffold"
git remote add origin https://github.com/DilliKel/beacon-reader-mwc01.git
git push -u origin main
```

**Arquivo inicial: `App.js`**
```javascript
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export default function App() {
  const [status, setStatus] = useState('Pronto para scanear');

  const handleScan = async () => {
    setStatus('Escaneando...');
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setStatus(`Erro: ${error.message}`);
        return;
      }
      if (device && device.name) {
        console.log('Device encontrado:', device.name, device.id);
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setStatus('Scan completo');
    }, 5000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📡 Beacon Reader MWC01</Text>
        <Text style={styles.subtitle}>Leitor Minew Smart Badge</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.status}>{status}</Text>
        <Button title="Iniciar Scan" onPress={handleScan} color="#2563eb" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#1e293b' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#cbd5e1' },
  card: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  status: { fontSize: 16, marginBottom: 20, color: '#64748b' }
});
```

**Check:** Rodar `npx expo start`, abrir Expo Go no telefone, ver "Pronto para scanear"

---

### FASE 2: Identify MWC01 + Display (Dia 21–24)

**Objetivo:** Scaneia, acha cartões MWC01, exibe lista com MAC

**Passo 1: Expand App.js com state de devices**
```javascript
const [devices, setDevices] = useState([]);

const startScan = async () => {
  setScanning(true);
  setDevices([]);

  manager.startDeviceScan(null, null, (error, device) => {
    if (error) return;

    // Filtra só MWC01 (UUID service 180A = Device Info)
    if (device.name && device.name.includes('MWC')) {
      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        if (exists) return prev;
        return [...prev, {
          id: device.id,
          name: device.name,
          mac: device.id,
          rssi: device.rssi || -100,
          connected: false,
          battery: null
        }];
      });
    }
  });

  setTimeout(() => {
    manager.stopDeviceScan();
    setScanning(false);
  }, 10000);
};
```

**Passo 2: Renderizar lista**
```javascript
import { FlatList } from 'react-native';

// Na UI:
<FlatList
  data={devices}
  keyExtractor={item => item.id}
  renderItem={({ item }) => (
    <View style={styles.deviceCard}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceMac}>MAC: {item.mac.slice(-12)}</Text>
      <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
    </View>
  )}
  ListEmptyComponent={
    <Text style={styles.empty}>Nenhum cartão encontrado</Text>
  }
/>
```

**Check:** Ligar 2–3 cartões, fazer scan, aparecem na tela com MAC

---

### FASE 3: Battery + Distance (Dia 25–26)

**Objetivo:** Conecta em cada device, lê bateria, calcula distância

**Passo 1: Função helper de distância**
```javascript
// RSSI → Distância em metros
// Fórmula: distance = 10^((txPower - RSSI) / (10 * 2))
// txPower típico MWC01 = -59 dBm
const calculateDistance = (rssi, txPower = -59) => {
  if (!rssi) return null;
  return Math.pow(10, (txPower - rssi) / 20).toFixed(1);
};
```

**Passo 2: Função conectar + ler bateria**
```javascript
const connectAndReadBattery = async (deviceId) => {
  try {
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    // Battery Service (UUID 180F) + Battery Level Char (UUID 2A19)
    // Standard Bluetooth Low Energy spec
    const batteryChar = await device.readCharacteristicForService('180F', '2A19');
    
    // Parse valor (hex string → percentual)
    const batteryLevel = parseInt(batteryChar.value, 16);

    // Update device na lista
    setDevices(prev => prev.map(d => 
      d.id === deviceId 
        ? { ...d, battery: batteryLevel, connected: true }
        : d
    ));

    await manager.cancelDeviceConnection(deviceId);
  } catch (error) {
    console.error('Erro leitura bateria:', error);
    alert(`Erro ao conectar: ${error.message}`);
  }
};
```

**Passo 3: Atualizar renderização**
```javascript
<View style={styles.deviceCard}>
  <Text style={styles.deviceName}>{item.name}</Text>
  <Text style={styles.deviceMac}>MAC: {item.mac.slice(-12)}</Text>
  <Text style={styles.deviceRssi}>RSSI: {item.rssi} dBm</Text>
  
  {/* NEW: Distância */}
  <Text style={styles.deviceDistance}>
    📏 Distância: ~{calculateDistance(item.rssi)}m
  </Text>

  {/* NEW: Bateria (após conectar) */}
  {item.battery !== null && (
    <Text style={[styles.deviceBattery, item.battery < 20 && styles.batteryLow]}>
      🔋 Bateria: {item.battery}%
    </Text>
  )}

  {/* Botão conectar */}
  <Button 
    title={item.connected ? "✅ Conectado" : "Ler Bateria"}
    onPress={() => connectAndReadBattery(item.id)}
    disabled={item.connected}
  />
</View>
```

**Check:** Tap em "Ler Bateria" → aparece "Bateria: 85%" na tela

---

### FASE 4: Power Off Command (Dia 27–28)

**Objetivo:** Implementar botão de desligar cartão remotamente

**Pesquisa prévia necessária:**
- Baixar datasheet MWC01 de https://docs.minew.com/
- Procurar por: "Power Control" ou "Shutdown Command"
- Típico: Service UUID (tipo `180A`) + Command Char (tipo `XXXX`)
- Valor: algo como `0x01` ou string base64

**Implementação genérica (adjust conforme SDK):**
```javascript
const powerOffDevice = async (deviceId) => {
  try {
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    // ⚠️ SUBSTITUIR pelos UUIDs corretos do datasheet MWC01
    const serviceUUID = '180A'; // Device Information Service (exemplo)
    const charUUID = 'XXXX';    // Control Characteristic (TO FIND)

    // Envia comando de desligar (hex: 0x01 ou 0x00, depende do firmware)
    const powerOffCommand = 'AQ=='; // base64 de 0x01

    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      charUUID,
      powerOffCommand
    );

    alert('Cartão desligado com sucesso!');

    setDevices(prev => prev.map(d =>
      d.id === deviceId 
        ? { ...d, connected: false, battery: null }
        : d
    ));

    await manager.cancelDeviceConnection(deviceId);
  } catch (error) {
    console.error('Erro power off:', error);
    alert(`Falha ao desligar: ${error.message}`);
  }
};
```

**Na UI, adicionar:**
```javascript
{item.connected && (
  <Button
    title="❌ Desligar Cartão"
    onPress={() => powerOffDevice(item.id)}
    color="#dc2626"
  />
)}
```

**Check:** Desligar um cartão, sumir da lista no próximo scan

---

## 📚 Referências Críticas

### Minew SDK + Docs
- **Docs oficial:** https://docs.minew.com/
- **Datasheet MWC01:** Procurar em "Product → Personnel Tag → MWC01"
- **SDK React Native:** npm package `react-native-ble-plx`

### BLE Specs (Standard)
- **Battery Service:** UUID `180F` (Bluetooth SIG)
- **Battery Level Char:** UUID `2A19` (read-only, 0–100%)
- **Device Info Service:** UUID `180A` (pode ter power control)

### Calculadora RSSI → Distância
```
Fórmula: distance(m) = 10^((txPower - RSSI) / 20)

Onde:
- txPower = potência de transmissão da tag (típico: -40 a -60 dBm)
- RSSI = força de sinal recebido (em dBm, negativo)
- Resultado = distância em metros (aproximado, ±10–20% erro)

Exemplo: RSSI = -70, txPower = -59 → distance = 10^((-59 - (-70)) / 20) = 10^(0.55) ≈ 3.5m
```

---

## 🚀 Como Usar Este Documento com Claude VSCode

### Prompt Recomendado:
```
Você é especialista em React Native + Bluetooth Low Energy.

Estou criando um app Expo pra ler cartões Minew MWC01.

CONTEXTO:
- 300 cartões físicos disponíveis pra testar
- 12 dias pra MVP funcional (19-31/08)
- Objetivo: scanear, ler MAC, bateria, calcular distância, ligar/desligar
- Stack: React Native + Expo + react-native-ble-plx

ROADMAP TÉCNICO:
[Cole a seção "Roadmap Técnico Detalhado" acima]

TAREFAS HOJE:
1. Criar App.js base (FASE 1: Setup + Scaffolding)
2. Testar scan em cartão MWC01 físico

Ajude-me a:
- Implementar corretamente a lógica BLE
- Tratar erros de conexão/timeout
- Otimizar re-renders (FlatList performance)
- Estruturar código pra escalabilidade
```

---

## 📖 README.md (salvar no repo)

```markdown
# Beacon Reader MWC01

Leitor mobile de cartões inteligentes Minew MWC01 construído com React Native + Expo.

## 🎯 Features

- ✅ Scan de cartões MWC01 via Bluetooth Low Energy
- ✅ Identificação por MAC address
- ✅ Leitura em tempo real de nível de bateria
- ✅ Cálculo de distância aproximada (RSSI)
- ✅ Comando de power off remoto
- ✅ UI limpa + responsiva

## 🛠️ Tech Stack

- **React Native** + Expo
- **react-native-ble-plx** (BLE manager)
- **GitHub** (versionamento)

## 📱 Instalação

```bash
# Clone
git clone https://github.com/DilliKel/beacon-reader-mwc01.git
cd beacon-reader-mwc01

# Instalar deps
npm install

# Rodar no Expo
npx expo start
# Abrir Expo Go no Android/iOS e scanear QR code
```

## 📡 Como Usar

1. **Ligar 2–3 cartões MWC01** perto do dispositivo
2. **Tap "Iniciar Scan"** — lista vai aparecer em ~10s
3. **Tap "Ler Bateria"** — conecta e exibe nível
4. **Ver "Distância"** — calculada automaticamente via RSSI
5. **Tap "Desligar Cartão"** — power off remoto

## 🔍 Troubleshooting

| Problema | Solução |
|----------|---------|
| App não acha cartões | Verificar Bluetooth ON no device; ligar cartões MWC01 |
| "Erro ao conectar" | Aumentar timeout; testar em cartão diferente |
| Bateria não aparece | Alguns MWC01 podem não ter Battery Service; verificar firmware |

## 📝 Status

**Versão:** 0.1.0 (MVP)  
**Data:** 19–31/08/2026  
**Próximas features:** Dashboard de múltiplos cartões, export CSV, reconfiguração em massa

## 📧 Contato

Kelvin Araújo | kelvin.boxmail@gmail.com | [GitHub](https://github.com/DilliKel)
```

---

## ✅ Checklist de Implementação

- [ ] Dia 19: Repo criado, Expo rodando, scan básico funciona
- [ ] Dia 21: MWC01 identificados + lista renderizando
- [ ] Dia 23: Leitura de bateria OK
- [ ] Dia 25: Distância (RSSI) calculada
- [ ] Dia 27: Power off implementado + testado em 5+ cartões
- [ ] Dia 29: UI polida, README completo
- [ ] Dia 31: Live demo com Robson ✅

---

## 🎬 Próximos Passos (Hoje 19/08)

**Ordem de ação:**
1. **Cria repo GitHub** com nome `beacon-reader-mwc01`
2. **Setup Expo + BLE** (Passo 1 acima)
3. **Testa com um cartão MWC01** — consegue fazer scan?
4. **Volta aqui com screenshot** da tela mostrando cartão encontrado
5. **Próxima fase:** implementa leitura de bateria

---

**Documentação versão 1.0 | 19/08/2026**  
**Pronto pra jogar no Claude VSCode**