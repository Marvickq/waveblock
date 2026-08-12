# WaveBlock

https://waveblock.onrender.com

> Know the Risk Before You Swap.

WaveBlock is an AI-powered Web3 security assistant that helps users analyze a token before interacting with it. It combines blockchain data, smart-contract signals, token metrics, and AI-generated explanations into a single Trust Report.

Built to make complex blockchain security information understandable for everyday crypto users.

## Why this exists

Interacting with a new crypto token can take seconds.

Understanding whether that token deserves your trust can take much longer.

Experienced crypto users can investigate smart contracts, ownership, liquidity, holder distribution, and other on-chain signals across multiple tools. For beginners, these signals are scattered, technical, and difficult to interpret.

WaveBlock takes a different approach:

* **Pre-swap analysis.** Analyze a token before interacting with it.
* **One Trust Report.** Bring important token and blockchain signals into one place.
* **AI-powered explanations.** Convert technical blockchain information into understandable insights.
* **Risk-focused analysis.** Highlight potential warning signs instead of simply displaying raw blockchain data.
* **On-chain verification.** Cryptographic hashes of Trust Reports can be recorded through a Solidity-based trust registry.
* **Built for transparency.** WaveBlock is designed to communicate potential risks rather than guarantee that a token is safe.

## How it works

```text
User
  │
  │ Token Contract Address
  ▼
WaveBlock
  │
  ├── Token & Blockchain Data
  │
  ├── Contract Verification
  │
  ├── Ownership Analysis
  │
  ├── Liquidity Analysis
  │
  ├── Holder Distribution
  │
  ▼
Risk Analysis
  │
  ▼
AI Trust Report
  │
  ▼
User understands potential risks
before interacting with the token
```

The user enters a token contract address.

WaveBlock retrieves relevant blockchain and token information and evaluates multiple risk signals. The resulting data is structured into a Trust Report, while the AI layer helps explain what those signals could mean to the user.

The goal is not to make an absolute claim that a token is "safe" or a "scam."

Instead, WaveBlock answers:

> **What should I know about this token before I interact with it?**

## Core Features

### Token Analysis

Enter a token contract address and retrieve relevant blockchain and token information.

### Smart Contract Signals

Analyze contract-related information such as verification and ownership status.

### Liquidity Analysis

Surface liquidity-related information that can help users understand potential exit and trading risks.

### Holder Concentration

Analyze token distribution and highlight potentially concerning concentration among holders.

### AI Trust Report

Transform multiple technical signals into an understandable report with risk explanations.

### Risk Indicators

Present potential warning signs without pretending that a single metric can determine whether a token is safe.

### Blockchain Trust Registry

WaveBlock includes a Solidity smart contract that can store a cryptographic hash of a Trust Report.

The complete report does not need to be stored on-chain. Instead, the hash provides a way to verify the integrity of a report.

## How we built it

WaveBlock is built as a Next.js application with a TypeScript and React frontend and server-side API routes.

### Frontend

The application uses:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Framer Motion

The frontend provides the token analysis interface, Trust Report visualization, wallet interactions, and risk indicators.

### Blockchain layer

The blockchain integration uses:

* Ethereum / EVM-compatible infrastructure
* `ethers.js`
* Solidity

`ethers.js` is responsible for communicating with the blockchain and retrieving token-related information.

The Solidity trust registry provides an on-chain mechanism for recording cryptographic hashes of Trust Reports.

### Backend

Next.js API routes handle:

* Token analysis
* Blockchain data retrieval
* Authentication
* AI requests
* Trust Report generation
* Database operations

### Database

Prisma is used as the ORM for managing application data such as users, wallets, analyses, and Trust Reports.

### Authentication

WaveBlock uses wallet-oriented authentication and session management to support Web3 users.

## Technology Stack

| Layer           | Technology      |
| --------------- | --------------- |
| Framework       | Next.js         |
| Frontend        | React           |
| Language        | TypeScript      |
| Styling         | Tailwind CSS    |
| Animation       | Framer Motion   |
| Blockchain      | Ethereum / EVM  |
| Smart Contracts | Solidity        |
| Web3            | ethers.js       |
| Authentication  | NextAuth / SIWE |
| ORM             | Prisma          |
| Database        | PostgreSQL      |
| Validation      | Zod             |
| Runtime         | Node.js         |
| Deployment      | Render          |

## Project Structure

```text
waveblock/
│
├── app/
│   ├── api/
│   │   ├── ...
│   │   └── ...
│   ├── ...
│   └── page.tsx
│
├── components/
│   ├── ...
│   └── ...
│
├── contracts/
│   └── WaveBlockTrustRegistry.sol
│
├── lib/
│   ├── ethers.ts
│   ├── prisma.ts
│   ├── siwe.ts
│   ├── session.ts
│   ├── ai.ts
│   ├── analysis.ts
│   └── validation.ts
│
├── prisma/
│   └── schema.prisma
│
├── public/
│   └── ...
│
├── types/
│   └── ...
│
├── package.json
└── README.md
```

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Marvickq/waveblock.git
cd waveblock
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
```

Configure the required environment variables.

Example:

```env
NEXTAUTH_SECRET=your_32_character_or_longer_secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
RPC_URL=your_rpc_url
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

| Variable                               | Required | Purpose                                 |
| -------------------------------------- | -------- | --------------------------------------- |
| `NEXTAUTH_SECRET`                      | Yes      | Authentication/session security         |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes*     | Wallet connectivity                     |
| `ETHERSCAN_API_KEY`                    | Optional | Contract verification / blockchain data |
| `RPC_URL`                              | Yes      | Ethereum/EVM blockchain RPC             |
| AI provider key                        | Yes*     | AI Trust Report generation              |

> Environment variable names may differ depending on the current implementation. Never commit `.env` or `.env.local` files or expose private API keys.

## Challenges we ran into

### Making blockchain data understandable

The biggest challenge was not simply retrieving blockchain data.

The harder problem was deciding how to communicate it.

A metric such as holder concentration does not automatically mean a token is malicious. Contract verification does not automatically make a token safe either.

WaveBlock therefore focuses on **potential risk signals rather than absolute conclusions**.

### AI reliability

The AI layer introduced challenges involving model availability, API quotas, latency, and response reliability.

This taught us that AI should act as an **interpretation layer**, while deterministic blockchain information remains the foundation of the analysis.

### Wallet authentication

Wallet authentication is fundamentally different from traditional username/password authentication.

Connecting a wallet, signing messages, creating sessions, and maintaining authentication across the application required additional debugging and testing.

### Production deployment

The application worked differently in production compared with local development.

One example was a production build failure caused by an invalid `NEXTAUTH_SECRET`:

```text
NEXTAUTH_SECRET must be at least 32 characters
```

This reinforced the importance of treating environment configuration and deployment security as part of the application itself.

### Avoiding false security claims

One of the most important product challenges was avoiding the temptation to label tokens simply as "safe" or "scam."

Crypto risk is contextual.

WaveBlock therefore presents multiple signals and explanations so that users can make a more informed decision.

## Accomplishments that we're proud of

* Built an end-to-end blockchain token analysis platform.
* Created an AI-powered Trust Report.
* Integrated multiple blockchain risk signals into one workflow.
* Built a Solidity-based Trust Registry.
* Connected the frontend with blockchain infrastructure.
* Implemented wallet-based authentication.
* Built the application using a modern Next.js architecture.
* Deployed the application to a production environment.
* Worked through real-world authentication, API, environment, and deployment challenges.

Most importantly, WaveBlock is built around a specific user decision:

> **Should I understand this token better before I interact with it?**

## What we learned

Building WaveBlock taught us that blockchain security cannot be reduced to one metric.

A meaningful risk assessment requires multiple signals to be considered together.

We also learned that AI is most valuable when it helps users **understand complex information**, rather than replacing the underlying source of truth.

Key lessons:

* Blockchain data needs context before it becomes useful.
* AI should complement deterministic data, not replace it.
* Security products should communicate uncertainty honestly.
* Wallet authentication requires a different security model.
* Environment variables and secrets are critical parts of production deployment.
* A technically impressive system is only useful if users can understand the information it provides.

## What's next for WaveBlock

WaveBlock currently focuses on token-level pre-swap analysis.

The next stage is to make the security analysis deeper and more proactive:

* **Deployer wallet analysis**
* **Historical transaction analysis**
* **Liquidity-lock analysis**
* **Contract vulnerability detection**
* **Advanced holder-cluster analysis**
* **Multi-chain support**
* **Real-time token monitoring**
* **Explainable risk scoring**
* **Transaction simulation before signing**
* **On-chain verification of Trust Reports**

The long-term vision is to make WaveBlock a **security intelligence layer between users and blockchain transactions**.

Before a user clicks **Swap**, WaveBlock should help them understand what they are about to interact with.

## Disclaimer

WaveBlock is an analytical tool and does not guarantee that a token is safe, legitimate, or profitable.

Blockchain signals and AI-generated assessments can be incomplete or inaccurate. Users should perform their own research and make their own financial decisions.

## License

MIT
