# Relay-WS

> [!WARNING] \
> This project is neither stable nor actively developed.

Simple and minimalistic WebRTC signalling server based on
WebSocket.

## How to use

### Docker

```sh
$ docker buildx build -t <tag> -o type=docker .
$ docker run -dp 34098:34098 <tag>
```

### Docker Compose

```sh
$ docker compose up -d
```

### Build manually

```sh
$ corepack enable
$ pnpm install
$ pnpm build
$ pnpm run start
```

## How relay server works

```mermaid
sequenceDiagram
    autonumber
    actor pc1 as Peer 1
    participant sig as Relay Server
    actor pc2 as Peer 2
    pc1->>sig: Peer 1 Join
    Note over sig: Assign Unique ID for Peer 1:<br><peer1>
    pc1->>+sig: type: ls
    sig--)-pc1: peers: []
    pc2->>sig: Peer 2 Join
    Note over sig: Assign Unique ID for Peer 2:<br><peer2>
    pc2->>+sig: type: ls
    sig--)-pc2: peers: [<peer1>]
    pc2->>+sig: type: offer, to: <peer1>
    sig--)-pc1: type: offer, from: <peer2>
    pc1->>+sig: type: answer, to: <peer2>
    sig--)-pc2: type: answer, from: <peer1>
    loop ICE Candidate Exchange
        par Candidate from Peer 1
            pc1->>+sig: type: ice, to: <peer2>
            sig--)-pc2: type: ice, from: <peer1>
        and Candidate from Peer 2
            pc2->>+sig: type: ice, to: <peer1>
            sig--)-pc1: type: ice, from: <peer2>
        end
    end
    pc1-->>+sig: type: leave
    Note over pc1: Peer 1 exits
    par Broadcase
        sig--)-pc2: type: leave, from: <peer1>
    end
    pc2-->>sig: type: leave
    Note over pc2: Peer 2 exits
```

## Message table

### List

#### Request

| Name | Type   |
| ---- | ------ |
| type | `"ls"` |

#### Response

| Name  | Type   |
| ----- | ------ |
| type  | `"ls"` |
| peers | `ID[]` |

### Leave

#### Request

| Name | Type      |
| ---- | --------- |
| type | `"leave"` |

#### Response

| Name | Type      |
| ---- | --------- |
| type | `"leave"` |
| from | `ID`      |

### Offer

#### Request

| Name | Type      |
| ---- | --------- |
| type | `"offer"` |
| to   | `ID`      |
| sdp  | `string`  |

#### Response

| Name | Type      |
| ---- | --------- |
| type | `"offer"` |
| from | `ID`      |
| to   | `ID`      |
| sdp  | `string`  |

### Answer

#### Request

| Name | Type      |
| ---- | --------- |
| type | `"answer"` |
| to   | `ID`      |
| sdp  | `string`  |

#### Response

| Name | Type      |
| ---- | --------- |
| type | `"answer"` |
| from | `ID`      |
| to   | `ID`      |
| sdp  | `string`  |

### ICE candidate

#### Request

| Name | Type      |
| ---- | --------- |
| type | `"ice"` |
| to   | `ID`      |
| sdp  | `string`  |

#### Response

| Name | Type      |
| ---- | --------- |
| type | `"ice"` |
| from | `ID`      |
| to   | `ID`      |
| sdp  | `string`  |
