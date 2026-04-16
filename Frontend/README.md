# Exchange Frontend - Real-time Trading Platform

A **React + TypeScript + Tailwind CSS** frontend for a real-time trading exchange with live order book updates, order placement, and trade streaming.

## 🎯 What This Teaches You

This is a **complete learning project** designed to teach you:

- **React Fundamentals** - Hooks (useState, useEffect, useCallback, useContext)
- **TypeScript** - Type safety, interfaces, generics
- **Real-time Communication** - WebSocket subscriptions + REST API
- **State Management** - Hooks-based architecture (no Redux)
- **Component Architecture** - Composition, reusability, separation of concerns
- **Modern CSS** - Tailwind CSS utility-first design
- **Form Handling** - Validation, loading states, error handling

Perfect for your **portfolio** - shows understanding of React fundamentals and modern web architecture.

## 📋 Features

✅ Live order book display (bids & asks with heat maps)
✅ Real-time price updates via WebSocket
✅ Buy/Sell order placement forms
✅ Open orders list with cancel functionality
✅ Recent trades feed (real-time stream)
✅ Market switcher (TATA_INR, RELIANCE_INR, INFY_INR)
✅ Connection status indicator
✅ Error handling and loading states
✅ Dark theme (trading UI standard)

## 🚀 Getting Started

### 1. Quick Setup
```bash
cd /Users/sanjayraj/Desktop/E/frontend
npm install
npm start
```

Opens http://localhost:3000

### 2. Build It Yourself

Follow `SETUP_GUIDE.md` for **complete step-by-step instructions**:
- Every file path
- Complete code for each file
- Explanations of what you're learning
- Why each file is needed

### 3. Understand the Architecture

See `QUICK_START.md` for overview of:
- File creation order
- Component structure
- Data flow (REST + WebSocket)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── types.ts                 # All TypeScript interfaces
│   ├── services/
│   │   ├── api.ts               # REST API wrapper
│   │   └── websocket.ts         # WebSocket manager
│   ├── hooks/                   # Custom hooks (business logic)
│   │   ├── useWebSocket.ts
│   │   ├── useApi.ts
│   │   ├── useOrderBook.ts
│   │   ├── useTrades.ts
│   │   └── useOrders.ts
│   ├── components/
│   │   ├── Layout/              # Page structure
│   │   ├── OrderBook/           # Order book display
│   │   ├── TradePanel/          # Buy/Sell forms
│   │   ├── Orders/              # User's orders
│   │   ├── Trades/              # Trade history
│   │   └── Common/              # Reusable components
│   ├── App.tsx                  # Root component
│   ├── index.tsx                # React entry point
│   └── App.css                  # Global styles
├── public/
│   └── index.html               # HTML entry point
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── SETUP_GUIDE.md               # Step-by-step build guide
```

## 🔗 Data Flow

### Order Book Example

```
OrderBook Component
    ↓
useOrderBook Hook
    ├─ REST API: GET /api/v1/depth (initial load)
    └─ WebSocket: subscribe('depth@TATA_INR') (real-time)
        ↓
    setState({ bids, asks })
        ↓
    BidTable & AskTable Components
        ↓
    Browser Display
```

### Order Placement Example

```
BuyForm Component
    ↓
User clicks "Place Buy Order"
    ↓
apiService.createOrder()
    ↓
REST API: POST /api/v1/order
    ↓
Backend processes order
    ↓
Response: { orderId, executedQty, fills }
    ↓
Show success message
    ↓
Parent component refetches orders
```

## 🎓 What You'll Learn

### Hooks Mastery
- `useState` - Local component state
- `useEffect` - Side effects (fetch, cleanup)
- `useCallback` - Stable function references
- Custom hooks - Encapsulate logic

```typescript
// Custom hook example
export function useOrderBook(market: string) {
  const [state, setState] = useState(...)

  useEffect(() => {
    // Fetch initial data
    fetchDepth()
  }, [market])

  // Subscribe to real-time updates
  useWebSocket(channel, handleUpdate)

  return { bids, asks, loading, error, isLive }
}
```

### TypeScript for Safety
- Interfaces for data structures
- Type checking at compile time
- Prevents bugs before runtime

```typescript
interface Order {
  orderId: string
  market: string
  price: string // String to avoid floating-point errors
  side: 'buy' | 'sell' // Union types catch mistakes
}
```

### Real-time Architecture
- REST API for initial loads
- WebSocket for live updates
- Connection management (reconnect, queue messages)

```typescript
// Hybrid approach
const { bids } = useOrderBook(market)
// ↑ Initially loaded via REST API
// ↑ Then updated in real-time via WebSocket
```

### Component Design
- Composition over inheritance
- Props-based configuration
- Separation of concerns

```typescript
// Complex component = smaller, focused pieces
<TradePanel market={market} userId={userId} />
  ├─ <BuyForm /> (handles buy logic)
  └─ <SellForm /> (handles sell logic)
```

## 🛠 Technology Stack

- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Tailwind CSS 3** - Utility-first styling
- **Fetch API** - REST calls (no axios needed)
- **WebSocket API** - Real-time updates
- **React Scripts** - Build tooling (webpack, babel)

## 📚 Learning Path

1. **Start** → Install dependencies (`npm install`)
2. **Follow** → `SETUP_GUIDE.md` step by step
3. **Understand** → Why each file is needed
4. **Experiment** → Modify components, add features
5. **Deploy** → Push to GitHub, deploy to Vercel/Netlify

## 🚀 Next Steps

After you build this:

1. **Add Charts** - TradingView Lightweight Charts
2. **Add Auth** - JWT token authentication
3. **Add Portfolio** - Balance, P&L, holdings
4. **Add History** - Order history, trade history
5. **Deploy** - Vercel, Netlify, or your own server

## 💡 Pro Tips for Learning

1. **Read the code** - Understand what each line does
2. **Modify it** - Change styles, add features
3. **Use browser devtools** - Inspect React components, Network tab
4. **Check console** - See WebSocket messages, API calls
5. **Build incrementally** - Get one feature working before next

## 🔧 Troubleshooting

**npm install fails?**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Port 3000 taken?**
```bash
kill -9 $(lsof -t -i:3000)
npm start
```

**Backend not responding?**
- Ensure backend is running on port 3000
- Check `curl http://localhost:3000/api/v1/depth?symbol=TATA_INR`

**TypeScript errors?**
- Check imports in error message
- Verify file paths match
- Look at `src/types.ts` for interface definitions

## 📖 Documentation

- `SETUP_GUIDE.md` - Complete step-by-step build guide with all code
- `QUICK_START.md` - Quick reference and overview
- Code comments - Explanations in every file

## 🎯 Portfolio Tips

This project is **excellent for portfolios** because:

✅ Shows React fundamentals (hooks, composition)
✅ Demonstrates TypeScript usage
✅ Real-world architecture (REST + WebSocket)
✅ Professional UI/UX (dark theme, responsive)
✅ Clean code organization
✅ Type safety and error handling
✅ Shows understanding of modern web development

Share the GitHub repo and highlight:
- Component architecture
- Hook-based state management
- Real-time data handling
- Type safety with TypeScript
- Professional UI design

## 📝 License

Build this as part of your learning journey. It's yours to customize and deploy!

---

**Ready to build?** Start with `SETUP_GUIDE.md` for complete instructions.

**Questions?** Check the code comments and the architecture diagrams above.

Happy coding! 🚀
